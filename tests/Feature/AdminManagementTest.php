<?php

namespace Tests\Feature;

use App\Models\Auction;
use App\Models\Bid;
use App\Models\Category;
use App\Models\Payment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminManagementTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $user;
    protected Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::create([
            'name' => 'Admin Utama',
            'email' => 'admin@mybidder.id',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'status' => 'active',
        ]);

        $this->user = User::create([
            'name' => 'Kolektor User',
            'email' => 'user@mybidder.id',
            'password' => bcrypt('password'),
            'role' => 'user',
            'status' => 'active',
        ]);

        $this->category = Category::create([
            'name' => 'Horology & Jam Tangan',
            'slug' => 'horology',
            'description' => 'Jam tangan mewah',
        ]);
    }

    /**
     * Module 1: Manajemen Katalog Lelang
     */
    public function test_admin_can_create_new_auction_with_file_upload_and_pricing(): void
    {
        Storage::fake('public');

        $file = UploadedFile::fake()->image('rolex.jpg');

        $response = $this->actingAs($this->admin)->post(route('admin.auctions.store'), [
            'title' => 'Rolex Submariner Vintage 1982',
            'category_id' => $this->category->id,
            'description' => 'Kondisi mulus original box dan garansi.',
            'starting_price' => 150000000,
            'min_increment' => 2000000,
            'buy_now_price' => 250000000,
            'start_time' => Carbon::now()->toISOString(),
            'end_time' => Carbon::now()->addDays(3)->toISOString(),
            'status' => 'active',
            'image_files' => [$file],
        ]);

        $response->assertRedirect(route('admin.auctions.index'));
        $this->assertDatabaseHas('auctions', [
            'title' => 'Rolex Submariner Vintage 1982',
            'starting_price' => 150000000,
            'min_increment' => 2000000,
            'status' => 'active',
        ]);

        $auction = Auction::where('title', 'Rolex Submariner Vintage 1982')->first();
        $this->assertNotEmpty($auction->images);
    }

    public function test_admin_can_update_auction_details(): void
    {
        $auction = Auction::create([
            'title' => 'Patek Philippe Calatrava',
            'slug' => 'patek-calatrava',
            'category_id' => $this->category->id,
            'description' => 'Deskripsi lama',
            'starting_price' => 300000000,
            'min_increment' => 5000000,
            'current_price' => 300000000,
            'start_time' => Carbon::now(),
            'end_time' => Carbon::now()->addDays(2),
            'status' => 'draft',
            'images' => ['https://images.unsplash.com/test.jpg'],
            'created_by' => $this->admin->id,
        ]);

        $response = $this->actingAs($this->admin)->put(route('admin.auctions.update', $auction->id), [
            'title' => 'Patek Philippe Calatrava Updated',
            'category_id' => $this->category->id,
            'description' => 'Deskripsi terupdate dengan sertifikat lengkap.',
            'starting_price' => 320000000,
            'min_increment' => 10000000,
            'start_time' => Carbon::now()->toISOString(),
            'end_time' => Carbon::now()->addDays(4)->toISOString(),
            'status' => 'active',
        ]);

        $response->assertRedirect(route('admin.auctions.index'));
        $this->assertDatabaseHas('auctions', [
            'id' => $auction->id,
            'title' => 'Patek Philippe Calatrava Updated',
            'starting_price' => 320000000,
            'min_increment' => 10000000,
            'status' => 'active',
        ]);
    }

    public function test_live_and_finished_auctions_cannot_be_edited_or_deleted_while_draft_can(): void
    {
        $liveAuction = Auction::create([
            'title' => 'Live Item Tidak Bisa Diedit',
            'slug' => 'live-item-locked',
            'category_id' => $this->category->id,
            'description' => 'Barang sudah live',
            'starting_price' => 10000000,
            'min_increment' => 500000,
            'current_price' => 10000000,
            'start_time' => Carbon::now()->subHour(),
            'end_time' => Carbon::now()->addDay(),
            'status' => 'active',
            'images' => ['https://images.unsplash.com/test.jpg'],
            'created_by' => $this->admin->id,
        ]);

        $endedUnsoldAuction = Auction::create([
            'title' => 'Ended Tidak Laku Tidak Bisa Dihapus',
            'slug' => 'ended-unsold-locked',
            'category_id' => $this->category->id,
            'description' => 'Barang selesai tanpa bid',
            'starting_price' => 10000000,
            'min_increment' => 500000,
            'current_price' => 10000000,
            'start_time' => Carbon::now()->subDays(2),
            'end_time' => Carbon::now()->subHour(),
            'status' => 'ended',
            'images' => ['https://images.unsplash.com/test.jpg'],
            'created_by' => $this->admin->id,
        ]);

        // Live auction cannot be edited or deleted
        $this->actingAs($this->admin)->get(route('admin.auctions.edit', $liveAuction->id))
            ->assertRedirect(route('admin.auctions.index'))
            ->assertSessionHas('error');

        $this->actingAs($this->admin)->put(route('admin.auctions.update', $liveAuction->id), [
            'title' => 'Hacked Title',
            'category_id' => $this->category->id,
            'description' => 'Updated',
            'min_increment' => 500000,
            'start_time' => Carbon::now()->toISOString(),
            'end_time' => Carbon::now()->addDay()->toISOString(),
            'status' => 'active',
        ])->assertSessionHas('error');

        $this->actingAs($this->admin)->delete(route('admin.auctions.destroy', $liveAuction->id))
            ->assertSessionHas('error');
        $this->assertDatabaseHas('auctions', ['id' => $liveAuction->id, 'title' => 'Live Item Tidak Bisa Diedit']);

        // Ended unsold auction cannot be edited or deleted
        $this->actingAs($this->admin)->delete(route('admin.auctions.destroy', $endedUnsoldAuction->id))
            ->assertSessionHas('error');
        $this->assertDatabaseHas('auctions', ['id' => $endedUnsoldAuction->id]);

        // Draft auction CAN be deleted
        $draftAuction = Auction::create([
            'title' => 'Draft Item Bisa Dihapus',
            'slug' => 'draft-item-deletable',
            'category_id' => $this->category->id,
            'description' => 'Barang masih draft',
            'starting_price' => 10000000,
            'min_increment' => 500000,
            'current_price' => 10000000,
            'start_time' => Carbon::now(),
            'end_time' => Carbon::now()->addDay(),
            'status' => 'draft',
            'images' => ['https://images.unsplash.com/test.jpg'],
            'created_by' => $this->admin->id,
        ]);

        $this->actingAs($this->admin)->delete(route('admin.auctions.destroy', $draftAuction->id))
            ->assertSessionHas('success');
        $this->assertDatabaseMissing('auctions', ['id' => $draftAuction->id]);
    }

    /**
     * Module 2: Verifikasi & Moderasi Penawaran (Bid Control)
     */
    public function test_admin_can_disqualify_and_restore_suspicious_bid(): void
    {
        $auction = Auction::create([
            'title' => 'Audemars Piguet Royal Oak',
            'slug' => 'ap-royal-oak',
            'category_id' => $this->category->id,
            'description' => 'Rare blue dial.',
            'starting_price' => 200000000,
            'min_increment' => 5000000,
            'current_price' => 220000000,
            'start_time' => Carbon::now()->subHour(),
            'end_time' => Carbon::now()->addDay(),
            'status' => 'active',
            'images' => ['https://images.unsplash.com/test.jpg'],
            'created_by' => $this->admin->id,
        ]);

        $legitBid = Bid::create([
            'auction_id' => $auction->id,
            'user_id' => $this->user->id,
            'amount' => 210000000,
            'status' => 'valid',
        ]);

        $suspiciousUser = User::create([
            'name' => 'Akun Fiktif',
            'email' => 'fake@test.com',
            'password' => bcrypt('password'),
            'role' => 'user',
            'status' => 'active',
        ]);

        $suspiciousBid = Bid::create([
            'auction_id' => $auction->id,
            'user_id' => $suspiciousUser->id,
            'amount' => 220000000,
            'status' => 'valid',
        ]);

        // Disqualify suspicious bid
        $response = $this->actingAs($this->admin)->post(route('admin.bids.disqualify', $suspiciousBid->id), [
            'reason' => 'Akun penawar baru dibuat dan nominal tidak wajar (indikasi manipulasi harga).',
        ]);

        $response->assertSessionHas('success');
        $this->assertDatabaseHas('bids', [
            'id' => $suspiciousBid->id,
            'status' => 'disqualified',
        ]);

        // Price should revert to legit bid amount
        $auction->refresh();
        $this->assertEquals(210000000, $auction->current_price);

        // Restore bid
        $restoreResponse = $this->actingAs($this->admin)->post(route('admin.bids.restore', $suspiciousBid->id));
        $restoreResponse->assertSessionHas('success');
        $this->assertDatabaseHas('bids', [
            'id' => $suspiciousBid->id,
            'status' => 'valid',
        ]);
        $auction->refresh();
        $this->assertEquals(220000000, $auction->current_price);
    }

    public function test_admin_can_manually_designate_winner(): void
    {
        $auction = Auction::create([
            'title' => 'Tag Heuer Monaco',
            'slug' => 'tag-heuer-monaco',
            'category_id' => $this->category->id,
            'description' => 'Steve McQueen edition',
            'starting_price' => 50000000,
            'min_increment' => 2000000,
            'current_price' => 54000000,
            'start_time' => Carbon::now()->subHours(2),
            'end_time' => Carbon::now()->addDays(2),
            'status' => 'active',
            'images' => ['https://images.unsplash.com/test.jpg'],
            'created_by' => $this->admin->id,
        ]);

        $bid = Bid::create([
            'auction_id' => $auction->id,
            'user_id' => $this->user->id,
            'amount' => 54000000,
            'status' => 'valid',
        ]);

        $response = $this->actingAs($this->admin)->post(route('admin.bids.set-winner', $bid->id));
        $response->assertSessionHas('success');

        $auction->refresh();
        $this->assertEquals('ended', $auction->status);
        $this->assertEquals($this->user->id, $auction->winner_id);
    }

    public function test_automatic_auction_closure_via_artisan_command(): void
    {
        $expiredAuction = Auction::create([
            'title' => 'Cartier Santos',
            'slug' => 'cartier-santos',
            'category_id' => $this->category->id,
            'description' => 'Classic stainless steel',
            'starting_price' => 60000000,
            'min_increment' => 2000000,
            'current_price' => 64000000,
            'start_time' => Carbon::now()->subDays(2),
            'end_time' => Carbon::now()->subMinutes(10), // expired
            'status' => 'active',
            'images' => ['https://images.unsplash.com/test.jpg'],
            'created_by' => $this->admin->id,
        ]);

        Bid::create([
            'auction_id' => $expiredAuction->id,
            'user_id' => $this->user->id,
            'amount' => 64000000,
            'status' => 'valid',
        ]);

        $this->artisan('auctions:close-ended')->assertExitCode(0);

        $expiredAuction->refresh();
        $this->assertEquals('ended', $expiredAuction->status);
        $this->assertEquals($this->user->id, $expiredAuction->winner_id);
    }

    /**
     * Module 3: Validasi Pembayaran & Status Pengiriman
     */
    public function test_admin_can_verify_payment_and_release_shipping(): void
    {
        $auction = Auction::create([
            'title' => 'Breitling Navitimer',
            'slug' => 'breitling-navitimer',
            'category_id' => $this->category->id,
            'description' => 'Pilot chronograph',
            'starting_price' => 70000000,
            'min_increment' => 2000000,
            'current_price' => 74000000,
            'start_time' => Carbon::now()->subDays(2),
            'end_time' => Carbon::now()->subHour(),
            'status' => 'ended',
            'winner_id' => $this->user->id,
            'images' => ['https://images.unsplash.com/test.jpg'],
            'created_by' => $this->admin->id,
        ]);

        $payment = Payment::create([
            'auction_id' => $auction->id,
            'user_id' => $this->user->id,
            'amount' => 74000000,
            'proof_image' => 'https://images.unsplash.com/proof.jpg',
            'bank_name' => 'BCA',
            'account_name' => 'Kolektor User',
            'status' => 'pending',
            'shipping_status' => 'pending',
        ]);

        // Step 1: Admin verifies payment
        $verifyResponse = $this->actingAs($this->admin)->post(route('admin.payments.verify', $payment->id));
        $verifyResponse->assertSessionHas('success');

        $payment->refresh();
        $auction->refresh();
        $this->assertEquals('verified', $payment->status);
        $this->assertEquals('settled', $auction->status);

        // Step 2: Admin releases shipment
        $shippingResponse = $this->actingAs($this->admin)->post(route('admin.payments.shipping', $payment->id), [
            'courier_name' => 'JNE',
            'tracking_number' => 'JNE991823746',
            'shipping_notes' => 'Asuransi penuh & packing kayu',
        ]);

        $shippingResponse->assertSessionHas('success');
        $payment->refresh();
        $this->assertEquals('shipped', $payment->shipping_status);
        $this->assertEquals('JNE', $payment->courier_name);
        $this->assertEquals('JNE991823746', $payment->tracking_number);
        $this->assertNotNull($payment->shipped_at);
    }

    /**
     * Module 4: Manajemen Pengguna & Penanganan Bid and Run
     */
    public function test_admin_can_suspend_user_preventing_login_and_bidding(): void
    {
        $problemUser = User::create([
            'name' => 'Bid And Runner',
            'email' => 'runner@test.com',
            'password' => bcrypt('password'),
            'role' => 'user',
            'status' => 'active',
        ]);

        // Admin suspends the user
        $response = $this->actingAs($this->admin)->post(route('admin.users.toggle-status', $problemUser->id));
        $response->assertSessionHas('success');

        $problemUser->refresh();
        $this->assertEquals('suspended', $problemUser->status);

        // Suspended user cannot place bid
        $liveAuction = Auction::create([
            'title' => 'IWC Portugieser',
            'slug' => 'iwc-portugieser',
            'category_id' => $this->category->id,
            'description' => 'Automatic',
            'starting_price' => 80000000,
            'min_increment' => 2000000,
            'current_price' => 80000000,
            'start_time' => Carbon::now()->subHour(),
            'end_time' => Carbon::now()->addDay(),
            'status' => 'active',
            'images' => ['https://images.unsplash.com/test.jpg'],
            'created_by' => $this->admin->id,
        ]);

        $bidResponse = $this->actingAs($problemUser)->post(route('auctions.bid', $liveAuction->id), [
            'amount' => 82000000,
        ]);
        $bidResponse->assertSessionHas('error');

        // Suspended user cannot log in
        $this->post(route('logout'));
        $loginResponse = $this->post(route('login'), [
            'email' => 'runner@test.com',
            'password' => 'password',
        ]);
        $loginResponse->assertSessionHasErrors('email');
    }

    /**
     * Module 5: Pelaporan & Statistik Lelang
     */
    public function test_admin_can_view_reports_and_filter_sold_items(): void
    {
        $response = $this->actingAs($this->admin)->get(route('admin.reports.index', [
            'only_sold' => 1,
        ]));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Reports/Index')
            ->has('summary.conversion_rate')
            ->has('summary.total_bids')
            ->has('summary.avg_bids_per_auction')
            ->has('summary.total_gross_bidding')
            ->has('summary.total_verified_settlement')
        );
    }

    public function test_newly_created_active_auction_immediately_appears_in_live_marketplace(): void
    {
        // Simulate admin submitting local time (+7 hours ahead of UTC) with status 'active'
        $localStartTime = Carbon::now()->addHours(7)->format('Y-m-d\TH:i');
        $localEndTime = Carbon::now()->addHours(7)->addMinutes(15)->format('Y-m-d\TH:i');

        $response = $this->actingAs($this->admin)->post(route('admin.auctions.store'), [
            'title' => 'Kamera Leica M6 Titanium Live Test',
            'category_id' => $this->category->id,
            'description' => 'Kamera analog kondisi mint siap lelang live.',
            'starting_price' => 45000000,
            'min_increment' => 1000000,
            'start_time' => $localStartTime,
            'end_time' => $localEndTime,
            'status' => 'active',
        ]);

        $response->assertRedirect(route('admin.auctions.index'));

        $auction = Auction::where('title', 'Kamera Leica M6 Titanium Live Test')->firstOrFail();
        $this->assertTrue($auction->isLive());

        // Verify it immediately appears on the main marketplace (/) and public catalog (/auctions)
        $homeResponse = $this->actingAs($this->user)->get(route('home'));
        $homeResponse->assertOk();
        $homeResponse->assertInertia(fn ($page) => $page
            ->component('Landing')
            ->has('liveAuctions', 1)
            ->where('liveAuctions.0.title', 'Kamera Leica M6 Titanium Live Test')
        );
    }

    public function test_uploaded_auction_and_payment_images_are_compressed_to_webp(): void
    {
        Storage::fake('public');

        $largePng = UploadedFile::fake()->image('highres-photo.png', 1800, 1400);

        $this->actingAs($this->admin)->post(route('admin.auctions.store'), [
            'title' => 'Lensa Carl Zeiss Planar',
            'category_id' => $this->category->id,
            'description' => 'Lensa prima tajam.',
            'starting_price' => 12000000,
            'min_increment' => 500000,
            'start_time' => Carbon::now()->toISOString(),
            'end_time' => Carbon::now()->addDay()->toISOString(),
            'status' => 'active',
            'image_files' => [$largePng],
        ]);

        $auction = Auction::where('title', 'Lensa Carl Zeiss Planar')->firstOrFail();
        $this->assertNotEmpty($auction->images);
        $this->assertStringEndsWith('.webp', $auction->images[0]);

        // Simulate user winning and uploading payment proof PNG
        $auction->update([
            'status' => 'ended',
            'winner_id' => $this->user->id,
        ]);

        $receiptPng = UploadedFile::fake()->image('bukti-transfer.png', 1600, 1200);
        $this->actingAs($this->user)->post(route('user.payment.submit', $auction->id), [
            'proof_image' => $receiptPng,
            'bank_name' => 'BCA',
            'account_name' => 'Kolektor User',
            'account_number' => '1234567890',
        ]);

        $payment = Payment::where('auction_id', $auction->id)->firstOrFail();
        $this->assertStringEndsWith('.webp', $payment->proof_image);
    }

    public function test_bidder_submits_winner_verification_form_and_admin_approves_before_payment(): void
    {
        $auction = Auction::create([
            'title' => 'Grand Seiko Snowflake',
            'slug' => 'grand-seiko-snowflake',
            'category_id' => $this->category->id,
            'description' => 'Spring Drive Titanium.',
            'starting_price' => 50000000,
            'min_increment' => 1000000,
            'current_price' => 52000000,
            'start_time' => Carbon::now()->subDays(2),
            'end_time' => Carbon::now()->subHour(),
            'status' => 'ended',
            'winner_id' => $this->user->id,
            'images' => ['https://images.unsplash.com/test.jpg'],
            'created_by' => $this->admin->id,
        ]);

        $winningBid = Bid::create([
            'auction_id' => $auction->id,
            'user_id' => $this->user->id,
            'amount' => 52000000,
            'status' => 'valid',
        ]);

        // Step 1: Bidder submits verification form via pop-up on MyWins
        $submitFormResponse = $this->actingAs($this->user)->post(route('user.verification.submit', $auction->id), [
            'full_name' => 'Budi Santoso Kolektor',
            'phone' => '081234567899',
            'address' => 'Jl. Jenderal Sudirman Kav. 52-53, Senayan, Kebayoran Baru, Jakarta Selatan',
            'postal_code' => '12190',
            'address_detail' => 'Apartemen Sudirman Tower A Lantai 12 Unit 1208',
            'notes' => 'Titip di resepsionis lobi utama jika sedang rapat.',
        ]);

        $submitFormResponse->assertSessionHas('success');

        $auction->refresh();
        $this->assertEquals('pending', $auction->winner_verification_status);
        $this->assertEquals('Budi Santoso Kolektor', $auction->winner_full_name);
        $this->assertEquals('081234567899', $auction->winner_phone);
        $this->assertEquals('12190', $auction->winner_postal_code);
        $this->assertEquals('Apartemen Sudirman Tower A Lantai 12 Unit 1208', $auction->winner_address_detail);

        // Step 2: Admin checks and approves bidder verification form on Verifikasi Penawaran
        $approveResponse = $this->actingAs($this->admin)->post(route('admin.bids.verify-bidder', $winningBid->id), [
            'action' => 'approve',
            'note' => 'Data identitas, nomor telepon aktif, dan alamat apartemen telah diverifikasi.',
        ]);

        $approveResponse->assertSessionHas('success');

        $auction->refresh();
        $this->assertEquals('approved', $auction->winner_verification_status);
        $this->assertNotNull($auction->winner_verified_at);

        // Step 3: Verify notification was sent to bidder to proceed to payment
        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->user->id,
            'title' => 'Data Terverifikasi! Siap Lanjut ke Pembayaran',
        ]);
    }
}
