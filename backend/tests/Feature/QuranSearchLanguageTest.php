<?php

namespace Tests\Feature;

use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class QuranSearchLanguageTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Http::fake([
            '*/search/*' => Http::response([
                'code' => 200,
                'data' => [
                    'count' => 0,
                    'matches' => [],
                ],
            ]),
        ]);
    }

    public function test_arabic_search_uses_the_arabic_quran_edition(): void
    {
        $this->getJson('/api/quran/search?q=الله&language=ar')
            ->assertOk()
            ->assertJsonPath('data.edition', 'quran-uthmani');

        Http::assertSent(
            fn (Request $request) => str_ends_with(
                (string) parse_url($request->url(), PHP_URL_PATH),
                '/all/quran-uthmani',
            ),
        );
    }

    public function test_english_search_uses_the_configured_translation(): void
    {
        $this->getJson('/api/quran/search?q=mercy&language=en')
            ->assertOk()
            ->assertJsonPath('data.edition', config('quran.default_translation'));

        Http::assertSent(
            fn (Request $request) => str_ends_with(
                (string) parse_url($request->url(), PHP_URL_PATH),
                '/all/'.config('quran.default_translation'),
            ),
        );
    }
}
