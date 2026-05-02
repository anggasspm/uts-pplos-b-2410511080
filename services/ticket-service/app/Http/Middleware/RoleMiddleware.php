<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles)
    {
        $authUser = $request->input('auth_user');
        $userRole = $authUser['role'] ?? 'user';

        if (!in_array($userRole, $roles)) {
            return response()->json([
                'message' => 'Akses ditolak. Role tidak sesuai.',
            ], 403);
        }

        return $next($request);
    }
}