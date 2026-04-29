<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tickets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('ticket_category_id');
            $table->uuid('order_id');           // dari payment-service
            $table->uuid('user_id');            // dari auth-service
            $table->string('qr_code', 255)->unique(); // kode unik untuk validasi
            $table->enum('status', ['active', 'used', 'cancelled'])->default('active');
            $table->dateTime('used_at')->nullable();
            $table->timestamps();

            $table->foreign('ticket_category_id')
                  ->references('id')->on('ticket_categories')
                  ->onDelete('restrict');

            $table->index('qr_code');
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};