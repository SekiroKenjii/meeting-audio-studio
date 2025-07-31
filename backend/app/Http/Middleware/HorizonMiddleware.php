<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class HorizonMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // In development, allow all access
        if (app()->environment('local', 'testing')) {
            return $next($request);
        }

        // In production, you might want to add authentication
        // For now, we'll allow access but you should customize this
        return $next($request);
    }
}
