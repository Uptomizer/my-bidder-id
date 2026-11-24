<?php

use App\Models\Auction;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('auctions:close-ended', function () {
    $this->info('Memeriksa lelang aktif yang telah melewati batas waktu...');
    $closedCount = Auction::closeEndedAuctions();
    $this->info("Berhasil menutup {$closedCount} sesi lelang dan menetapkan pemenang.");
})->purpose('Secara otomatis menutup lelang yang habis masa berlakunya dan menetapkan pemenang');

Schedule::command('auctions:close-ended')->everyMinute();
