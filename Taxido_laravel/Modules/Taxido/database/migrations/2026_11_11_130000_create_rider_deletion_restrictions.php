<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('rider_deletion_restrictions',function(Blueprint $table){
            $table->id();$table->char('identity_hash',64)->unique();$table->string('identity_type',10);
            $table->unsignedInteger('deletion_count')->default(0);$table->json('related_hashes')->nullable();
            $table->timestamp('blocked_at')->nullable();$table->timestamp('unblocked_at')->nullable();
            $table->unsignedBigInteger('unblocked_by')->nullable();$table->timestamps();
        });
    }
    public function down(): void {Schema::dropIfExists('rider_deletion_restrictions');}
};
