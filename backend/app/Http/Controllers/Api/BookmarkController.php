<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bookmark;
use App\Models\BookmarkOwner;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookmarkController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        /** @var BookmarkOwner $owner */
        $owner = $request->attributes->get('bookmarkOwner');

        $bookmarks = $owner->bookmarks()
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data' => $bookmarks,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        /** @var BookmarkOwner $owner */
        $owner = $request->attributes->get('bookmarkOwner');

        $validated = $request->validate([
            'surah_number' => ['required', 'integer', 'between:1,114'],
            'ayah_number' => ['required', 'integer', 'min:1'],
        ]);

        $surahNumber = (int) $validated['surah_number'];
        $ayahNumber = (int) $validated['ayah_number'];

        $ayahCount = config("quran.surah_ayah_counts.{$surahNumber}");

        if ($ayahCount === null || $ayahNumber > $ayahCount) {
            return response()->json([
                'message' => 'The selected ayah does not exist in this surah.',
                'errors' => [
                    'ayah_number' => [
                        'The selected ayah does not exist in this surah.',
                    ],
                ],
            ], 422);
        }

        $bookmark = $owner->bookmarks()->firstOrCreate([
            'surah_number' => $surahNumber,
            'ayah_number' => $ayahNumber,
        ]);

        return response()->json([
            'message' => 'Bookmark saved successfully.',
            'data' => $bookmark,
        ], 201);
    }

    public function destroy(
        Request $request,
        Bookmark $bookmark
    ): JsonResponse {
        /** @var BookmarkOwner $owner */
        $owner = $request->attributes->get('bookmarkOwner');

        // Make sure this bookmark belongs to the current guest.
        $ownedBookmark = $owner->bookmarks()
            ->whereKey($bookmark->id)
            ->firstOrFail();

        $ownedBookmark->delete();

        return response()->json([
            'message' => 'Bookmark deleted successfully.',
        ]);
    }
}