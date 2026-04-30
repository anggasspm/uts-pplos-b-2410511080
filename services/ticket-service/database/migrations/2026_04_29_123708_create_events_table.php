<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 150);
            $table->text('description')->nullable();
            $table->string('location', 200);
            $table->dateTime('event_date');
            $table->enum('status', ['active', 'cancelled', 'completed'])->default('active');
            $table->string('banner_url')->nullable();
            $table->uuid('created_by'); // user_id dari auth-service
            $table->timestamps();

            $table->index('event_date');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};