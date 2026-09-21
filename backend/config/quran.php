<?php

return [
    'base_url' => env('QURAN_API_BASE_URL', 'https://api.alquran.cloud/v1'),
    'timeout' => env('QURAN_API_TIMEOUT', 10),
    'default_translation' => env('QURAN_DEFAULT_TRANSLATION', 'en.sahih'),
    'default_audio' => env('QURAN_DEFAULT_AUDIO', 'ar.alafasy'),
];
