<?php

namespace App\Services\Quran;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Factory as HttpFactory;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Cache;
use RuntimeException;
use Throwable;

class QuranApiService
{
    public function __construct(
        private readonly HttpFactory $http,
    ) {
    }

    public function baseUrl(): string
    {
        return rtrim((string) config('quran.base_url'), '/');
    }

    protected function client(): PendingRequest
    {
        return $this->http
            ->baseUrl($this->baseUrl())
            ->acceptJson()
            ->timeout((int) config('quran.timeout', 10));
    }

    public function getSurahs(): array
    {
        return Cache::remember('quran.surahs', now()->addDay(), function () {
            $data = $this->get('/surah');

            return collect($data)->map(fn (array $surah) => $this->normalizeSurahSummary($surah))->all();
        });
    }

    public function getSurah(
        int $number,
        ?string $translationEdition = null,
        ?string $audioEdition = null,
    ): array {
        $translationEdition ??= (string) config('quran.default_translation');
        $audioEdition ??= (string) config('quran.default_audio');

        $cacheKey = sprintf(
            'quran.surah.%d.%s.%s',
            $number,
            $translationEdition,
            $audioEdition,
        );

        return Cache::remember($cacheKey, now()->addHours(12), function () use ($number, $translationEdition, $audioEdition) {
            $editions = array_values(array_filter([
                'quran-uthmani',
                $translationEdition,
                $audioEdition,
            ]));

            $data = $this->get('/surah/'.$number.'/editions/'.implode(',', $editions));

            return $this->normalizeSurahWithEditions($data);
        });
    }

    public function getEditions(array $filters = []): array
    {
        $query = array_filter([
            'format' => $filters['format'] ?? 'text',
            'type' => $filters['type'] ?? 'translation',
            'language' => $filters['language'] ?? null,
        ]);

        $cacheKey = 'quran.editions.'.md5(json_encode($query));

        return Cache::remember($cacheKey, now()->addDay(), function () use ($query) {
            return collect($this->get('/edition', $query))
                ->map(fn (array $edition) => $this->normalizeEdition($edition))
                ->values()
                ->all();
        });
    }

    public function getAudioEditions(): array
    {
        return Cache::remember('quran.audio_editions.ar', now()->addDay(), function () {
            return collect($this->get('/edition', [
                'format' => 'audio',
                'language' => 'ar',
            ]))
                ->map(fn (array $edition) => $this->normalizeEdition($edition))
                ->values()
                ->all();
        });
    }

    public function search(string $query, ?string $edition = null): array
    {
        $edition ??= (string) config('quran.default_translation');
        $data = $this->get('/search/'.rawurlencode($query).'/all/'.$edition);

        return [
            'count' => $data['count'] ?? 0,
            'edition' => $edition,
            'matches' => collect($data['matches'] ?? [])
                ->map(fn (array $match) => $this->normalizeSearchMatch($match))
                ->values()
                ->all(),
        ];
    }

    protected function get(string $path, array $query = []): array
    {
        try {
            $response = $this->client()->get($path, $query)->throw();
            $payload = $response->json();
        } catch (ConnectionException) {
            throw new RuntimeException('Unable to connect to the Quran data provider.', 503);
        } catch (RequestException $exception) {
            $status = $exception->response?->status() ?: 502;
            $message = $exception->response?->json('data')
                ?: $exception->response?->json('message')
                ?: 'The Quran data provider returned an error.';

            throw new RuntimeException((string) $message, $status);
        } catch (Throwable) {
            throw new RuntimeException('The Quran service is temporarily unavailable.', 502);
        }

        if (($payload['code'] ?? null) !== 200 || ! array_key_exists('data', $payload)) {
            throw new RuntimeException('The Quran data provider returned an unexpected response.', 502);
        }

        return $payload['data'];
    }

    protected function normalizeSurahSummary(array $surah): array
    {
        return [
            'number' => $surah['number'] ?? null,
            'name' => $surah['name'] ?? null,
            'englishName' => $surah['englishName'] ?? null,
            'englishNameTranslation' => $surah['englishNameTranslation'] ?? null,
            'numberOfAyahs' => $surah['numberOfAyahs'] ?? null,
            'revelationType' => $surah['revelationType'] ?? null,
        ];
    }

    protected function normalizeSurahWithEditions(array $editions): array
    {
        $arabic = collect($editions)->first(
            fn (array $edition) => ($edition['edition']['identifier'] ?? null) === 'quran-uthmani'
        ) ?? ($editions[0] ?? []);

        $translation = collect($editions)->first(
            fn (array $edition) => ($edition['edition']['type'] ?? null) === 'translation'
        );

        $audio = collect($editions)->first(
            fn (array $edition) => ($edition['edition']['format'] ?? null) === 'audio'
        );

        return [
            ...$this->normalizeSurahSummary($arabic),
            'edition' => $this->normalizeEdition($arabic['edition'] ?? []),
            'translationEdition' => $translation ? $this->normalizeEdition($translation['edition'] ?? []) : null,
            'audioEdition' => $audio ? $this->normalizeEdition($audio['edition'] ?? []) : null,
            'ayahs' => collect($arabic['ayahs'] ?? [])->map(function (array $ayah, int $index) use ($translation, $audio) {
                $translationAyah = $translation['ayahs'][$index] ?? null;
                $audioAyah = $audio['ayahs'][$index] ?? null;

                return [
                    'number' => $ayah['number'] ?? null,
                    'numberInSurah' => $ayah['numberInSurah'] ?? null,
                    'text' => $ayah['text'] ?? null,
                    'juz' => $ayah['juz'] ?? null,
                    'page' => $ayah['page'] ?? null,
                    'sajda' => $ayah['sajda'] ?? false,
                    'translation' => $translationAyah ? [
                        'text' => $translationAyah['text'] ?? null,
                    ] : null,
                    'audio' => $audioAyah ? [
                        'url' => $audioAyah['audio'] ?? null,
                        'secondary' => $audioAyah['audioSecondary'] ?? [],
                    ] : null,
                ];
            })->values()->all(),
        ];
    }

    protected function normalizeEdition(array $edition): array
    {
        return [
            'identifier' => $edition['identifier'] ?? null,
            'language' => $edition['language'] ?? null,
            'name' => $edition['name'] ?? null,
            'englishName' => $edition['englishName'] ?? null,
            'format' => $edition['format'] ?? null,
            'type' => $edition['type'] ?? null,
            'direction' => $edition['direction'] ?? null,
        ];
    }

    protected function normalizeSearchMatch(array $match): array
    {
        return [
            'number' => $match['number'] ?? null,
            'text' => $match['text'] ?? null,
            'numberInSurah' => $match['numberInSurah'] ?? null,
            'surah' => isset($match['surah']) ? $this->normalizeSurahSummary($match['surah']) : null,
            'edition' => isset($match['edition']) ? $this->normalizeEdition($match['edition']) : null,
        ];
    }
}
