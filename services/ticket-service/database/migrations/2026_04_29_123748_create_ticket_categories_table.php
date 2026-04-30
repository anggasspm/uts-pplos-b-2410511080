<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ticket_categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('event_id');
            $table->string('name', 100);        // VIP, Regular, Student
            $table->text('description')->nullable();
            $table->decimal('price', 12, 2);
            $table->integer('quota');
            $table->integer('sold')->default(0);
            $table->timestamps();

            $table->foreign('event_id')
                  ->references('id')->on('events')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_categories');
    }
};