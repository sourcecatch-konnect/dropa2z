<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['rider', 'driver'] as $role) {
            $column = $role . '_fcm_token';
            if (!Schema::hasColumn('users', $column)) {
                Schema::table('users', fn (Blueprint $table) => $table->string($column, 1024)->nullable());
            }
            $ids = DB::table('model_has_roles')->join('roles', 'roles.id', '=', 'model_has_roles.role_id')
                ->where('roles.name', $role)->where('model_type', 'App\\Models\\User')->select('model_id');
            DB::table('users')->whereIn('id', $ids)->whereNull($column)
                ->update([$column => DB::raw('fcm_token')]);
        }
    }

    public function down(): void
    {
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn(['rider_fcm_token', 'driver_fcm_token']));
    }
};
