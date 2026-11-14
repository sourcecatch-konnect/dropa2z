<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('departments') && !DB::table('departments')->whereNull('deleted_at')->exists()) {
            DB::table('departments')->insert([
                'name' => 'General Support', 'slug' => 'general-support',
                'description' => 'Questions about Dropa2z bookings, deliveries and payments.',
                'status' => 1, 'system_reserve' => 1, 'imap_credentials' => json_encode([]),
                'created_at' => now(), 'updated_at' => now(),
            ]);
        }
        if (!Schema::hasTable('priorities') || DB::table('priorities')->whereNull('deleted_at')->exists()) {
            return;
        }
        // Restore the module's standard choices only when none exist; preserve Admin choices.
        foreach ([['High', 'high', 'danger', '30', 'minute', 180, 'minute'],
            ['Medium', 'medium', 'secondary', '2', 'hour', 3, 'hour'],
            ['Low', 'low', 'primary', '1', 'week', 1, 'week']] as $value) {
            if (DB::table('priorities')->where('slug', $value[1])->exists()) continue;
            DB::table('priorities')->insert([
                'name' => $value[0], 'slug' => $value[1], 'color' => $value[2],
                'response_in' => $value[3], 'response_value_in' => $value[4],
                'resolve_in' => $value[5], 'resolve_value_in' => $value[6],
                'status' => 1, 'system_reserve' => 1,
                'created_at' => now(), 'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        // Keep priority records that may now be referenced by support tickets.
    }
};
