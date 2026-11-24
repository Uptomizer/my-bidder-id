<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@mybidder.id'],
            [
                'name' => 'Administrator MyBidder',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'phone' => '081234567890',
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );
    }
}