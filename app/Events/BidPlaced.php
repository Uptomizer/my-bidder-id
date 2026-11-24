<?php

namespace App\Events;

use App\Models\Auction;
use App\Models\Bid;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class BidPlaced implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public Auction $auction,
        public Bid $bid,
        public ?int $outbidUserId = null
    ) {
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('auction.' . $this->auction->id),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'bid.placed';
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'auction_id' => $this->auction->id,
            'current_price' => $this->auction->current_price,
            'next_min_bid' => $this->auction->getNextMinBid(),
            'bid' => [
                'id' => $this->bid->id,
                'user_id' => $this->bid->user_id,
                'amount' => $this->bid->amount,
                'masked_bidder_name' => $this->bid->masked_bidder_name,
                'created_at' => $this->bid->created_at?->diffForHumans() ?? 'Baru saja',
            ],
            'outbid_user_id' => $this->outbidUserId,
        ];
    }
}
