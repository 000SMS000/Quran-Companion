<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookmarkTest extends TestCase
{
    use RefreshDatabase;

    private function createGuest(): array
    {
        $response = $this->postJson('/api/bookmarks', [
            'surah_number' => 1,
            'ayah_number' => 1,
        ]);

        $response->assertCreated();

        $cookie = collect($response->headers->getCookies())
            ->first(
                fn ($cookie) =>
                    $cookie->getName() === 'quran_companion_guest_token'
            );

        $this->assertNotNull($cookie);

        return [
            'bookmark_id' => $response->json('data.id'),
            'token' => $cookie->getValue(),
        ];
    }

    public function test_guest_can_save_a_valid_ayah(): void
    {
        $response = $this->postJson('/api/bookmarks', [
            'surah_number' => 1,
            'ayah_number' => 1,
        ]);

        $response->assertCreated();

        $this->assertDatabaseHas('bookmarks', [
            'surah_number' => 1,
            'ayah_number' => 1,
        ]);
    }

    public function test_invalid_ayah_number_is_rejected(): void
    {
        $response = $this->postJson('/api/bookmarks', [
            'surah_number' => 1,
            'ayah_number' => 8,
        ]);

        $response->assertStatus(422);

        $this->assertDatabaseCount('bookmarks', 0);
    }

    public function test_duplicate_bookmark_is_not_created_twice(): void
    {
        $guest = $this->createGuest();

        $this->withCredentials()
            ->withUnencryptedCookie(
                'quran_companion_guest_token',
                $guest['token']
            )
            ->postJson('/api/bookmarks', [
                'surah_number' => 1,
                'ayah_number' => 1,
            ])->assertCreated();

        $this->assertDatabaseCount('bookmarks', 1);
    }

    public function test_guest_can_delete_own_bookmark(): void
    {
        $guest = $this->createGuest();

        $this->withCredentials()
            ->withUnencryptedCookie(
                'quran_companion_guest_token',
                $guest['token']
            )
            ->deleteJson(
                "/api/bookmarks/{$guest['bookmark_id']}"
            )->assertOk();

        $this->assertDatabaseMissing('bookmarks', [
            'id' => $guest['bookmark_id'],
        ]);
    }

    public function test_guest_cannot_delete_another_guests_bookmark(): void
    {
        $guestA = $this->createGuest();

        $guestBResponse = $this->getJson('/api/bookmarks');
        $guestBResponse->assertOk();

        $guestBCookie = collect($guestBResponse->headers->getCookies())
            ->first(
                fn ($cookie) =>
                    $cookie->getName() === 'quran_companion_guest_token'
            );

        $this->assertNotNull($guestBCookie);
        $this->assertNotSame($guestA['token'], $guestBCookie->getValue());

        $this->withCredentials()
            ->withUnencryptedCookie(
                'quran_companion_guest_token',
                $guestBCookie->getValue()
            )
            ->deleteJson(
                "/api/bookmarks/{$guestA['bookmark_id']}"
            )->assertNotFound();

        $this->assertDatabaseHas('bookmarks', [
            'id' => $guestA['bookmark_id'],
        ]);
    }
}