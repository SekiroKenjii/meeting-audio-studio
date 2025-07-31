<?php

use App\Exceptions\GlobalExceptionHandler;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Add debug middleware to API routes
        $middleware->api(append: [
            \App\Http\Middleware\DebugMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Register our custom exception handler methods
        $handler = new GlobalExceptionHandler(app());

        // Override the render method for custom API responses
        $exceptions->render(fn (Throwable $e, \Illuminate\Http\Request $request) => $handler->render($request, $e));

        // Override the report method for custom logging
        $exceptions->report(fn (Throwable $e) => $handler->report($e));
    })->create();
