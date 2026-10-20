<?php

namespace App\Services\Bookmarks;

use App\Models\BookmarkOwner;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class GuestBookmarkOwnerService
{
    public const COOKIE_NAME = 'quran_companion_guest_token';

    public function resolve(Request $request): array
    {
        $token = $request->cookie(self::COOKIE_NAME);

        if (is_string($token) && $token !== '') {
            $owner = BookmarkOwner::where(
                'token_hash',
                hash('sha256', $token)
            )->first();

            if ($owner) {
                return [
                    'owner' => $owner,
                    'token' => null,
                ];
            }
        }

        $token = Str::random(64);

        $owner = BookmarkOwner::create([
            'token_hash' => hash('sha256', $token),
        ]);

        return [
            'owner' => $owner,
            'token' => $token,
        ];
    }
}
