<?php

namespace Tests\Feature;

use App\Services\Quran\MokhtasrTafsirService;
use Illuminate\Http\Client\ConnectionException;
use Tests\TestCase;

class TafsirEndpointTest extends TestCase
{
    public function test_it_returns_gateway_timeout_when_mokhtasr_connection_fails(): void
    {
        $service = \Mockery::mock(MokhtasrTafsirService::class);
        $service->shouldReceive('getAyahTafsir')
            ->once()
            ->with(2, 4)
            ->andThrow(new ConnectionException('Connection timed out.'));

        $this->app->instance(MokhtasrTafsirService::class, $service);

        $this->getJson('/api/quran/surahs/2/ayahs/4/tafsir')
            ->assertStatus(504)
            ->assertJson([
                'success' => false,
                'message' => 'Tafsir service is temporarily unavailable. Please try again.',
            ]);
    }

    public function test_it_returns_tafsir_data_for_a_valid_ayah(): void
    {
        $expected = [
            'surah' => 2,
            'requestedAyah' => 3,
            'books' => [
                [
                    'language_id' => 1,
                    'plain_text' => 'تفسير عربي',
                    'range' => [
                        'startAyah' => 3,
                        'endAyah' => 4,
                        'isShared' => true,
                    ],
                ],
                [
                    'language_id' => 4,
                    'plain_text' => 'English tafsir',
                    'range' => [
                        'startAyah' => 3,
                        'endAyah' => 3,
                        'isShared' => false,
                    ],
                ],
            ],
        ];

        $service = \Mockery::mock(MokhtasrTafsirService::class);
        $service->shouldReceive('getAyahTafsir')
            ->once()
            ->with(2, 3)
            ->andReturn($expected);

        $this->app->instance(MokhtasrTafsirService::class, $service);

        $this->getJson('/api/quran/surahs/2/ayahs/3/tafsir')
            ->assertOk()
            ->assertJson([
                'success' => true,
                'data' => $expected,
            ]);
    }

    public function test_it_rejects_a_surah_number_outside_the_quran(): void
    {
        $service = \Mockery::mock(MokhtasrTafsirService::class);
        $service->shouldNotReceive('getAyahTafsir');

        $this->app->instance(MokhtasrTafsirService::class, $service);

        $this->getJson('/api/quran/surahs/115/ayahs/1/tafsir')
            ->assertUnprocessable()
            ->assertJson([
                'success' => false,
                'message' => 'The selected Surah must be between 1 and 114.',
            ]);
    }

    public function test_it_rejects_an_ayah_number_outside_the_selected_surah(): void
    {
        $service = \Mockery::mock(MokhtasrTafsirService::class);
        $service->shouldNotReceive('getAyahTafsir');

        $this->app->instance(MokhtasrTafsirService::class, $service);

        $this->getJson('/api/quran/surahs/2/ayahs/287/tafsir')
            ->assertUnprocessable()
            ->assertJson([
                'success' => false,
                'message' => 'The selected Ayah is not valid for this Surah.',
            ]);
    }
}
