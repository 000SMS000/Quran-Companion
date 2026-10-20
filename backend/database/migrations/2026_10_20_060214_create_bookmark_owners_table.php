
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookmark_owners', function (Blueprint $table) {
            $table->id();

            // SHA-256 hash of the guest's secret token.
            $table->string('token_hash', 64)->nullable()->unique();

            // Future link to a registered user.
            $table->foreignId('user_id')
                ->nullable()
                ->unique()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookmark_owners');
    }
};
