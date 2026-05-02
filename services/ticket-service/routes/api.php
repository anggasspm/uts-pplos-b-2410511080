<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\EventController;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\TicketCategoryController;

// Health check
Route::get('/health', fn() => response()->json(['service' => 'ticket-service', 'status' => 'ok']));

// Public routes
Route::get('/events',      [EventController::class, 'index']);
Route::get('/events/{id}', [EventController::class, 'show']);
Route::get('/events/{eventId}/categories', [TicketCategoryController::class, 'index']);
Route::get('/categories/{id}', [TicketCategoryController::class, 'show']);

Route::middleware(['jwt', 'role:organizer,admin'])->group(function () {
    Route::post('/events',        [EventController::class, 'store']);
    Route::put('/events/{id}',    [EventController::class, 'update']);
    Route::delete('/events/{id}', [EventController::class, 'destroy']);
    Route::post('/events/{eventId}/categories', [TicketCategoryController::class, 'store']);
});

// Protected routes
Route::middleware('jwt')->group(function () {
    Route::get('/tickets', [TicketController::class, 'index']);
});


// Inter-service routes
Route::post('/tickets',             [TicketController::class, 'store']);
Route::post('/tickets/validate-qr', [TicketController::class, 'validateQr']);