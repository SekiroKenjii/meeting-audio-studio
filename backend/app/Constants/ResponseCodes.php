<?php

namespace App\Constants;

/**
 * HTTP response status codes and API response constants
 */
class ResponseCodes
{
    // Success Codes
    public const int SUCCESS  = 200;
    public const int CREATED  = 201;
    public const int ACCEPTED = 202;

    // Client Error Codes
    public const int BAD_REQUEST          = 400;
    public const int UNAUTHORIZED         = 401;
    public const int FORBIDDEN            = 403;
    public const int NOT_FOUND            = 404;
    public const int METHOD_NOT_ALLOWED   = 405;
    public const int VALIDATION_ERROR     = 422;
    public const int UNPROCESSABLE_ENTITY = 422;

    // Server Error Codes
    public const int INTERNAL_SERVER_ERROR = 500;
    public const int SERVICE_UNAVAILABLE   = 503;
}
