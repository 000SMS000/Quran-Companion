<?php

namespace App\Services\Quran;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Factory as HttpFactory;
use Illuminate\Http\Client\Pool;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
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
            ->withHeaders([
                'Accept-Encoding' => 'gzip',
            ])
            ->withOptions([
                'force_ip_resolve' => 'v4',
            ])
            ->timeout((int) config('quran.timeout', 30));
    }

    public function getSurahs(): array
    {
        return Cache::remember('quran.surahs', now()->addDay(), function () {
            $data = $this->get('/surah');

            return collect($data)
                ->map(fn (array $surah) => $this->normalizeSurahSummary($surah))
                ->all();
        });
    }

    public function getSurah(
        int $number,
        ?string $translationEdition = null,
        ?string $audioEdition = null,
        ?string $secondTranslationEdition = null,
    ): array {
        $translationEdition ??= (string) config('quran.default_translation');
        $audioEdition ??= (string) config('quran.default_audio');

        $cacheKey = sprintf(
            'quran.surah.v2.%d.%s.%s.%s',
            $number,
            $translationEdition ?: 'none',
            $audioEdition ?: 'none',
            $secondTranslationEdition ?: 'none',
        );

        return Cache::remember(
            $cacheKey,
            now()->addHours(12),
            function () use (
                $number,
                $translationEdition,
                $audioEdition,
                $secondTranslationEdition
            ) {
                $requests = [
                    'arabic' => '/surah/'.$number,
                    'audio' => '/surah/'.$number.'/'.$audioEdition,
                ];

                if ($translationEdition) {
                    $requests['translation'] =
                        '/surah/'.$number.'/'.$translationEdition;
                }

                if ($secondTranslationEdition) {
                    $requests['secondTranslation'] =
                        '/surah/'.$number.'/'.$secondTranslationEdition;
                }

                $responses = $this->getMany($requests);

                return $this->normalizeSurahData(
                    $responses['arabic'],
                    $responses['audio'],
                    $translationEdition
                        ? $responses['translation']
                        : null,
                    $translationEdition,
                    $audioEdition,
                    $secondTranslationEdition
                        ? $responses['secondTranslation']
                        : null,
                    $secondTranslationEdition,
                );
            }
        );
    }

    public function getSurahAudio(int $number, string $audioEdition): array
    {
        $cacheKey = sprintf(
            'quran.audio_surah.v1.%d.%s',
            $number,
            $audioEdition,
        );

        return Cache::remember(
            $cacheKey,
            now()->addHours(12),
            function () use ($number, $audioEdition) {
                $startedAt = microtime(true);
                $data = $this->get(
                    '/surah/'.$number.'/'.$audioEdition,
                );

                Log::debug('Quran audio metadata cache miss', [
                    'surah' => $number,
                    'edition' => $audioEdition,
                    'provider_duration_ms' => round(
                        (microtime(true) - $startedAt) * 1000,
                    ),
                ]);

                return [
                    'number' => $number,
                    'edition' => $this->normalizeEdition(
                        $data['edition'] ?? [],
                    ),
                    'ayahs' => collect($data['ayahs'] ?? [])
                        ->map(fn (array $ayah) => [
                            'numberInSurah' => $ayah['numberInSurah'] ?? null,
                            'audio' => [
                                'url' => $ayah['audio'] ?? null,
                                'secondary' => $ayah['audioSecondary'] ?? [],
                            ],
                        ])
                        ->values()
                        ->all(),
                ];
            },
        );
    }

    protected function normalizeSurahData(
        array $arabic,
        array $audio,
        ?array $translation,
        ?string $translationEdition,
        string $audioEdition,
        ?array $secondTranslation = null,
        ?string $secondTranslationEdition = null,
    ): array {
        $audioAyahs = collect($audio['ayahs'] ?? [])
            ->keyBy('numberInSurah');

        return [
            ...$this->normalizeSurahSummary($arabic),

            'edition' => $this->normalizeEdition(
                $arabic['edition'] ?? []
            ),

            'translationEdition' => $translationEdition
                ? [
                    'identifier' => $translationEdition,
                    'language' => 'en',
                    'format' => 'text',
                    'type' => 'translation',
                    'direction' => 'ltr',
                ]
                : null,

            'secondTranslationEdition' => $secondTranslationEdition
                ? [
                    'identifier' => $secondTranslationEdition,
                    'format' => 'text',
                    'type' => 'translation',
                ]
                : null,

            'audioEdition' => [
                'identifier' => $audioEdition,
                'format' => 'audio',
            ],

            'ayahs' => collect($arabic['ayahs'] ?? [])
                ->map(function (array $ayah, int $index) use (
                    $audioAyahs,
                    $translation,
                    $secondTranslation,
                ) {
                    $audioAyah = $audioAyahs->get(
                        $ayah['numberInSurah'] ?? null
                    );
                    $translationAyah =
                        $translation['ayahs'][$index] ?? null;

                    $secondTranslationAyah =
                        $secondTranslation['ayahs'][$index] ?? null;

                    return [
                        'number' => $ayah['number'] ?? null,
                        'numberInSurah' => $ayah['numberInSurah'] ?? null,
                        'text' => $ayah['text'] ?? null,
                        'juz' => $ayah['juz'] ?? null,
                        'page' => $ayah['page'] ?? null,
                        'sajda' => $ayah['sajda'] ?? false,

                        'translation' => $translationAyah
                            ? [
                                'text' => $translationAyah['text'] ?? null,
                            ]
                            : null,

                        'secondTranslation' => $secondTranslationAyah
                            ? [
                                'text' => $secondTranslationAyah['text'] ?? null,
                            ]
                            : null,

                        'audio' => [
                            'url' => $audioAyah['audio'] ?? null,
                            'secondary' => $audioAyah['audioSecondary'] ?? [],
                        ],
                    ];
                })
                ->values()
                ->all(),
        ];
    }

    public function getEditions(array $filters = []): array
    {
        $query = array_filter([
            'format' => $filters['format'] ?? 'text',
            'type' => $filters['type'] ?? 'translation',
            'language' => $filters['language'] ?? null,
        ]);

        $cacheKey = 'quran.editions.'.md5(json_encode($query));

        return Cache::remember(
            $cacheKey,
            now()->addDay(),
            function () use ($query) {
                return collect($this->get('/edition', $query))
                    ->map(fn (array $edition) => $this->normalizeEdition($edition))
                    ->values()
                    ->all();
            }
        );
    }

    public function getAudioEditions(): array
    {
        return Cache::remember(
            'quran.audio_editions.ar',
            now()->addDay(),
            function () {
                return collect($this->get('/edition', [
                    'format' => 'audio',
                    'language' => 'ar',
                ]))
                    ->map(fn (array $edition) => $this->normalizeEdition($edition))
                    ->values()
                    ->all();
            }
        );
    }

    public function search(
        string $query,
        ?string $edition = null
    ): array {
        $edition ??= (string) config('quran.default_translation');

        $data = $this->get(
            '/search/'.rawurlencode($query).'/all/'.$edition
        );

        return [
            'count' => $data['count'] ?? 0,
            'edition' => $edition,
            'matches' => collect($data['matches'] ?? [])
                ->map(fn (array $match) => $this->normalizeSearchMatch($match))
                ->values()
                ->all(),
        ];
    }

    protected function get(
        string $path,
        array $query = []
    ): array {
        return $this->decodeResponse(
            $this->client()->get($path, $query),
        );
    }

    protected function getMany(array $paths): array
    {
        $startedAt = microtime(true);
        $responses = $this->http->pool(function (Pool $pool) use ($paths) {
            foreach ($paths as $key => $path) {
                $pool->as($key)
                    ->baseUrl($this->baseUrl())
                    ->acceptJson()
                    ->withHeaders([
                        'Accept-Encoding' => 'gzip',
                    ])
                    ->withOptions([
                        'force_ip_resolve' => 'v4',
                    ])
                    ->timeout((int) config('quran.timeout', 30))
                    ->get($path);
            }
        });

        $data = [];
        foreach ($responses as $key => $response) {
            if ($response instanceof Throwable) {
                if ($response instanceof ConnectionException) {
                    throw new RuntimeException(
                        'Quran API connection failed: '.$response->getMessage(),
                        503,
                        $response,
                    );
                }

                throw new RuntimeException(
                    'The Quran service is temporarily unavailable.',
                    502,
                    $response,
                );
            }

            $data[$key] = $this->decodeResponse($response);
        }

        Log::debug('Quran Surah provider requests completed', [
            'request_count' => count($paths),
            'duration_ms' => round((microtime(true) - $startedAt) * 1000),
        ]);

        return $data;
    }

    protected function decodeResponse(Response $response): array
    {
        try {
            $response->throw();

            $payload = $response->json();
        } catch (ConnectionException $exception) {
            throw new RuntimeException(
                'Quran API connection failed: '.$exception->getMessage(),
                503
            );
        } catch (RequestException $exception) {
            $status = $exception->response?->status() ?: 502;

            $message = $exception->response?->json('data')
                ?: $exception->response?->json('message')
                ?: 'The Quran data provider returned an error.';

            throw new RuntimeException(
                (string) $message,
                $status
            );
        } catch (Throwable) {
            throw new RuntimeException(
                'The Quran service is temporarily unavailable.',
                502
            );
        }

        if (
            ($payload['code'] ?? null) !== 200
            || !array_key_exists('data', $payload)
        ) {
            throw new RuntimeException(
                'The Quran data provider returned an unexpected response.',
                502
            );
        }

        return $payload['data'];
    }

    protected function normalizeSurahSummary(
        array $surah
    ): array {
        return [
            'number' => $surah['number'] ?? null,
            'name' => $surah['name'] ?? null,
            'englishName' => $surah['englishName'] ?? null,
            'englishNameTranslation' => $surah['englishNameTranslation'] ?? null,
            'numberOfAyahs' => $surah['numberOfAyahs'] ?? null,
            'revelationType' => $surah['revelationType'] ?? null,
        ];
    }

    protected function normalizeEdition(
        array $edition
    ): array {
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

    protected function normalizeSearchMatch(
        array $match
    ): array {
        return [
            'number' => $match['number'] ?? null,
            'text' => $match['text'] ?? null,
            'numberInSurah' => $match['numberInSurah'] ?? null,
            'surah' => isset($match['surah'])
                ? $this->normalizeSurahSummary($match['surah'])
                : null,
            'edition' => isset($match['edition'])
                ? $this->normalizeEdition($match['edition'])
                : null,
        ];
    }
}