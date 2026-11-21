<?php

namespace Tests\Unit;

use App\Services\Quran\MokhtasrTafsirService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class MokhtasrTafsirServiceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Cache::flush();
        config([
            'mokhtasr.base_url' => 'https://admin.mokhtasr.com/api/v1',
            'mokhtasr.token' => 'test-token',
            'mokhtasr.connect_timeout' => 5,
            'mokhtasr.timeout' => 5,
            'mokhtasr.cache_days' => 7,
            'mokhtasr.books' => ['ar' => 200, 'en' => 319],
            'mokhtasr.language_ids' => ['ar' => 1, 'en' => 4],
        ]);
    }

    public function test_it_fetches_both_books_and_keeps_each_languages_range_independent(): void
    {
        Http::fake([
            'admin.mokhtasr.com/*' => Http::response([
                'data' => [[
                    'books' => [
                        [
                            'id' => 2432139,
                            'language_id' => 1,
                            'text' => '3 - 4 - تفسير عربي مشترك',
                        ],
                        [
                            'id' => 2777657,
                            'language_id' => 4,
                            'text' => 'تفسير إنجليزي خاص بالآية الثالثة',
                        ],
                    ],
                ]],
            ]),
        ]);

        $result = app(MokhtasrTafsirService::class)->getAyahTafsir(2, 3);

        $this->assertSame(2, $result['surah']);
        $this->assertSame(3, $result['requestedAyah']);
        $this->assertCount(2, $result['books']);
        $this->assertSame(
            ['startAyah' => 3, 'endAyah' => 4, 'isShared' => true],
            $result['books'][0]['range'],
        );
        $this->assertSame(
            ['startAyah' => 3, 'endAyah' => 3, 'isShared' => false],
            $result['books'][1]['range'],
        );

        Http::assertSent(function ($request) {
            return parse_url($request->url(), PHP_URL_PATH) === '/api/v1/book-contents'
                && $request->hasHeader('Authorization', 'Bearer test-token')
                && $request['books'] === '200,319'
                && (string) $request['sura'] === '2'
                && (string) $request['aya'] === '3';
        });
    }

    public function test_it_reuses_a_shared_arabic_unit_and_fetches_only_the_missing_english_ayah(): void
    {
        Http::fake(function ($request) {
            if ($request['books'] === '200,319' && (string) $request['aya'] === '3') {
                return Http::response([
                    'data' => [[
                        'books' => [
                            [
                                'id' => 2432139,
                                'language_id' => 1,
                                'text' => '3 - 4 - تفسير عربي مشترك',
                            ],
                            [
                                'id' => 2777657,
                                'language_id' => 4,
                                'text' => 'English tafsir for ayah 3',
                            ],
                        ],
                    ]],
                ]);
            }

            if ($request['books'] === '319' && (string) $request['aya'] === '4') {
                return Http::response([
                    'data' => [[
                        'books' => [[
                            'id' => 2777658,
                            'language_id' => 4,
                            'text' => 'English tafsir for ayah 4',
                        ]],
                    ]],
                ]);
            }

            return Http::response(['message' => 'Unexpected test request'], 500);
        });

        $service = app(MokhtasrTafsirService::class);
        $ayahThree = $service->getAyahTafsir(2, 3);
        $ayahFour = $service->getAyahTafsir(2, 4);

        $this->assertSame('تفسير عربي مشترك', $ayahThree['books'][0]['plain_text']);
        $this->assertSame('تفسير عربي مشترك', $ayahFour['books'][0]['plain_text']);
        $this->assertSame(
            ['startAyah' => 3, 'endAyah' => 4, 'isShared' => true],
            $ayahFour['books'][0]['range'],
        );
        $this->assertSame('English tafsir for ayah 4', $ayahFour['books'][1]['plain_text']);

        Http::assertSentCount(2);
        Http::assertSent(function ($request) {
            return $request['books'] === '319'
                && (string) $request['aya'] === '4';
        });
    }

    public function test_it_extracts_arabic_indic_digits_in_shared_ranges(): void
    {
        Http::fake([
            'admin.mokhtasr.com/*' => Http::response([
                'data' => [[
                    'books' => [[
                        'language_id' => 1,
                        'text' => '٣ - ٦ - تفسير يشمل أربع آيات',
                    ]],
                ]],
            ]),
        ]);

        config(['mokhtasr.books' => ['ar' => 200]]);

        $result = app(MokhtasrTafsirService::class)->getAyahTafsir(2, 5);

        $this->assertSame(
            ['startAyah' => 3, 'endAyah' => 6, 'isShared' => true],
            $result['books'][0]['range'],
        );
    }

    public function test_it_does_not_infer_a_shared_range_without_an_explicit_prefix(): void
    {
        Http::fake([
            'admin.mokhtasr.com/*' => Http::response([
                'data' => [[
                    'books' => [[
                        'language_id' => 1,
                        'text' => 'تفسير مستقل بدون نطاق صريح',
                    ]],
                ]],
            ]),
        ]);

        config(['mokhtasr.books' => ['ar' => 200]]);

        $result = app(MokhtasrTafsirService::class)->getAyahTafsir(2, 5);

        $this->assertSame(
            ['startAyah' => 5, 'endAyah' => 5, 'isShared' => false],
            $result['books'][0]['range'],
        );
    }

    public function test_it_preserves_line_breaks_and_word_spaces_when_cleaning_html(): void
    {
        Http::fake([
            'admin.mokhtasr.com/*' => Http::response([
                'data' => [[
                    'books' => [[
                        'language_id' => 1,
                        'text' => 'الذين<span>يؤمنون</span> بالغيب<br/>نهاية',
                    ]],
                ]],
            ]),
        ]);

        config(['mokhtasr.books' => ['ar' => 200]]);

        $result = app(MokhtasrTafsirService::class)->getAyahTafsir(2, 6);

        $this->assertSame("الذين يؤمنون بالغيب\nنهاية", $result['books'][0]['plain_text']);
    }
}
