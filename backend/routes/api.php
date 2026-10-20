<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\QuranController;
use App\Http\Controllers\Api\BookmarkController;
use App\Http\Middleware\EnsureBookmarkOwner;

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'message' => 'Quran Companion Laravel API is running.',
    ]);
});

Route::prefix('quran')->group(function () {
    Route::get('/surahs', [QuranController::class, 'surahs']);
    Route::get('/surahs/{number}', [QuranController::class, 'surah'])->whereNumber('number');
    Route::get('/editions', [QuranController::class, 'editions']);
    Route::get('/search', [QuranController::class, 'search']);
    Route::get('/audio-editions', [QuranController::class, 'audioEditions']);
});

Route::prefix('bookmarks')
    ->middleware(EnsureBookmarkOwner::class)
    ->group(function () {
        Route::get('/', [BookmarkController::class, 'index']);
        Route::post('/', [BookmarkController::class, 'store']);
        Route::delete('/{bookmark}', [BookmarkController::class, 'destroy'])
            ->whereNumber('bookmark');
    });