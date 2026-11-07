<?php

namespace Tests\Feature;

use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class QuranAudioEditionTest extends TestCase
{
    public function test_audio_metadata_endpoint_returns_and_caches_selected_edition_urls(): void
    {
        Http::fake([
            '*/surah/1/ar.abdulbasitmurattal' => Http::response([
                'code' => 200,
                'data' => [
                    'number' => 1,
                    'edition' => [
                        'identifier' => 'ar.abdulbasitmurattal',
                        'format' => 'audio',
                    ],
                    'ayahs' => [[
                        'numberInSurah' => 1,
                        'audio' => 'https://cdn.islamic.network/quran/audio/192/ar.abdulbasitmurattal/1.mp3',
                        'audioSecondary' => [],
                    ]],
                ],
            ]),
        ]);

        $url = '/api/quran/surahs/1/audio?edition=ar.abdulbasitmurattal';

        $this->getJson($url)
            ->assertOk()
            ->assertJsonPath(
                'data.ayahs.0.audio.url',
                'https://cdn.islamic.network/quran/audio/192/ar.abdulbasitmurattal/1.mp3',
            );

        $this->getJson($url)
            ->assertOk()
            ->assertJsonPath(
                'data.edition.identifier',
                'ar.abdulbasitmurattal',
            );

        Http::assertSentCount(1);
    }

    public function test_surah_uses_the_audio_urls_returned_for_the_selected_edition(): void
    {
        $ayah = [
            'number' => 1,
            'numberInSurah' => 1,
            'text' => 'Test ayah',
            'juz' => 1,
            'page' => 1,
            'sajda' => false,
        ];

        Http::fake(function (Request $request) use ($ayah) {
            $path = (string) parse_url($request->url(), PHP_URL_PATH);

            if (str_ends_with($path, '/surah/1/ar.abdulbasitmurattal')) {
                return Http::response([
                    'code' => 200,
                    'data' => [
                        'ayahs' => [[
                            'number' => 1,
                            'numberInSurah' => 1,
                            'audio' => 'https://cdn.islamic.network/quran/audio/192/ar.abdulbasitmurattal/1.mp3',
                            'audioSecondary' => [],
                        ]],
                    ],
                ]);
            }

            if (str_ends_with($path, '/surah/1/en.sahih')) {
                return Http::response([
                    'code' => 200,
                    'data' => [
                        'ayahs' => [[
                            'text' => 'Test translation',
                        ]],
                    ],
                ]);
            }

            if (str_ends_with($path, '/surah/1')) {
                return Http::response([
                    'code' => 200,
                    'data' => [
                        'number' => 1,
                        'name' => 'Test Surah',
                        'englishName' => 'Test Surah',
                        'englishNameTranslation' => 'The Test',
                        'numberOfAyahs' => 1,
                        'revelationType' => 'Meccan',
                        'edition' => [],
                        'ayahs' => [$ayah],
                    ],
                ]);
            }

            return Http::response([], 404);
        });

        $this->getJson(
            '/api/quran/surahs/1?translation=en.sahih&audio=ar.abdulbasitmurattal',
        )
            ->assertOk()
            ->assertJsonPath(
                'data.ayahs.0.audio.url',
                'https://cdn.islamic.network/quran/audio/192/ar.abdulbasitmurattal/1.mp3',
            );

        Http::assertSent(
            fn (Request $request) => str_ends_with(
                (string) parse_url($request->url(), PHP_URL_PATH),
                '/surah/1/ar.abdulbasitmurattal',
            ),
        );
    }
}
