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
            'mokhtasr.timeout' => 5,
            'mokhtasr.cache_days' => 7,
            'mokhtasr.books' => ['ar' => 200, 'en' => 319],
        ]);
    }

    public function test_it_fetches_both_tafsir_books_and_extracts_a_shared_range(): void
    {
        Http::fake([
            'admin.mokhtasr.com/*' => Http::response([
                'data' => [[
                    'books' => [
                        [
                            'book_id' => 200,
                            'language_id' => 'ar',
                            'text' => '3 - 4 - تفسير عربي مشترك',
                        ],
                        [
                            'book_id' => 319,
                            'language_id' => 'en',
                            'text' => '3 - 4 - Shared English explanation',
                        ],
                    ],
                ]],
            ]),
        ]);

        $result = app(MokhtasrTafsirService::class)->getAyahTafsir(2, 4);

        $this->assertSame(2, $result['surah']);
        $this->assertSame(4, $result['requestedAyah']);
        $this->assertCount(2, $result['books']);
        $this->assertSame(
            ['startAyah' => 3, 'endAyah' => 4, 'isShared' => true],
            $result['books'][0]['range'],
        );
        $this->assertSame(
            ['startAyah' => 3, 'endAyah' => 4, 'isShared' => true],
            $result['books'][1]['range'],
        );

        Http::assertSent(function ($request) {
            return $request->url() === 'https://admin.mokhtasr.com/api/v1/book-contents'
                && $request->hasHeader('Authorization', 'Bearer test-token')
                && $request['books'] === '200,319'
                && (string) $request['sura'] === '2'
                && (string) $request['aya'] === '4';
        });
    }

    public function test_it_extracts_arabic_indic_digits_in_shared_ranges(): void
    {
        Http::fake([
            'admin.mokhtasr.com/*' => Http::response([
                'data' => [[
                    'books' => [[
                        'book_id' => 200,
                        'text' => '٣ - ٦ - تفسير يشمل أربع آيات',
                    ]],
                ]],
            ]),
        ]);

        $result = app(MokhtasrTafsirService::class)->getAyahTafsir(2, 5);

        $this->assertSame(
            ['startAyah' => 3, 'endAyah' => 6, 'isShared' => true],
            $result['books'][0]['range'],
        );
    }

    public function test_it_does_not_infer_a_shared_range_from_repeated_or_unmarked_text(): void
    {
        Http::fake([
            'admin.mokhtasr.com/*' => Http::response([
                'data' => [[
                    'books' => [[
                        'book_id' => 200,
                        'text' => 'تفسير مستقل بدون نطاق صريح',
                    ]],
                ]],
            ]),
        ]);

        $result = app(MokhtasrTafsirService::class)->getAyahTafsir(2, 5);

        $this->assertSame(
            ['startAyah' => 5, 'endAyah' => 5, 'isShared' => false],
            $result['books'][0]['range'],
        );
    }

    public function test_it_cleans_html_break_tags_without_dropping_the_line_break(): void
    {
        Http::fake([
            'admin.mokhtasr.com/*' => Http::response([
                'data' => [[
                    'books' => [[
                        'book_id' => 200,
                        'text' => 'بداية<br/>نهاية',
                    ]],
                ]],
            ]),
        ]);

        $result = app(MokhtasrTafsirService::class)->getAyahTafsir(2, 6);

        $this->assertSame("بداية\nنهاية", $result['books'][0]['plain_text']);
    }
}
