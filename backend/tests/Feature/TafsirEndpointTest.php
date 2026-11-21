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
}
