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
        $cacheKey = sprintf('mokhtasr.tafsir.v1.%d.%d', $surah, $ayah);

        return Cache::remember(
            $cacheKey,
            now()->addDays(max(1, (int) config('mokhtasr.cache_days', 7))),
            fn () => $this->fetchAyahTafsir($surah, $ayah),
        );
    }

    protected function fetchAyahTafsir(int $surah, int $ayah): array
    {
        $token = (string) config('mokhtasr.token');

        if ($token === '') {
            throw new RuntimeException(
                'Mokhtasr API token is not configured.',
                503,
            );
        }

        $books = config('mokhtasr.books', ['ar' => 200, 'en' => 319]);

        $response = $this->http
            ->baseUrl(rtrim((string) config('mokhtasr.base_url'), '/'))
            ->acceptJson()
            ->withToken($token)
            ->timeout((int) config('mokhtasr.timeout', 15))
            ->get('/book-contents', [
                'books' => implode(',', array_values($books)),
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

        $content = $payload['data'][0];
        $sourceBooks = $content['books'] ?? [];

        if (!is_array($sourceBooks)) {
            throw new RuntimeException(
                'Mokhtasr returned an invalid books collection.',
                502,
            );
        }

        return [
            'surah' => $surah,
            'requestedAyah' => $ayah,
            'books' => array_values(array_map(
                fn (array $book) => $this->normalizeBook($book, $ayah),
                array_filter($sourceBooks, 'is_array'),
            )),
        ];
    }

    protected function normalizeBook(array $book, int $requestedAyah): array
    {
        $text = trim((string) ($book['text'] ?? ''));
        $plainText = $this->plainText($text);
        $range = $this->extractAyahRange($plainText, $requestedAyah);

        return [
            ...$book,
            'plain_text' => $plainText,
            'range' => $range,
        ];
    }

    protected function plainText(string $text): string
    {
        $text = preg_replace('/<br\\s*\\/?\\s*>/iu', "\n", $text) ?? $text;
        $text = html_entity_decode(strip_tags($text), ENT_QUOTES | ENT_HTML5, 'UTF-8');

        return trim(preg_replace('/[\\t ]+/u', ' ', $text) ?? $text);
    }

    /**
     * Mokhtasr samples may prefix a shared explanation with "3 - 4 -".
     * If no explicit, valid range is present, treat it as an ayah-specific
     * explanation rather than guessing from repeated text.
     */
    protected function extractAyahRange(string $text, int $requestedAyah): array
    {
        $digits = strtr($text, [
            '٠' => '0', '١' => '1', '٢' => '2', '٣' => '3', '٤' => '4',
            '٥' => '5', '٦' => '6', '٧' => '7', '٨' => '8', '٩' => '9',
            '۰' => '0', '۱' => '1', '۲' => '2', '۳' => '3', '۴' => '4',
            '۵' => '5', '۶' => '6', '۷' => '7', '۸' => '8', '۹' => '9',
        ]);

        if (preg_match('/^\\s*(\\d+)\\s*[-–—]\\s*(\\d+)\\s*[-–—]/u', $digits, $matches)) {
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
}
