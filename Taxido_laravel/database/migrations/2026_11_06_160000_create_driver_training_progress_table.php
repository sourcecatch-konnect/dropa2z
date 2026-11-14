<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('driver_training_progress')) return;
        Schema::create('driver_training_progress', function (Blueprint $table) {
            $table->unsignedBigInteger('driver_id')->primary();
            $table->unsignedSmallInteger('version')->default(1);
            $table->boolean('is_required')->default(true);
            $table->unsignedTinyInteger('completed_steps')->default(0);
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
        // Existing drivers keep their current availability. Only new enrolments require training.
        $ids = DB::table('model_has_roles')->join('roles', 'roles.id', '=', 'model_has_roles.role_id')
            ->where('roles.name', 'driver')->distinct()->pluck('model_has_roles.model_id');
        foreach ($ids->chunk(500) as $chunk) {
            DB::table('driver_training_progress')->insertOrIgnore($chunk->map(fn ($id) => [
                'driver_id' => $id, 'version' => 1, 'is_required' => false, 'completed_steps' => 0,
                'created_at' => now(), 'updated_at' => now(),
            ])->all());
        }
    }
    public function down(): void { Schema::dropIfExists('driver_training_progress'); }
};
