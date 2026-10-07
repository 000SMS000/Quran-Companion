<?php

$url = 'https://api.alquran.cloud/v1/search/Allah/all/en.sahih';

$ch = curl_init($url);

curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_TIMEOUT => 60,
    CURLOPT_HTTPHEADER => [
        'Accept-Encoding: gzip',
    ],
]);

$response = curl_exec($ch);

echo "HTTP CODE: " . curl_getinfo($ch, CURLINFO_HTTP_CODE) . PHP_EOL;
echo "CONTENT TYPE: " . curl_getinfo($ch, CURLINFO_CONTENT_TYPE) . PHP_EOL;
echo "SIZE: " . curl_getinfo($ch, CURLINFO_SIZE_DOWNLOAD) . " bytes" . PHP_EOL;
echo "TOTAL TIME: " . curl_getinfo($ch, CURLINFO_TOTAL_TIME) . " seconds" . PHP_EOL;
echo "CURL ERROR: " . curl_error($ch) . PHP_EOL;

curl_close($ch);