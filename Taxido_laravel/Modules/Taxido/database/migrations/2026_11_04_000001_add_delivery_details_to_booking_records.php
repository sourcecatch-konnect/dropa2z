<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        foreach (['ride_requests', 'rides'] as $tableName) {
            if (!Schema::hasColumn($tableName, 'delivery_details')) {
                Schema::table($tableName, fn (Blueprint $table) => $table->json('delivery_details')->nullable());
            }
        }
    }

    public function down(): void
    {
        foreach (['ride_requests', 'rides'] as $tableName) {
            if (Schema::hasColumn($tableName, 'delivery_details')) {
                Schema::table($tableName, fn (Blueprint $table) => $table->dropColumn('delivery_details'));
            }
        }
    }
};
