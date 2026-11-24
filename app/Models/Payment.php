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
    'proof_image',
    'bank_name',
    'account_name',
    'account_number',
    'status',
    'shipping_status',
    'courier_name',
    'tracking_number',
    'shipped_at',
    'shipping_notes',
    'admin_notes',
    'verified_at',
    'verified_by',
])]
class Payment extends Model
{
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'verified_at' => 'datetime',
            'shipped_at' => 'datetime',
        ];
    }

    /**
     * Auction associated with this payment.
     */
    public function auction(): BelongsTo
    {
        return $this->belongsTo(Auction::class);
    }

    /**
     * User who made the payment.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Admin who verified the payment.
     */
    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}
