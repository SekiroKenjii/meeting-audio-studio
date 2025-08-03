import { ApiError, ErrorType } from "../types/error";

// Global error state for storing error information
let currentError: {
  type: ErrorType;
  code?: number;
  message?: string;
} | null = null;

/**
 * Sets the current error state for the error page
 */
export const setGlobalError = (error: {
  type: ErrorType;
  code?: number;
  message?: string;
}) => {
  currentError = error;
};

/**
 * Gets the current error state
 */
export const getGlobalError = () => {
  return currentError;
};

/**
 * Clears the current error state
 */
export const clearGlobalError = () => {
  currentError = null;
};

/**
 * Determines error type based on status code
 */
export const getErrorType = (status?: number): ErrorType => {
  if (!status || status === 0) {
    return "network";
  }

  if (status >= 500) {
    return "server";
  }

  return "unknown";
};

/**
 * Redirects to error page with error information
 */
export const redirectToErrorPage = (error: ApiError) => {
  const errorType = getErrorType(error.status);

  setGlobalError({
    type: errorType,
    code: error.status,
    message: error.message,
  });

  // Use window.location to force a full page navigation
  // This ensures we leave the current app state completely and provides
  // a clean recovery path for severe API/network errors
  window.location.href = "/error";
};

/**
 * Check if an error should redirect to error page
 */
export const shouldRedirectToErrorPage = (status?: number): boolean => {
  if (!status) return true; // Network errors

  // Server errors (500+)
  if (status >= 500) return true;

  // Network error (status 0)
  if (status === 0) return true;

  return false;
};
