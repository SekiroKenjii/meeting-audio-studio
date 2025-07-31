<?php

namespace App\Http\Responses;

use App\Constants\Messages;
use App\Constants\ResponseCodes;
use App\Constants\ResponseKeys;
use Illuminate\Http\JsonResponse;

/**
 * Standardized API response helper
 */
class ApiResponse
{
    /**
     * Create a successful response
     */
    public static function success(mixed $data = null, string $message = null, int $statusCode = ResponseCodes::SUCCESS): JsonResponse
    {
        $response = [
            ResponseKeys::SUCCESS_KEY => true,
        ];

        if ($message !== null) {
            $response[ResponseKeys::MESSAGE_KEY] = $message;
        }

        if ($data !== null) {
            $response[ResponseKeys::DATA_KEY] = $data;
        }

        return response()->json($response, $statusCode);
    }

    /**
     * Create an error response
     */
    public static function error(string $message, mixed $errors = null, int $statusCode = ResponseCodes::BAD_REQUEST): JsonResponse
    {
        $response = [
            ResponseKeys::SUCCESS_KEY => false,
            ResponseKeys::MESSAGE_KEY => $message,
        ];

        if ($errors !== null) {
            $response[ResponseKeys::ERRORS_KEY] = $errors;
        }

        return response()->json($response, $statusCode);
    }

    /**
     * Create a validation error response
     */
    public static function validationError(array $errors, string $message = Messages::VALIDATION_FAILED): JsonResponse
    {
        return self::error($message, $errors, ResponseCodes::VALIDATION_ERROR);
    }

    /**
     * Create a not found response
     */
    public static function notFound(string $message = Messages::RESOURCE_NOT_FOUND): JsonResponse
    {
        return self::error($message, null, ResponseCodes::NOT_FOUND);
    }

    /**
     * Create an unauthorized response
     */
    public static function unauthorized(string $message = Messages::AUTHENTICATION_REQUIRED): JsonResponse
    {
        return self::error($message, null, ResponseCodes::UNAUTHORIZED);
    }

    /**
     * Create a forbidden response
     */
    public static function forbidden(string $message = Messages::ACCESS_FORBIDDEN): JsonResponse
    {
        return self::error($message, null, ResponseCodes::FORBIDDEN);
    }

    /**
     * Create an internal server error response
     */
    public static function serverError(string $message = Messages::INTERNAL_SERVER_ERROR): JsonResponse
    {
        return self::error($message, null, ResponseCodes::INTERNAL_SERVER_ERROR);
    }

    /**
     * Create a created response (for resource creation)
     */
    public static function created(mixed $data = null, string $message = null): JsonResponse
    {
        return self::success($data, $message, ResponseCodes::CREATED);
    }

    /**
     * Create an accepted response (for async operations)
     */
    public static function accepted(mixed $data = null, string $message = null): JsonResponse
    {
        return self::success($data, $message, ResponseCodes::ACCEPTED);
    }

    /**
     * Create a response with debug information (only in debug mode)
     */
    public static function withDebug(JsonResponse $response, array $debugInfo): JsonResponse
    {
        if (config('app.debug')) {
            $data = $response->getData(true);
            $data[ResponseKeys::DEBUG_KEY] = $debugInfo;
            $response->setData($data);
        }

        return $response;
    }
}
