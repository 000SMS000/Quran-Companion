<?php

return [
    'base_url' => env('MOKHTASR_API_BASE_URL', 'https://admin.mokhtasr.com/api/v1'),
    'token' => env('MOKHTASR_API_TOKEN'),
    'connect_timeout' => (int) env('MOKHTASR_API_CONNECT_TIMEOUT', 10),
    'timeout' => (int) env('MOKHTASR_API_TIMEOUT', 30),
    'cache_days' => (int) env('MOKHTASR_CACHE_DAYS', 7),
    'books' => [
        'ar' => (int) env('MOKHTASR_ARABIC_BOOK_ID', 200),
        'en' => (int) env('MOKHTASR_ENGLISH_BOOK_ID', 319),
    ],
    'language_ids' => [
        'ar' => 1,
        'en' => 4,
    ],
];
