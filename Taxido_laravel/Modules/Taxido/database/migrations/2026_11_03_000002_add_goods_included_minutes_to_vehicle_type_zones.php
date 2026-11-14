<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vehicle_type_zones', function (Blueprint $table) {
            $table->unsignedSmallInteger('goods_included_minutes')->default(0);
        });
    }

    public function down(): void
    {
        Schema::table('vehicle_type_zones', function (Blueprint $table) {
            $table->dropColumn('goods_included_minutes');
        });
    }
};
