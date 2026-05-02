<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ticket_categories', function (Blueprint $table) {
            $table->dropForeign(['event_id']);
            $table->foreign('event_id')->references('id')->on('events')->onDelete('cascade');
        });

        Schema::table('tickets', function (Blueprint $table) {
            $table->dropForeign(['ticket_category_id']);
            $table->foreign('ticket_category_id')->references('id')->on('ticket_categories')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('ticket_categories', function (Blueprint $table) {
            $table->dropForeign(['event_id']);
            $table->foreign('event_id')->references('id')->on('events');
        });

        Schema::table('tickets', function (Blueprint $table) {
            $table->dropForeign(['ticket_category_id']);
            $table->foreign('ticket_category_id')->references('id')->on('ticket_categories');
        });
    }
};