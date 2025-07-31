<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Route;

class DocsController extends Controller
{
    /**
     * Get API documentation with auto-discovered routes
     */
    public function index(): JsonResponse
    {
        $discoveredRoutes = $this->getDiscoveredRoutes();
        $structuredEndpoints = $this->generateStructuredEndpoints($discoveredRoutes);

        return response()->json([
            'message' => 'Meeting Audio Studio API Documentation',
            'current_version' => config('app.api_version', 'v1'),
            'supported_versions' => config('app.supported_api_versions', ['v1']),
            'endpoints' => array_merge($structuredEndpoints, [
                'discovered_routes' => $discoveredRoutes,
                'meta' => [
                    'total_routes' => count($discoveredRoutes),
                    'generated_at' => now()->toISOString(),
                    'note' => 'This documentation is auto-generated from registered routes'
                ]
            ])
        ]);
    }

    /**
     * Get health check information
     */
    public function health(): JsonResponse
    {
        return response()->json([
            'status' => 'healthy',
            'service' => 'meeting-audio-studio-api',
            'timestamp' => now()->toISOString(),
            'version' => config('app.api_version', 'v1'),
            'environment' => config('app.env'),
            'debug_mode' => config('app.debug')
        ]);
    }

    /**
     * Get auto-discovered API routes
     */
    private function getDiscoveredRoutes(): array
    {
        return collect(Route::getRoutes())
            ->filter(function ($route) {
                // Filter only API routes and exclude docs/health
                return str_starts_with($route->uri(), 'api/v') &&
                    ! in_array($route->uri(), ['api/docs', 'api/health']);
            })
            ->map(function ($route) {
                return [
                    'method' => implode('|', array_filter($route->methods(), fn ($method) => $method !== 'HEAD')),
                    'uri' => '/'.$route->uri(),
                    'name' => $route->getName(),
                    'controller' => $this->getControllerName($route->getActionName()),
                    'middleware' => $route->middleware()
                ];
            })
            ->sortBy('uri')
            ->values()
            ->toArray();
    }

    /**
     * Generate structured endpoint documentation from discovered routes
     */
    private function generateStructuredEndpoints(array $discoveredRoutes): array
    {
        $structured = [];

        foreach ($discoveredRoutes as $route) {
            $uri = $route['uri'];
            $method = $route['method'];

            // Extract API version and resource from URI
            if (preg_match('#^/api/(?<version>v\d+)/(?<resource>[^/]+)(?<path>.*)$#', $uri, $matches)) {
                $version = $matches['version'];
                $resource = $matches['resource'];
                $path = $matches['path'];

                // Initialize version and resource if not exists
                if (! isset($structured[$version])) {
                    $structured[$version] = [
                        'base_url' => "/api/{$version}",
                        'resources' => []
                    ];
                }

                if (! isset($structured[$version]['resources'][$resource])) {
                    $structured[$version]['resources'][$resource] = [];
                }

                // Generate operation name based on method and path
                $operation = $this->generateOperationName($method, $path);
                $structured[$version]['resources'][$resource][$operation] = "{$method} {$uri}";
            }
        }

        // Add metadata for backwards compatibility
        if (! empty($structured)) {
            $structured['meta'] = [
                'generation_method' => 'auto-discovered',
                'note' => 'Structured endpoints generated from actual registered routes'
            ];
        }

        return $structured;
    }

    /**
     * Generate operation name from HTTP method and path
     */
    private function generateOperationName(string $method, string $path): string
    {
        $method = strtoupper($method);

        // Root resource operations
        if (empty($path) || $path === '/') {
            return $this->getBasicOperation($method);
        }

        // ID-based operations
        if (preg_match('#^/\{[^}]+\}$#', $path)) {
            return $this->getResourceOperation($method);
        }

        // Sub-resource operations
        if (preg_match('#^/\{[^}]+\}/([^/]+)#', $path, $matches)) {
            return $matches[1];
        }

        // Configuration and other endpoints
        if (preg_match('#^/([^/]+)#', $path, $matches)) {
            return $this->getSpecialOperation($matches[1]);
        }

        return 'unknown';
    }    /**
         * Get basic operation name for root resource
         */
    private function getBasicOperation(string $method): string
    {
        return match ($method) {
            'GET' => 'list',
            'POST' => 'create',
            default => strtolower($method)
        };
    }

    /**
     * Get resource operation name for ID-based endpoints
     */
    private function getResourceOperation(string $method): string
    {
        return match ($method) {
            'GET' => 'show',
            'PUT', 'PATCH' => 'update',
            'DELETE' => 'delete',
            default => strtolower($method)
        };
    }

    /**
     * Get special operation name for specific endpoints
     */
    private function getSpecialOperation(string $operation): string
    {
        // Handle special cases
        $specialCases = ['config', 'backup', 'download', 'stream'];

        foreach ($specialCases as $case) {
            if (str_contains($operation, $case)) {
                return str_replace('-', '_', $operation);
            }
        }

        return str_replace('-', '_', $operation);
    }    /**
         * Extract clean controller name from action
         */
    private function getControllerName(string $action): string
    {
        if (str_contains($action, '@')) {
            [$controller, $method] = explode('@', $action);
            return class_basename($controller).'@'.$method;
        }

        return $action;
    }
}
