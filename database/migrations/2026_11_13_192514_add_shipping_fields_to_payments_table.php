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
        Schema::table('payments', function (Blueprint $table) {
            $table->string('shipping_status')->default('pending')->after('status');
            $table->string('courier_name')->nullable()->after('shipping_status');
            $table->string('tracking_number')->nullable()->after('courier_name');
            $table->timestamp('shipped_at')->nullable()->after('tracking_number');
            $table->text('shipping_notes')->nullable()->after('shipped_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn([
                'shipping_status',
                'courier_name',
                'tracking_number',
                'shipped_at',
                'shipping_notes',
            ]);
        });
    }
};
