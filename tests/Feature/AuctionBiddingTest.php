<?php

namespace Tests\Feature;

use App\Models\Auction;
use App\Models\Bid;
use App\Models\Category;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuctionBiddingTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $user;
    protected Category $category;
    protected Auction $auction;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::create([
            'name' => 'Admin Test',
            'email' => 'admin@test.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'status' => 'active',
        ]);

        $this->user = User::create([
            'name' => 'Bidder Test',
            'email' => 'user@test.com',
            'password' => bcrypt('password'),
            'role' => 'user',
            'status' => 'active',
        ]);

        $this->category = Category::create([
            'name' => 'Vintage Horology',
            'slug' => 'vintage-horology',
            'description' => 'Rare watches',
        ]);

        $now = Carbon::now();
        $this->auction = Auction::create([
            'title' => 'Omega Speedmaster 1969',
            'slug' => 'omega-speedmaster-1969',
            'category_id' => $this->category->id,
            'description' => 'Collector item original release.',
            'starting_price' => 50000000,
            'min_increment' => 1000000,
            'current_price' => 50000000,
            'start_time' => $now->copy()->subHour(),
            'end_time' => $now->copy()->addDays(2),
            'status' => 'active',
            'images' => ['https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9'],
            'created_by' => $this->admin->id,
        ]);
    }

    public function test_public_can_view_auction_catalog(): void
    {
        $response = $this->get(route('auctions.index'));
        $response->assertStatus(200);
    }

    public function test_public_can_view_auction_detail(): void
    {
        $response = $this->get(route('auctions.show', $this->auction->slug));
        $response->assertStatus(200);
    }

    public function test_guest_cannot_place_bid(): void
    {
        $response = $this->post(route('auctions.bid', $this->auction->id), [
            'amount' => 51000000,
        ]);

        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_user_can_place_valid_bid(): void
    {
        $response = $this->actingAs($this->user)
            ->post(route('auctions.bid', $this->auction->id), [
                'amount' => 51000000,
            ]);

        $response->assertSessionHas('success');
        $this->assertDatabaseHas('bids', [
            'auction_id' => $this->auction->id,
            'user_id' => $this->user->id,
            'amount' => 51000000,
            'status' => 'valid',
        ]);

        $this->assertEquals(51000000, $this->auction->fresh()->current_price);
    }

    public function test_bid_below_next_minimum_increment_is_rejected(): void
    {
        $response = $this->actingAs($this->user)
            ->post(route('auctions.bid', $this->auction->id), [
                'amount' => 45000000, // lower than starting price 50jt
            ]);

        $response->assertSessionHas('error');
        $this->assertEquals(0, Bid::count());
    }

    public function test_bid_not_matching_increment_rule_is_rejected(): void
    {
        // min_increment is 1000000, valid bids are 51000000, 52000000, etc.
        // 51500000 violates the increment of 1.000.000
        $response = $this->actingAs($this->user)
            ->post(route('auctions.bid', $this->auction->id), [
                'amount' => 51500000,
            ]);

        $response->assertSessionHas('error');
        $this->assertEquals(0, Bid::count());
    }

    public function test_outbid_user_receives_notification(): void
    {
        // First user bids
        $this->actingAs($this->user)->post(route('auctions.bid', $this->auction->id), [
            'amount' => 51000000,
        ]);

        $secondUser = User::create([
            'name' => 'Second Bidder',
            'email' => 'second@test.com',
            'password' => bcrypt('password'),
            'role' => 'user',
            'status' => 'active',
        ]);

        // Second user outbids first user
        $this->actingAs($secondUser)->post(route('auctions.bid', $this->auction->id), [
            'amount' => 52000000,
        ]);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->user->id,
            'type' => 'outbid',
        ]);
    }

    public function test_regular_user_cannot_access_admin_dashboard(): void
    {
        $response = $this->actingAs($this->user)->get(route('admin.dashboard'));
        $response->assertStatus(403);
    }

    public function test_admin_can_access_admin_dashboard(): void
    {
        $response = $this->actingAs($this->admin)->get(route('admin.dashboard'));
        $response->assertStatus(200);
    }

    public function test_admin_can_disqualify_suspicious_bid(): void
    {
        $bid = Bid::create([
            'auction_id' => $this->auction->id,
            'user_id' => $this->user->id,
            'amount' => 55000000,
            'status' => 'valid',
        ]);

        $this->auction->update(['current_price' => 55000000]);

        $response = $this->actingAs($this->admin)
            ->post(route('admin.bids.disqualify', $bid->id), [
                'reason' => 'Indikasi penawaran robot fiktif',
            ]);

        $response->assertSessionHas('success');
        $this->assertEquals('disqualified', $bid->fresh()->status);
        // Price should fall back to starting price since no other valid bids
        $this->assertEquals(50000000, $this->auction->fresh()->current_price);
    }

    public function test_admin_can_publish_draft_auction_to_live(): void
    {
        $this->auction->update(['status' => 'draft']);

        $response = $this->actingAs($this->admin)
            ->post(route('admin.auctions.publish', $this->auction->id));

        $response->assertSessionHas('success');
        $this->assertEquals('active', $this->auction->fresh()->status);
    }

    public function test_admin_can_approve_winner_and_send_invoice(): void
    {
        Bid::create([
            'auction_id' => $this->auction->id,
            'user_id' => $this->user->id,
            'amount' => 52000000,
            'status' => 'valid',
        ]);
        $this->auction->update(['current_price' => 52000000]);

        $response = $this->actingAs($this->admin)
            ->post(route('admin.auctions.approve-winner', $this->auction->id));

        $response->assertSessionHas('success');

        $freshAuction = $this->auction->fresh();
        $this->assertEquals('ended', $freshAuction->status);
        $this->assertEquals($this->user->id, $freshAuction->winner_id);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->user->id,
            'type' => 'auction_won',
        ]);
    }

    public function test_user_can_place_quick_bid_with_nominal_and_percentage_options(): void
    {
        // Starting price is 50.000.000, min_increment is 1.000.000
        // With quick_bid = true, user can select +500rb (50.500.000)
        $response500k = $this->actingAs($this->user)
            ->post(route('auctions.bid', $this->auction->id), [
                'amount' => 50500000,
                'quick_bid' => true,
            ]);
        $response500k->assertSessionHas('success');
        $this->assertEquals(50500000, $this->auction->fresh()->current_price);

        // Next quick bid by second user: +10% of current bid (50.500.000 + 5.050.000 = 55.550.000)
        $secondUser = User::create([
            'name' => 'Quick Bidder Two',
            'email' => 'quick2@test.com',
            'password' => bcrypt('password'),
            'role' => 'user',
            'status' => 'active',
        ]);

        $response10Pct = $this->actingAs($secondUser)
            ->post(route('auctions.bid', $this->auction->id), [
                'amount' => 55550000,
                'quick_bid' => true,
            ]);
        $response10Pct->assertSessionHas('success');
        $this->assertEquals(55550000, $this->auction->fresh()->current_price);
    }

    public function test_notification_popup_endpoint_returns_only_five_latest_notifications(): void
    {
        for ($i = 1; $i <= 8; $i++) {
            \App\Models\Notification::create([
                'user_id' => $this->user->id,
                'type' => 'outbid',
                'title' => "Notifikasi Ke-{$i}",
                'message' => "Pesan notifikasi ke-{$i}",
                'url' => route('auctions.show', $this->auction->slug),
                'is_read' => false,
            ]);
        }

        $response = $this->actingAs($this->user)->getJson(route('notifications.unread-count'));
        $response->assertOk()
            ->assertJsonPath('unread_count', 8)
            ->assertJsonCount(5, 'recent_notifications');
    }
}
