<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Bookmark extends Model
{
    use HasFactory;

    protected $fillable = [
        'owner_id',
        'surah_number',
        'ayah_number',
    ];

    protected function casts(): array
    {
        return [
            'owner_id' => 'integer',
            'surah_number' => 'integer',
            'ayah_number' => 'integer',
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(BookmarkOwner::class, 'owner_id');
    }
}
