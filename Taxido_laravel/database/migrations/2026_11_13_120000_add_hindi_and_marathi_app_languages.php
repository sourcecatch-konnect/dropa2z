<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Register the three launch languages. The mobile apps also contain an
     * English fallback so an unfinished server translation can never blank a
     * button or a screen during rollout.
     */
    public function up(): void
    {
        foreach ([
            ['name' => 'हिंदी', 'locale' => 'hi', 'app_locale' => 'hi_IN'],
            ['name' => 'मराठी', 'locale' => 'mr', 'app_locale' => 'mr_IN'],
        ] as $language) {
            DB::table('languages')->updateOrInsert(
                ['locale' => $language['locale']],
                [
                    'name' => $language['name'],
                    'app_locale' => $language['app_locale'],
                    'is_rtl' => 0,
                    'status' => 1,
                    'system_reserve' => 0,
                    'updated_at' => now(),
                    'created_at' => now(),
                ],
            );
        }
    }

    public function down(): void
    {
        DB::table('languages')->whereIn('locale', ['hi', 'mr'])->delete();
    }
};
