<?php

namespace Database\Seeders;

use App\Models\Auction;
use App\Models\Category;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Seed Admin Account only (User accounts must be registered manually)
        $this->call(AdminSeeder::class);
        $admin = User::where('email', 'admin@mybidder.id')->first();

        // 2. Seed Auction Categories
        $categoriesData = [
            [
                'name' => 'Koleksi & Barang Antik',
                'slug' => 'koleksi-barang-antik',
                'description' => 'Jam tangan vintage, koin kuno, dan barang peninggalan bernilai tinggi.',
                'icon' => '💎',
            ],
            [
                'name' => 'Elektronik & Gadget Rare',
                'slug' => 'elektronik-gadget-rare',
                'description' => 'Konsol edisi terbatas, gadget retro, dan hardware langka.',
                'icon' => '💻',
            ],
            [
                'name' => 'Sneakers & Streetwear',
                'slug' => 'sneakers-streetwear',
                'description' => 'Sneakers collector item, jaket vintage, dan apparel langka.',
                'icon' => '👟',
            ],
            [
                'name' => 'Otomotif & Klasik',
                'slug' => 'otomotif-klasik',
                'description' => 'Kendaraan motor klasik, vespa antik, dan part orisinal langka.',
                'icon' => '🚗',
            ],
            [
                'name' => 'Seni & Karya Lukis',
                'slug' => 'seni-karya-lukis',
                'description' => 'Lukisan maestro, patung pahat, dan karya seni eksklusif.',
                'icon' => '🎨',
            ],
        ];

        $categories = [];
        foreach ($categoriesData as $cat) {
            $categories[$cat['slug']] = Category::firstOrCreate(['slug' => $cat['slug']], $cat);
        }

        // 3. Seed Initial Marketplace Auctions (Managed by Admin)
        $now = Carbon::now();

        Auction::firstOrCreate(
            ['slug' => 'rolex-submariner-vintage-1982-original'],
            [
                'title' => 'Rolex Submariner Vintage 1982 Ref 16800 Original Box & Paper',
                'category_id' => $categories['koleksi-barang-antik']->id,
                'description' => 'Rolex Submariner tahun 1982 kondisi sangat mulus (mint condition). Lengkap dengan box asli, sertifikat paper garansi orisinal, serta bezel spider dial alami yang sangat dicari kolektor horologi dunia.',
                'starting_price' => 85000000,
                'min_increment' => 1000000,
                'current_price' => 85000000,
                'buy_now_price' => 120000000,
                'start_time' => $now->copy()->subHours(2),
                'end_time' => $now->copy()->addDays(3),
                'status' => 'active',
                'images' => [
                    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80',
                ],
                'created_by' => $admin->id,
            ]
        );

        Auction::firstOrCreate(
            ['slug' => 'playstation-5-pro-30th-anniversary-limited-edition'],
            [
                'title' => 'Sony PlayStation 5 Pro 30th Anniversary Limited Edition No. 0421/12300',
                'category_id' => $categories['elektronik-gadget-rare']->id,
                'description' => 'Koleksi edisi ulang tahun ke-30 PlayStation. Unit baru tersegel (BNIB). Nomor seri tercetak 0421 dari 12.300 unit di seluruh dunia. Dilengkapi DualSense Edge retro dan aksesoris commemorative.',
                'starting_price' => 18000000,
                'min_increment' => 500000,
                'current_price' => 18000000,
                'buy_now_price' => 30000000,
                'start_time' => $now->copy()->subHours(1),
                'end_time' => $now->copy()->addHours(18),
                'status' => 'active',
                'images' => [
                    'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80',
                ],
                'created_by' => $admin->id,
            ]
        );

        Auction::firstOrCreate(
            ['slug' => 'air-jordan-1-high-chicago-1985-collector-grade'],
            [
                'title' => 'Nike Air Jordan 1 High OG Chicago 1985 Original Release Size 9.5US',
                'category_id' => $categories['sneakers-streetwear']->id,
                'description' => 'Sepatu bersejarah basket NBA rilisan perdana tahun 1985. Kulit asli berpatina mulus, kerah busa lembut terawat, sol orisinal tanpa penggantian, tersimpan dalam lemari beriklim stabil (climate controlled).',
                'starting_price' => 25000000,
                'min_increment' => 500000,
                'current_price' => 25000000,
                'buy_now_price' => 45000000,
                'start_time' => $now->copy()->subHours(3),
                'end_time' => $now->copy()->addHours(8),
                'status' => 'active',
                'images' => [
                    'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1597045566677-8cf032ed6634?auto=format&fit=crop&w=800&q=80',
                ],
                'created_by' => $admin->id,
            ]
        );

        Auction::firstOrCreate(
            ['slug' => 'vespa-super-150-vbc-1966-restorasi-sempurna'],
            [
                'title' => 'Piaggio Vespa Super 150 VBC1T 1966 Restorasi Klasik Orisinal',
                'category_id' => $categories['otomotif-klasik']->id,
                'description' => 'Vespa Super tahun 1966 dengan nomor rangka dan mesin akur tembus surat BPKB/STNK hidup. Cat Grigio Ametista orisinal pabrik Italia, lampu depan Siem ori, karburator Dellorto baru stok lama.',
                'starting_price' => 32000000,
                'min_increment' => 1000000,
                'current_price' => 32000000,
                'buy_now_price' => 50000000,
                'start_time' => $now->copy()->subHours(4),
                'end_time' => $now->copy()->addDays(2),
                'status' => 'active',
                'images' => [
                    'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80',
                ],
                'created_by' => $admin->id,
            ]
        );
    }
}
