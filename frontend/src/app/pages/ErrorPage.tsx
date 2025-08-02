import { ErrorType } from "@/lib/types/error";
import { clearGlobalError, getGlobalError } from "@/lib/utils/errorHandler";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../constants/routes";
import { useStrictModeMountEffect } from "../hooks";

interface ErrorPageProps {
  errorType?: ErrorType;
  errorCode?: number;
  errorMessage?: string;
  onRetry?: () => void;
}

const ErrorPage: React.FC<ErrorPageProps> = ({
  errorType: propErrorType,
  errorCode: propErrorCode,
  errorMessage: propErrorMessage,
  onRetry,
}) => {
  const navigate = useNavigate();
  const [errorInfo, setErrorInfo] = useState<{
    type: ErrorType;
    code?: number;
    message?: string;
  }>({
    type: propErrorType || "unknown",
    code: propErrorCode,
    message: propErrorMessage,
  });

  useStrictModeMountEffect(() => {
    // Check for global error state
    const globalError = getGlobalError();
    if (globalError) {
      setErrorInfo(globalError);
      clearGlobalError(); // Clear it so it doesn't persist
    }
  });

  const getErrorDetails = () => {
    switch (errorInfo.type) {
      case "network":
        return {
          icon: "🌐",
          title: "Connection Problem",
          message:
            "Unable to connect to the server. Please check your internet connection.",
          suggestion: "Please check your internet connection and try again.",
        };
      case "server":
        return {
          icon: "🔧",
          title: "Server Error",
          message:
            errorInfo.message || "Our servers are experiencing some issues.",
          suggestion:
            "We're working to fix this. Please try again in a few minutes.",
        };
      default:
        return {
          icon: "⚠️",
          title: "Something went wrong",
          message: errorInfo.message || "An unexpected error occurred.",
          suggestion:
            "Please try refreshing the page or contact support if the problem persists.",
        };
    }
  };

  const errorDetails = getErrorDetails();

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    navigate(ROUTES.LANDING);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Error Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Error Icon */}
          <div className="text-6xl mb-6">{errorDetails.icon}</div>

          {/* Error Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {errorDetails.title}
          </h1>

          {/* Error Message */}
          <p className="text-gray-600 mb-2">{errorDetails.message}</p>

          {/* Error Suggestion */}
          <p className="text-sm text-gray-500 mb-4">
            {errorDetails.suggestion}
          </p>

          {/* Error Code and Technical Message */}
          {(errorInfo.code || errorInfo.message) && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Technical Details
              </div>
              {errorInfo.code && (
                <div className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">Error Code:</span>{" "}
                  {errorInfo.code}
                </div>
              )}
              {errorInfo.message && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Details:</span>{" "}
                  {errorInfo.message}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {onRetry ? (
              <button
                onClick={onRetry}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Retry Action
              </button>
            ) : (
              <button
                onClick={handleRetry}
                className="w-full bg-gray-900 text-white py-3 px-6 rounded-xl font-medium hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Reload Page
              </button>
            )}

            <button
              onClick={handleGoHome}
              className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-medium hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            >
              Go to Homepage
            </button>
          </div>
        </div>

        {/* Additional Help */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            If this problem continues, please{" "}
            <a
              href="mailto:support@example.com"
              className="text-gray-700 hover:text-gray-900 underline"
            >
              contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
