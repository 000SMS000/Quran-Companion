<?php

namespace App\Services\Quran;

use Illuminate\Http\Client\Factory as HttpFactory;
use Illuminate\Support\Facades\Cache;
use RuntimeException;

class MokhtasrTafsirService
{
    public function __construct(
        private readonly HttpFactory $http,
    ) {
    }

    public function getAyahTafsir(int $surah, int $ayah): array
    {
        $bookIds = config('mokhtasr.books', ['ar' => 200, 'en' => 319]);
        $missingLanguages = [];

        foreach ($bookIds as $language => $bookId) {
            $unitKey = Cache::get($this->ayahLookupKey($surah, $ayah, (string) $language));

            if (!is_string($unitKey) || !Cache::has($unitKey)) {
                $missingLanguages[] = (string) $language;
            }
        }

        if ($missingLanguages !== []) {
            $this->fetchAndCacheBooks($surah, $ayah, $missingLanguages);
        }

        $books = [];

        foreach ($bookIds as $language => $bookId) {
            $unitKey = Cache::get($this->ayahLookupKey($surah, $ayah, (string) $language));
            $book = is_string($unitKey) ? Cache::get($unitKey) : null;

            if (!is_array($book)) {
                throw new RuntimeException(
                    sprintf('Mokhtasr tafsir is unavailable for language "%s".', $language),
                    502,
                );
            }

            $books[] = $book;
        }

        return [
            'surah' => $surah,
            'requestedAyah' => $ayah,
            'books' => $books,
        ];
    }

    protected function fetchAndCacheBooks(int $surah, int $ayah, array $languages): void
    {
        $token = (string) config('mokhtasr.token');

        if ($token === '') {
            throw new RuntimeException(
                'Mokhtasr API token is not configured.',
                503,
            );
        }

        $allBookIds = config('mokhtasr.books', ['ar' => 200, 'en' => 319]);
        $requestedBookIds = [];

        foreach ($languages as $language) {
            if (isset($allBookIds[$language])) {
                $requestedBookIds[$language] = (int) $allBookIds[$language];
            }
        }

        if ($requestedBookIds === []) {
            throw new RuntimeException('No Mokhtasr books were configured for this request.', 503);
        }

        $response = $this->http
            ->baseUrl(rtrim((string) config('mokhtasr.base_url'), '/'))
            ->acceptJson()
            ->withToken($token)
            ->connectTimeout((int) config('mokhtasr.connect_timeout', 10))
            ->timeout((int) config('mokhtasr.timeout', 30))
            ->get('/book-contents', [
                'books' => implode(',', array_values($requestedBookIds)),
                'sura' => $surah,
                'aya' => $ayah,
                'lang' => 'ar',
            ]);

        if ($response->failed()) {
            $message = $response->json('message')
                ?: 'Mokhtasr returned an unsuccessful response.';

            throw new RuntimeException((string) $message, 502);
        }

        $payload = $response->json();

        if (!is_array($payload) || !isset($payload['data'][0])) {
            throw new RuntimeException(
                'Mokhtasr returned an unexpected response structure.',
                502,
            );
        }

        $sourceBooks = $payload['data'][0]['books'] ?? [];

        if (!is_array($sourceBooks)) {
            throw new RuntimeException(
                'Mokhtasr returned an invalid books collection.',
                502,
            );
        }

        $languageIds = config('mokhtasr.language_ids', ['ar' => 1, 'en' => 4]);
        $receivedLanguages = [];

        foreach ($sourceBooks as $sourceBook) {
            if (!is_array($sourceBook)) {
                continue;
            }

            $language = array_search(
                (int) ($sourceBook['language_id'] ?? 0),
                array_map('intval', $languageIds),
                true,
            );

            if (!is_string($language) || !isset($requestedBookIds[$language])) {
                continue;
            }

            $book = $this->normalizeBook($sourceBook, $ayah);
            $range = $book['range'];
            $bookId = $requestedBookIds[$language];

            $unitKey = $this->unitCacheKey(
                $surah,
                $language,
                $bookId,
                $range['startAyah'],
                $range['endAyah'],
            );

            $expiresAt = now()->addDays(max(1, (int) config('mokhtasr.cache_days', 7)));
            Cache::put($unitKey, $book, $expiresAt);

            for ($rangeAyah = $range['startAyah']; $rangeAyah <= $range['endAyah']; $rangeAyah++) {
                Cache::put(
                    $this->ayahLookupKey($surah, $rangeAyah, $language),
                    $unitKey,
                    $expiresAt,
                );
            }

            $receivedLanguages[] = $language;
        }

        $missingResponses = array_diff(array_keys($requestedBookIds), $receivedLanguages);

        if ($missingResponses !== []) {
            throw new RuntimeException(
                'Mokhtasr did not return all requested tafsir books.',
                502,
            );
        }
    }

    protected function normalizeBook(array $book, int $requestedAyah): array
    {
        $text = trim((string) ($book['text'] ?? ''));
        $plainText = $this->plainText($text);
        $range = $this->extractAyahRange($plainText, $requestedAyah);
        $displayText = $range['isShared']
            ? (preg_replace('/^\s*\d+\s*[-–—]\s*\d+\s*[-–—]\s*/u', '', $plainText) ?? $plainText)
            : $plainText;

        return [
            ...$book,
            'plain_text' => $displayText,
            'range' => $range,
        ];
    }

    protected function plainText(string $text): string
    {
        $text = preg_replace('/<br\s*\/?\s*>/iu', "\n", $text) ?? $text;

        // Keep word boundaries when adjacent inline HTML elements separate words.
        $text = preg_replace(
            '/(?<=\S)(<(?:span|strong|em|b|i|a|mark|small|sup|sub)\b)/iu',
            ' $1',
            $text,
        ) ?? $text;
        $text = preg_replace(
            '/<\/(?:span|strong|em|b|i|a|mark|small|sup|sub)\s*>(?=\S)/iu',
            '$0 ',
            $text,
        ) ?? $text;

        $text = html_entity_decode(strip_tags($text), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $text = preg_replace('/[\t ]+/u', ' ', $text) ?? $text;

        return trim($text);
    }

    protected function extractAyahRange(string $text, int $requestedAyah): array
    {
        $digits = strtr($text, [
            '٠' => '0', '١' => '1', '٢' => '2', '٣' => '3', '٤' => '4',
            '٥' => '5', '٦' => '6', '٧' => '7', '٨' => '8', '٩' => '9',
            '۰' => '0', '۱' => '1', '۲' => '2', '۳' => '3', '۴' => '4',
            '۵' => '5', '۶' => '6', '۷' => '7', '۸' => '8', '۹' => '9',
        ]);

        if (preg_match('/^\s*(\d+)\s*[-–—]\s*(\d+)\s*[-–—]/u', $digits, $matches)) {
            $start = (int) $matches[1];
            $end = (int) $matches[2];

            if ($start > 0 && $end >= $start && $requestedAyah >= $start && $requestedAyah <= $end) {
                return [
                    'startAyah' => $start,
                    'endAyah' => $end,
                    'isShared' => $end > $start,
                ];
            }
        }

        return [
            'startAyah' => $requestedAyah,
            'endAyah' => $requestedAyah,
            'isShared' => false,
        ];
    }

    protected function ayahLookupKey(int $surah, int $ayah, string $language): string
    {
        return sprintf('mokhtasr.tafsir.lookup.v2.%d.%d.%s', $surah, $ayah, $language);
    }

    protected function unitCacheKey(
        int $surah,
        string $language,
        int $bookId,
        int $startAyah,
        int $endAyah,
    ): string {
        return sprintf(
            'mokhtasr.tafsir.unit.v2.%d.%s.%d.%d.%d',
            $surah,
            $language,
            $bookId,
            $startAyah,
            $endAyah,
        );
    }
}
