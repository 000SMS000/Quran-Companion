<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Quran\QuranApiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use RuntimeException;

class QuranController extends Controller
{
    public function __construct(
        private readonly QuranApiService $quran,
    ) {
    }

    public function surahs(): JsonResponse
    {
        return $this->respond(fn () => $this->quran->getSurahs());
    }

    public function surah(Request $request, int $number): JsonResponse
    {
        if ($number < 1 || $number > 114) {
            return response()->json([
                'success' => false,
                'message' => 'The selected Surah must be between 1 and 114.',
            ], 422);
        }

        $validated = $request->validate([
            'translation' => ['sometimes', 'string', 'max:80'],
            'audio' => ['sometimes', 'string', 'max:80'],
        ]);

        return $this->respond(fn () => $this->quran->getSurah(
            $number,
            $validated['translation'] ?? null,
            $validated['audio'] ?? null,
        ));
    }

    public function editions(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'language' => ['sometimes', 'string', 'size:2'],
            'format' => ['sometimes', 'string', 'in:text,audio'],
            'type' => ['sometimes', 'string', 'max:40'],
        ]);

        return $this->respond(fn () => $this->quran->getEditions($validated));
    }

    public function search(Request $request): JsonResponse
    {
        $validator = Validator::make($request->query(), [
            'q' => ['required', 'string', 'min:2', 'max:120'],
            'edition' => ['sometimes', 'string', 'max:80'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Please enter a search query of at least 2 characters.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();

        return $this->respond(fn () => $this->quran->search(
            trim($validated['q']),
            $validated['edition'] ?? null,
        ));
    }

    public function audioEditions(): JsonResponse
    {
        return $this->respond(fn () => $this->quran->getAudioEditions());
    }

    protected function respond(callable $callback): JsonResponse
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $callback(),
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
