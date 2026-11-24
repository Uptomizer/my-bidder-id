<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('auctions', function (Blueprint $table) {
            $table->string('winner_verification_status')->default('unsubmitted')->after('winner_id'); // unsubmitted, pending, approved, rejected
            $table->string('winner_full_name')->nullable()->after('winner_verification_status');
            $table->string('winner_phone')->nullable()->after('winner_full_name');
            $table->text('winner_address')->nullable()->after('winner_phone');
            $table->string('winner_postal_code', 20)->nullable()->after('winner_address');
            $table->string('winner_address_detail')->nullable()->after('winner_postal_code');
            $table->text('winner_notes')->nullable()->after('winner_address_detail');
            $table->text('winner_verification_note')->nullable()->after('winner_notes');
            $table->timestamp('winner_form_submitted_at')->nullable()->after('winner_verification_note');
            $table->timestamp('winner_verified_at')->nullable()->after('winner_form_submitted_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('auctions', function (Blueprint $table) {
            $table->dropColumn([
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
            ]);
        });
    }
};
