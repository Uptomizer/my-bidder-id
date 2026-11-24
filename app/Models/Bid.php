<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'auction_id',
    'user_id',
    'amount',
    'status',
    'disqualified_reason',
    'disqualified_at',
    'disqualified_by',
])]
class Bid extends Model
{
    use HasFactory;

    /**
     * Disable updated_at since bids table only has created_at.
     */
    public $timestamps = false;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'disqualified_at' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    /**
     * Auction for this bid.
     */
    public function auction(): BelongsTo
    {
        return $this->belongsTo(Auction::class);
    }

    /**
     * User who placed the bid.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Admin who disqualified this bid, if applicable.
     */
    public function disqualifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'disqualified_by');
    }

    /**
     * Masked bidder name for public view.
     */
    public function getMaskedBidderNameAttribute(): string
    {
        return $this->user ? $this->user->masked_name : 'Anonim';
    }
}
