<?php

namespace App\Models;
    
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BookmarkOwner extends Model
{
    use HasFactory;

    protected $fillable = [
        'token_hash',
        'user_id',
    ];

    protected $hidden = [
        'token_hash',
    ];

    public function bookmarks(): HasMany
    {
        return $this->hasMany(Bookmark::class, 'owner_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
