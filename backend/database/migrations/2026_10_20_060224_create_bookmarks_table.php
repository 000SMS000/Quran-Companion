
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookmarks', function (Blueprint $table) {
            $table->id();

            $table->foreignId('owner_id')
                ->constrained('bookmark_owners')
                ->cascadeOnDelete();

            $table->unsignedTinyInteger('surah_number');
            $table->unsignedTinyInteger('ayah_number');

            $table->timestamps();

            // A given owner can bookmark an ayah only once.
            $table->unique(
                ['owner_id', 'surah_number', 'ayah_number'],
                'bookmarks_owner_surah_ayah_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookmarks');
    }
};
