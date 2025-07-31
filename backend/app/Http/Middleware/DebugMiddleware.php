<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class DebugMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Only debug when APP_DEBUG is true
        if (! config('app.debug')) {
            return $next($request);
        }

        // Log the incoming request
        Log::info('API Request Debug', [
            'method' => $request->method(),
            'url' => $request->fullUrl(),
            'headers' => $request->headers->all(),
            'query_params' => $request->query->all(),
            'body_size' => strlen($request->getContent()),
            'content_type' => $request->header('Content-Type'),
            'origin' => $request->header('Origin'),
            'user_agent' => $request->header('User-Agent'),
            'ip' => $request->ip(),
            'files' => array_map(fn ($file) => [
                'name' => $file->getClientOriginalName(),
                'size' => $file->getSize(),
                'mime' => $file->getMimeType(),
            ], $request->allFiles()),
            'cors_preflight' => $request->isMethod('OPTIONS'),
            'access_control_request_method' => $request->header('Access-Control-Request-Method'),
            'access_control_request_headers' => $request->header('Access-Control-Request-Headers'),
        ]);

        try {
            $response = $next($request);

            // Log the response
            Log::info('API Response Debug', [
                'status_code' => $response->getStatusCode(),
                'headers' => $response->headers->all(),
                'content_length' => strlen($response->getContent()),
                'content_preview' => substr($response->getContent(), 0, 500),
            ]);

            return $response;

        } catch (\Exception $e) {
            // Log any exceptions
            Log::error('API Error Debug', [
                'exception' => get_class($e),
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            throw $e;
        }
    }
}
