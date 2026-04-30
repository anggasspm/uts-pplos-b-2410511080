<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Models\TicketCategory;
use App\Models\TicketValidation;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TicketController extends Controller
{
    // GET /api/tickets?page=1&per_page=10
    // List tiket milik user yang sedang login
    public function index(Request $request)
    {
        $userId  = $request->input('auth_user.sub');
        $perPage = min((int) $request->query('per_page', 10), 100);
        $page    = max((int) $request->query('page', 1), 1);

        $paginator = Ticket::with('ticketCategory.event')
            ->where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'data' => $paginator->items(),
            'pagination' => [
                'total'        => $paginator->total(),
                'per_page'     => $paginator->perPage(),
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
            ],
        ]);
    }

    // POST /api/tickets — dipanggil oleh payment-service (inter-service)
    // Setelah pembayaran berhasil, payment-service request ini untuk generate tiket
    public function store(Request $request)
    {
        $validated = $request->validate([
            'ticket_category_id' => 'required|uuid|exists:ticket_categories,id',
            'order_id'           => 'required|string',
            'user_id'            => 'required|string',
            'quantity'           => 'required|integer|min:1|max:10',
        ]);

        $category = TicketCategory::find($validated['ticket_category_id']);
        if ($category->availableQuota() < $validated['quantity']) {
            return response()->json(['message' => 'Kuota tiket tidak mencukupi'], 409);
        }

        $tickets = [];
        for ($i = 0; $i < $validated['quantity']; $i++) {
            $qrCode = strtoupper(Str::random(6)) . '-' . now()->format('ymd') . '-' . Str::random(4);
            $tickets[] = Ticket::create([
                'ticket_category_id' => $validated['ticket_category_id'],
                'order_id'           => $validated['order_id'],
                'user_id'            => $validated['user_id'],
                'qr_code'            => $qrCode,
                'status'             => 'active',
            ]);
        }

        // Update sold count
        $category->increment('sold', $validated['quantity']);

        return response()->json([
            'message' => 'Tiket berhasil dibuat',
            'data'    => $tickets,
        ], 201);
    }

    // POST /api/tickets/validate-qr — validasi tiket di pintu masuk
    public function validateQr(Request $request)
    {
        $validated = $request->validate([
            'qr_code'       => 'required|string',
            'gate'          => 'nullable|string|max:50',
            'validated_by'  => 'nullable|string|max:100',
        ]);

        $ticket = Ticket::where('qr_code', $validated['qr_code'])->first();

        if (!$ticket) {
            return response()->json([
                'result'  => 'invalid',
                'message' => 'QR Code tidak ditemukan',
            ], 404);
        }

        if ($ticket->status === 'used') {
            TicketValidation::create([
                'ticket_id'    => $ticket->id,
                'validated_by' => $validated['validated_by'] ?? null,
                'result'       => 'already_used',
                'gate'         => $validated['gate'] ?? null,
            ]);
            return response()->json([
                'result'  => 'already_used',
                'message' => 'Tiket sudah digunakan pada ' . $ticket->used_at,
            ], 409);
        }

        // Tandai tiket sudah dipakai
        $ticket->update(['status' => 'used', 'used_at' => now()]);

        TicketValidation::create([
            'ticket_id'    => $ticket->id,
            'validated_by' => $validated['validated_by'] ?? null,
            'result'       => 'success',
            'gate'         => $validated['gate'] ?? null,
        ]);

        return response()->json([
            'result'  => 'success',
            'message' => 'Tiket valid, akses diberikan',
            'data'    => $ticket->load('ticketCategory.event'),
        ]);
    }
}