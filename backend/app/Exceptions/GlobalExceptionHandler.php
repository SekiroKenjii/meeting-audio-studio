<?php

namespace App\Exceptions;

use App\Constants\Messages;
use App\Constants\ResponseCodes;
use App\Constants\ResponseKeys;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;

class GlobalExceptionHandler extends ExceptionHandler
{
    /**
     * API routes pattern for consistent checking
     */
    private const string API_ROUTES_PATTERN = 'api/*';

    /**
     * The list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            // Log all exceptions with context
            if ($this->shouldReport($e)) {
                Log::error('Exception caught by global handler', [
                    'exception' => get_class($e),
                    'message' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => $e->getTraceAsString(),
                    'url' => request()->fullUrl(),
                    'method' => request()->method(),
                    'ip' => request()->ip(),
                    'user_agent' => request()->userAgent(),
                ]);
            }
        });
    }

    /**
     * Handle API requests with consistent JSON responses
     */
    public function render($request, Throwable $e): Response|JsonResponse|SymfonyResponse
    {
        // Handle API requests with consistent JSON responses
        if ($request->is(self::API_ROUTES_PATTERN) || $request->expectsJson()) {
            return $this->handleApiException($request, $e);
        }

        return parent::render($request, $e);
    }

    /**
     * Handle exceptions for API requests with consistent JSON structure
     */
    protected function handleApiException(Request $request, Throwable $e): JsonResponse
    {
        $response = $this->prepareApiErrorResponse($e);

        // Add debug information if in debug mode
        if (config('app.debug')) {
            $response[ResponseKeys::DEBUG_KEY] = [
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => explode("\n", $e->getTraceAsString()),
            ];

            $response[ResponseKeys::REQUEST_KEY] = [
                'method' => $request->method(),
                'url' => $request->fullUrl(),
                'headers' => $request->headers->all(),
                'params' => $request->all(),
            ];
        }

        return response()->json($response, $response[ResponseKeys::STATUS_CODE_KEY]);
    }

    /**
     * Prepare standardized API error response based on exception type
     */
    protected function prepareApiErrorResponse(Throwable $e): array
    {
        // Handle specific exception types
        return match (true) {
            $e instanceof ValidationException => [
                ResponseKeys::SUCCESS_KEY => false,
                ResponseKeys::MESSAGE_KEY => Messages::VALIDATION_FAILED,
                ResponseKeys::ERRORS_KEY => $e->errors(),
                ResponseKeys::STATUS_CODE_KEY => ResponseCodes::VALIDATION_ERROR,
            ],

            $e instanceof ModelNotFoundException => [
                ResponseKeys::SUCCESS_KEY => false,
                ResponseKeys::MESSAGE_KEY => Messages::RESOURCE_NOT_FOUND,
                ResponseKeys::STATUS_CODE_KEY => ResponseCodes::NOT_FOUND,
            ],

            $e instanceof NotFoundHttpException => [
                ResponseKeys::SUCCESS_KEY => false,
                ResponseKeys::MESSAGE_KEY => Messages::ENDPOINT_NOT_FOUND,
                ResponseKeys::STATUS_CODE_KEY => ResponseCodes::NOT_FOUND,
            ],

            $e instanceof MethodNotAllowedHttpException => [
                ResponseKeys::SUCCESS_KEY => false,
                ResponseKeys::MESSAGE_KEY => Messages::METHOD_NOT_ALLOWED,
                ResponseKeys::ALLOWED_METHODS_KEY => $e->getHeaders()['Allow'] ?? null,
                ResponseKeys::STATUS_CODE_KEY => ResponseCodes::METHOD_NOT_ALLOWED,
            ],

            $e instanceof AuthenticationException => [
                ResponseKeys::SUCCESS_KEY => false,
                ResponseKeys::MESSAGE_KEY => Messages::AUTHENTICATION_REQUIRED,
                ResponseKeys::STATUS_CODE_KEY => ResponseCodes::UNAUTHORIZED,
            ],

            $e instanceof AuthorizationException => [
                ResponseKeys::SUCCESS_KEY => false,
                ResponseKeys::MESSAGE_KEY => Messages::ACCESS_FORBIDDEN,
                ResponseKeys::STATUS_CODE_KEY => ResponseCodes::FORBIDDEN,
            ],

            $e instanceof AudioProcessingException => [
                ResponseKeys::SUCCESS_KEY => false,
                ResponseKeys::MESSAGE_KEY => Messages::AUDIO_PROCESSING_FAILED,
                ResponseKeys::ERROR_KEY => $e->getMessage(),
                ResponseKeys::STATUS_CODE_KEY => ResponseCodes::UNPROCESSABLE_ENTITY,
            ],

            $e instanceof HttpException => [
                ResponseKeys::SUCCESS_KEY => false,
                ResponseKeys::MESSAGE_KEY => $e->getMessage() ?: Messages::HTTP_ERROR,
                ResponseKeys::STATUS_CODE_KEY => $e->getStatusCode(),
            ],

            default => [
                ResponseKeys::SUCCESS_KEY => false,
                ResponseKeys::MESSAGE_KEY => config('app.debug') ? $e->getMessage() : Messages::INTERNAL_SERVER_ERROR,
                ResponseKeys::STATUS_CODE_KEY => ResponseCodes::INTERNAL_SERVER_ERROR,
            ],
        };
    }

    /**
     * Convert an authentication exception into a response.
     */
    protected function unauthenticated($request, AuthenticationException $exception): JsonResponse
    {
        if ($request->is(self::API_ROUTES_PATTERN) || $request->expectsJson()) {
            return response()->json([
                ResponseKeys::SUCCESS_KEY => false,
                ResponseKeys::MESSAGE_KEY => Messages::AUTHENTICATION_REQUIRED,
            ], ResponseCodes::UNAUTHORIZED);
        }

        return response()->json([
            ResponseKeys::SUCCESS_KEY => false,
            ResponseKeys::MESSAGE_KEY => Messages::AUTHENTICATION_REQUIRED,
        ], ResponseCodes::UNAUTHORIZED);
    }

    /**
     * Convert a validation exception into a JSON response.
     */
    protected function invalidJson($request, ValidationException $exception): JsonResponse
    {
        return response()->json([
            ResponseKeys::SUCCESS_KEY => false,
            ResponseKeys::MESSAGE_KEY => Messages::VALIDATION_FAILED,
            ResponseKeys::ERRORS_KEY => $exception->errors(),
        ], ResponseCodes::VALIDATION_ERROR);
    }

    /**
     * Determine if the exception should be reported.
     */
    public function shouldReport(Throwable $e): bool
    {
        // Define exceptions that should not be reported
        $skipReporting = [
            ValidationException::class,
            AuthenticationException::class,
            AuthorizationException::class,
        ];

        // Don't report if exception is in skip list
        foreach ($skipReporting as $exceptionClass) {
            if ($e instanceof $exceptionClass) {
                return false;
            }
        }

        // Don't report 404 exceptions for API routes to reduce noise
        if ($e instanceof NotFoundHttpException && request()->is(self::API_ROUTES_PATTERN)) {
            return false;
        }

        return parent::shouldReport($e);
    }
}
