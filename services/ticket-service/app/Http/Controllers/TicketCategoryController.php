<?php

namespace App\Http\Controllers;

use App\Models\TicketCategory;
use Illuminate\Http\Request;

class TicketCategoryController extends Controller
{
    public function store(Request $request, $eventId)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:100',
            'description' => 'nullable|string',
            'price'       => 'required|numeric|min:0',
            'quota'       => 'required|integer|min:1',
        ]);

        $validated['event_id'] = $eventId;

        $category = TicketCategory::create($validated);

        return response()->json([
            'message' => 'Kategori tiket berhasil dibuat',
            'data'    => $category,
        ], 201);
    }

    public function index($eventId)
    {
        $categories = TicketCategory::where('event_id', $eventId)->get();
        return response()->json(['data' => $categories]);
    }
}