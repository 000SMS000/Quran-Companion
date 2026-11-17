<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Quran\MokhtasrTafsirService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class TafsirController extends Controller
{
    public function __construct(
        private readonly MokhtasrTafsirService $tafsir,
    ) {
    }

    public function ayah(Request $request, int $surah, int $ayah): JsonResponse
    {
        if ($surah < 1 || $surah > 114) {
            return response()->json([
                'success' => false,
                'message' => 'The selected Surah must be between 1 and 114.',
            ], 422);
        }

        $ayahCount = (int) (config('quran.surah_ayah_counts')[$surah] ?? 0);

        if ($ayah < 1 || $ayahCount === 0 || $ayah > $ayahCount) {
            return response()->json([
                'success' => false,
                'message' => 'The selected Ayah is not valid for this Surah.',
            ], 422);
        }

        try {
            return response()->json([
                'success' => true,
                'data' => $this->tafsir->getAyahTafsir($surah, $ayah),
            ]);
        } catch (RuntimeException $exception) {
            $status = $exception->getCode();

            if ($status < 400 || $status > 599) {
                $status = 502;
            }

            return response()->json([
                'success' => false,
                'message' => $exception->getMessage(),
            ], $status);
        }
    }
}
