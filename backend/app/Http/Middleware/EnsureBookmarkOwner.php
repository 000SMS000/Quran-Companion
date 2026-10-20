<?php

namespace App\Http\Middleware;

use App\Services\Bookmarks\GuestBookmarkOwnerService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureBookmarkOwner
{
    public function __construct(
        private GuestBookmarkOwnerService $ownerService
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $result = $this->ownerService->resolve($request);

        $request->attributes->set(
            'bookmarkOwner',
            $result['owner']
        );

        $response = $next($request);

        if ($result['token'] !== null) {
            $response->headers->setCookie(
                cookie(
                    GuestBookmarkOwnerService::COOKIE_NAME,
                    $result['token'],
                    60 * 24 * 365,
                    '/',
                    null,
                    app()->environment('production'),
                    true,
                    false,
                    'lax'
                )
            );
        }

        return $response;
    }
}
