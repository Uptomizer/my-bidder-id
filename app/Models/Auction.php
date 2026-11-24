<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

#[Fillable([
    'title',
    'slug',
    'category_id',
    'description',
    'starting_price',
    'min_increment',
    'current_price',
    'buy_now_price',
    'start_time',
    'end_time',
    'status',
    'winner_id',
    'winner_verification_status',
    'winner_full_name',
    'winner_phone',
    'winner_address',
    'winner_postal_code',
    'winner_address_detail',
    'winner_notes',
    'winner_verification_note',
    'winner_form_submitted_at',
    'winner_verified_at',
    'images',
    'created_by',
])]
class Auction extends Model
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
            'starting_price' => 'integer',
            'min_increment' => 'integer',
            'current_price' => 'integer',
            'buy_now_price' => 'integer',
            'start_time' => 'datetime',
            'end_time' => 'datetime',
            'winner_form_submitted_at' => 'datetime',
            'winner_verified_at' => 'datetime',
            'images' => 'array',
        ];
    }

    /**
     * Auction category.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Auction creator (Admin).
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Auction winner.
     */
    public function winner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'winner_id');
    }

    /**
     * All bids placed on this auction.
     */
    public function bids(): HasMany
    {
        return $this->hasMany(Bid::class)->orderByDesc('amount');
    }

    /**
     * Only valid bids placed on this auction.
     */
    public function validBids(): HasMany
    {
        return $this->hasMany(Bid::class)
            ->where('status', 'valid')
            ->orderByDesc('amount');
    }

    /**
     * Payment record for this auction.
     */
    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class);
    }

    /**
     * Scope to find auctions currently live and active.
     */
    public function scopeLive(Builder $query): Builder
    {
        $now = Carbon::now();

        return $query->where('status', 'active')
            ->where('start_time', '<=', $now)
            ->where('end_time', '>', $now);
    }

    /**
     * Check if auction is currently live.
     */
    public function isLive(): bool
    {
        $now = Carbon::now();

        return $this->status === 'active'
            && $this->start_time <= $now
            && $this->end_time > $now;
    }

    /**
     * Check if auction has finished/ended.
     */
    public function hasEnded(): bool
    {
        return $this->status === 'ended'
            || $this->status === 'settled'
            || $this->end_time <= Carbon::now();
    }

    /**
     * Calculate the minimum required next bid.
     */
    public function getNextMinBid(): int
    {
        $highest = $this->validBids()->max('amount');

        if ($highest === null) {
            return (int) $this->starting_price;
        }

        return (int) ($highest + $this->min_increment);
    }

    /**
     * Get the highest valid bid record.
     */
    public function getHighestBid(): ?Bid
    {
        return $this->validBids()->first();
    }

    /**
     * Generate formatted invoice number for this auction.
     */
    public function getInvoiceNumber(): string
    {
        $datePart = ($this->end_time ?? Carbon::now())->format('Ymd');

        return 'INV-' . $datePart . '-' . str_pad((string) $this->id, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Finalize winner, lock auction, and send automatic Invoice notification + email.
     */
    public function finalizeWinnerAndSendInvoice(?Bid $winningBid = null, bool $forceEndNow = false): void
    {
        $bid = $winningBid ?? $this->validBids()->first();
        $winnerId = $bid ? $bid->user_id : null;
        $winningPrice = $bid ? (int) $bid->amount : (int) $this->current_price;

        $updateData = [
            'status' => 'ended',
            'winner_id' => $winnerId,
            'current_price' => $winningPrice,
        ];

        if ($forceEndNow && $this->end_time > Carbon::now()) {
            $updateData['end_time'] = Carbon::now();
        }

        $this->update($updateData);

        if (! $winnerId) {
            return;
        }

        $invoiceNumber = $this->getInvoiceNumber();
        $formattedPrice = 'Rp ' . number_format($winningPrice, 0, ',', '.');

        // Prevent duplicate auction_won notification for the same winner & auction
        $alreadyNotified = Notification::where('user_id', $winnerId)
            ->where('type', 'auction_won')
            ->where('url', route('user.wins'))
            ->get()
            ->contains(function (Notification $n) {
                return isset($n->data['auction_id']) && (int) $n->data['auction_id'] === (int) $this->id;
            });

        if (! $alreadyNotified) {
            Notification::create([
                'user_id' => $winnerId,
                'type' => 'auction_won',
                'title' => 'Selamat! Anda Memenangkan Lelang! (' . $invoiceNumber . ')',
                'message' => 'Tagihan otomatis ' . $invoiceNumber . ' untuk lelang "' . $this->title . '" sebesar ' . $formattedPrice . ' telah diterbitkan. Silakan unggah bukti pembayaran melalui Portal Pembayaran.',
                'url' => route('user.wins'),
                'data' => [
                    'auction_id' => $this->id,
                    'invoice_number' => $invoiceNumber,
                    'winning_price' => $winningPrice,
                ],
            ]);
        }

        // Send automatic Invoice email to winner
        $winner = User::find($winnerId);
        if ($winner && $winner->email) {
            try {
                $emailBody = "Halo {$winner->name},\n\n"
                    . "Selamat! Anda telah ditetapkan sebagai pemenang resmi pada sesi lelang MyBidder.ID.\n\n"
                    . "=== RINCIAN TAGIHAN OTOMATIS (INVOICE) ===\n"
                    . "Nomor Invoice : {$invoiceNumber}\n"
                    . "Nama Barang   : {$this->title}\n"
                    . "Harga Menang  : {$formattedPrice}\n"
                    . "Status        : Menunggu Pelunasan\n\n"
                    . "Silakan masuk ke Portal Pembayaran untuk mengunggah bukti pelunasan Anda:\n"
                    . route('user.wins') . "\n\n"
                    . "Terima kasih,\nTim Keuangan & Verifikasi MyBidder.ID";

                Mail::raw($emailBody, function ($message) use ($winner, $invoiceNumber) {
                    $message->to($winner->email, $winner->name)
                        ->subject("Tagihan Otomatis Pemenang Lelang [{$invoiceNumber}] - MyBidder.ID");
                });
            } catch (\Throwable $e) {
                Log::info('Invoice email logged: ' . $e->getMessage());
            }
        }
    }

    /**
     * Close all expired active auctions and determine highest valid bidder as winner.
     */
    public static function closeEndedAuctions(): int
    {
        $now = Carbon::now();

        if (! static::where('status', 'active')->where('end_time', '<=', $now)->exists()) {
            return 0;
        }

        $expiredAuctions = static::where('status', 'active')
            ->where('end_time', '<=', $now)
            ->with('validBids')
            ->get();

        $count = 0;
        foreach ($expiredAuctions as $auction) {
            $auction->finalizeWinnerAndSendInvoice($auction->validBids->first(), false);
            $count++;
        }

        return $count;
    }
}
