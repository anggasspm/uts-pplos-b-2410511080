<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class EventController extends Controller
{
    // GET /api/events?page=1&per_page=10&status=active&search=konser
    public function index(Request $request)
    {
        $perPage = min((int) $request->query('per_page', 10), 100);
        $page    = max((int) $request->query('page', 1), 1);

        $query = Event::with('ticketCategories');

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }
        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->query('search') . '%');
        }
        if ($request->filled('date_from')) {
            $query->where('event_date', '>=', $request->query('date_from'));
        }

        $paginator = $query->orderBy('event_date', 'asc')->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'data'       => $paginator->items(),
            'pagination' => [
                'total'        => $paginator->total(),
                'per_page'     => $paginator->perPage(),
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
            ],
        ]);
    }

    // GET /api/events/{id}
    public function show($id)
    {
        $event = Event::with('ticketCategories')->find($id);
        if (!$event) {
            return response()->json(['message' => 'Event tidak ditemukan'], 404);
        }
        return response()->json(['data' => $event]);
    }

    // POST /api/events
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:150',
            'description' => 'nullable|string',
            'location'    => 'required|string|max:200',
            'event_date'  => 'required|date|after:now',
            'banner_url'  => 'nullable|url',
        ]);

        $validated['created_by'] = $request->input('auth_user.sub');

        $event = Event::create($validated);

        return response()->json(['message' => 'Event berhasil dibuat', 'data' => $event], 201);
    }

    // PUT /api/events/{id}
    public function update(Request $request, $id)
    {
        $event = Event::find($id);
        if (!$event) {
            return response()->json(['message' => 'Event tidak ditemukan'], 404);
        }

        $validated = $request->validate([
            'name'        => 'sometimes|string|max:150',
            'description' => 'nullable|string',
            'location'    => 'sometimes|string|max:200',
            'event_date'  => 'sometimes|date|after:now',
            'status'      => 'sometimes|in:active,cancelled,completed',
            'banner_url'  => 'nullable|url',
        ]);

        $event->update($validated);

        return response()->json(['message' => 'Event berhasil diperbarui', 'data' => $event]);
    }

    // DELETE /api/events/{id}
    public function destroy($id)
    {
        $event = Event::find($id);
        if (!$event) {
            return response()->json(['message' => 'Event tidak ditemukan'], 404);
        }

        $event->delete();

        return response()->json(null, 204);
    }
}