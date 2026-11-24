<?php

namespace Tests\Feature;

use App\Models\Auction;
use App\Models\Category;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryManagementTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $user;

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
            'name' => 'User Biasa',
            'email' => 'user@mybidder.id',
            'password' => bcrypt('password'),
            'role' => 'user',
            'status' => 'active',
        ]);
    }

    public function test_admin_can_view_category_management_page(): void
    {
        Category::create([
            'name' => 'Elektronik Antik',
            'slug' => 'elektronik-antik',
            'icon' => '📻',
        ]);

        $response = $this->actingAs($this->admin)->get(route('admin.categories.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Categories/Index')
            ->has('categories')
        );
    }

    public function test_admin_can_add_new_category(): void
    {
        $response = $this->actingAs($this->admin)->post(route('admin.categories.store'), [
            'name' => 'Kamera Analog Rare',
            'icon' => '📷',
            'description' => 'Koleksi kamera analog dan lensa manual langka',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('categories', [
            'name' => 'Kamera Analog Rare',
            'slug' => 'kamera-analog-rare',
            'icon' => '📷',
        ]);
    }

    public function test_admin_cannot_add_duplicate_category(): void
    {
        Category::create([
            'name' => 'Sneakers Limited',
            'slug' => 'sneakers-limited',
        ]);

        $response = $this->actingAs($this->admin)->post(route('admin.categories.store'), [
            'name' => 'Sneakers Limited',
        ]);

        $response->assertSessionHasErrors('name');
    }

    public function test_admin_can_delete_unused_category(): void
    {
        $category = Category::create([
            'name' => 'Kategori Sementara',
            'slug' => 'kategori-sementara',
        ]);

        $response = $this->actingAs($this->admin)->delete(route('admin.categories.destroy', $category->id));

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseMissing('categories', [
            'id' => $category->id,
        ]);
    }

    public function test_admin_cannot_delete_category_with_existing_auctions(): void
    {
        $category = Category::create([
            'name' => 'Koleksi Bernilai',
            'slug' => 'koleksi-bernilai',
        ]);

        Auction::create([
            'title' => 'Barang Antik Spesial',
            'slug' => 'barang-antik-spesial',
            'category_id' => $category->id,
            'description' => 'Deskripsi lelang',
            'starting_price' => 5000000,
            'min_increment' => 500000,
            'current_price' => 5000000,
            'start_time' => Carbon::now(),
            'end_time' => Carbon::now()->addDays(2),
            'status' => 'active',
            'created_by' => $this->admin->id,
            'images' => ['/storage/test.jpg'],
        ]);

        $response = $this->actingAs($this->admin)->delete(route('admin.categories.destroy', $category->id));

        $response->assertRedirect();
        $response->assertSessionHas('error');

        $this->assertDatabaseHas('categories', [
            'id' => $category->id,
        ]);
    }

    public function test_regular_user_cannot_access_category_management(): void
    {
        $response = $this->actingAs($this->user)->get(route('admin.categories.index'));
        $response->assertStatus(403);

        $response = $this->actingAs($this->user)->post(route('admin.categories.store'), [
            'name' => 'Test Kategori',
        ]);
        $response->assertStatus(403);
    }
}
