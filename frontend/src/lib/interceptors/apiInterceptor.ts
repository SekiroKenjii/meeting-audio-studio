import ToastService from "../services/toastService";
import { ApiError, ErrorInterceptor } from "../types/error";
import {
  InterceptorRequest,
  InterceptorResponse,
  RequestConfig,
  RequestInterceptor,
  ResponseInterceptor,
} from "../types/http";
import {
  redirectToErrorPage,
  shouldRedirectToErrorPage,
} from "../utils/errorHandler";

class ApiInterceptor {
  private readonly requestInterceptors: RequestInterceptor[] = [];
  private readonly responseInterceptors: ResponseInterceptor[] = [];
  private readonly errorInterceptors: ErrorInterceptor[] = [];

  // Add request interceptor
  addRequestInterceptor(interceptor: RequestInterceptor): number {
    this.requestInterceptors.push(interceptor);
    return this.requestInterceptors.length - 1;
  }

  // Add response interceptor
  addResponseInterceptor(interceptor: ResponseInterceptor): number {
    this.responseInterceptors.push(interceptor);
    return this.responseInterceptors.length - 1;
  }

  // Add error interceptor
  addErrorInterceptor(interceptor: ErrorInterceptor): number {
    this.errorInterceptors.push(interceptor);
    return this.errorInterceptors.length - 1;
  }

  // Remove interceptor by index
  removeRequestInterceptor(index: number): void {
    this.requestInterceptors.splice(index, 1);
  }

  removeResponseInterceptor(index: number): void {
    this.responseInterceptors.splice(index, 1);
  }

  removeErrorInterceptor(index: number): void {
    this.errorInterceptors.splice(index, 1);
  }

  // Process request through interceptors
  private async processRequest(
    request: InterceptorRequest
  ): Promise<InterceptorRequest> {
    let processedRequest = request;

    for (const interceptor of this.requestInterceptors) {
      processedRequest = await interceptor(processedRequest);
    }

    return processedRequest;
  }

  // Process response through interceptors
  private async processResponse<T>(
    response: InterceptorResponse<T>
  ): Promise<InterceptorResponse<T>> {
    let processedResponse = response;

    for (const interceptor of this.responseInterceptors) {
      processedResponse = await interceptor(processedResponse);
    }

    return processedResponse;
  }

  // Process error through interceptors
  private async processError(error: ApiError): Promise<never> {
    let processedError = error;

    for (const interceptor of this.errorInterceptors) {
      try {
        processedError = await interceptor(processedError);
      } catch (interceptorError) {
        // If interceptor throws, use that error instead
        if (interceptorError instanceof Error) {
          throw interceptorError;
        }
        throw new Error("Error interceptor failed");
      }
    }

    throw processedError;
  }

  // Create API error based on status code
  private createApiError(response: Response, data?: any): ApiError {
    const error = new Error() as ApiError;
    error.status = response.status;
    error.statusText = response.statusText;
    error.data = data;

    // Set error message based on status code
    switch (response.status) {
      case 400:
        error.message = data?.message || "Bad Request - Invalid data provided";
        break;
      case 401:
        error.message = "Unauthorized - Please log in again";
        break;
      case 403:
        error.message =
          "Forbidden - You do not have permission to access this resource";
        break;
      case 404:
        error.message = "Not Found - The requested resource could not be found";
        break;
      case 408:
        error.message =
          "Request Timeout - The request took too long to complete";
        break;
      case 409:
        error.message =
          "Conflict - There was a conflict with the current state";
        break;
      case 413:
        error.message = "Payload Too Large - The file is too large to upload";
        break;
      case 422:
        error.message =
          data?.message || "Validation Error - Please check your input";
        break;
      case 429:
        error.message =
          "Too Many Requests - Please wait a moment before trying again";
        break;
      case 500:
        error.message = "Internal Server Error - Please try again later";
        break;
      case 502:
        error.message = "Bad Gateway - Server is temporarily unavailable";
        break;
      case 503:
        error.message =
          "Service Unavailable - Server is temporarily down for maintenance";
        break;
      case 504:
        error.message = "Gateway Timeout - Server response timed out";
        break;
      default:
        error.message =
          data?.message || `Request failed with status ${response.status}`;
    }

    return error;
  }

  // Main request method with retry logic
  async request<T>(
    url: string,
    config: RequestConfig = {}
  ): Promise<InterceptorResponse<T>> {
    const defaultConfig: RequestConfig = {
      method: "GET",
      headers: {},
      timeout: 30000,
      retries: 2,
      ...config,
    };

    // Process request through interceptors
    const processedRequest = await this.processRequest({
      url,
      config: defaultConfig,
    });

    let lastError: ApiError | null = null;
    const maxRetries = processedRequest.config.retries || 0;

    // Retry logic
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.makeRequest<T>(processedRequest);
        return await this.processResponse(response);
      } catch (error) {
        lastError = error as ApiError;

        // Don't retry for certain error codes
        if (
          lastError.status &&
          [400, 401, 403, 404, 422].includes(lastError.status)
        ) {
          break;
        }

        // Don't retry on last attempt
        if (attempt === maxRetries) {
          break;
        }

        // Wait before retry with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // Process error through interceptors
    if (lastError) {
      return this.processError(lastError);
    }

    // This should never happen, but just in case
    throw new Error("Request failed with unknown error");
  }

  // Make the actual HTTP request
  private async makeRequest<T>(
    request: InterceptorRequest
  ): Promise<InterceptorResponse<T>> {
    const { url, config } = request;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    try {
      // Prepare request options
      const requestOptions: RequestInit = {
        method: config.method,
        headers: config.headers,
        body: this.prepareBody(config.body),
        signal: controller.signal,
      };

      // Make the request
      const response = await fetch(url, requestOptions);

      // Clear timeout
      clearTimeout(timeoutId);

      // Parse response
      let data: T;
      const contentType = response.headers.get("content-type");

      if (contentType?.includes("application/json")) {
        data = await response.json();
      } else {
        data = (await response.text()) as unknown as T;
      }

      // Handle error responses
      if (!response.ok) {
        throw this.createApiError(response, data);
      }

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        config,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      console.log("Fetch error caught:", {
        error,
        name: (error as Error).name,
        message: (error as Error).message,
        stack: (error as Error).stack,
      });

      if (error instanceof Error) {
        // Handle network errors
        if (error.name === "AbortError") {
          const timeoutError = new Error("Request timeout") as ApiError;
          timeoutError.status = 408;
          throw timeoutError;
        }

        // Check for various network error patterns
        if (
          error.message.includes("fetch") ||
          error.message.includes("Failed to fetch") ||
          error.message.includes("NetworkError") ||
          error.message.includes("ERR_NETWORK") ||
          error.name === "TypeError"
        ) {
          const networkError = new Error(
            `Network error - Unable to connect to server: ${error.message}`
          ) as ApiError;
          networkError.status = 0;
          networkError.originalError = error;
          throw networkError;
        }
      }

      throw error;
    }
  }

  // Prepare request body
  private prepareBody(body: any): string | FormData | null {
    if (!body) return null;
    if (body instanceof FormData) return body;
    if (typeof body === "string") return body;
    return JSON.stringify(body);
  }
}

// Create singleton instance
export const apiInterceptor = new ApiInterceptor();

// Setup default interceptors
export const setupDefaultInterceptors = () => {
  // Request interceptor - Add common headers and logging
  apiInterceptor.addRequestInterceptor((request) => {
    const { url, config } = request;

    // Add default headers
    if (!(config.body instanceof FormData)) {
      config.headers = {
        "Content-Type": "application/json",
        ...config.headers,
      };
    }

    // Add common headers (auth token, etc.)
    // const token = localStorage.getItem('authToken');
    // if (token) {
    //   config.headers['Authorization'] = `Bearer ${token}`;
    // }

    console.log("API Request:", {
      url,
      method: config.method,
      headers: config.headers,
      bodyType:
        config.body instanceof FormData ? "FormData" : typeof config.body,
    });

    return request;
  });

  // Response interceptor - Log success responses
  apiInterceptor.addResponseInterceptor((response) => {
    console.log("API Response:", {
      status: response.status,
      statusText: response.statusText,
      url: response.config,
    });

    return response;
  });

  // Error interceptor - Handle errors based on status codes
  apiInterceptor.addErrorInterceptor((error) => {
    console.error("API Error:", {
      status: error.status,
      message: error.message,
      data: error.data,
    });

    // Handle different error cases based on requirements
    if (error.status) {
      // Network errors and server errors (500+) -> redirect to error page
      if (shouldRedirectToErrorPage(error.status)) {
        redirectToErrorPage(error);
        // Still throw the error after redirecting
        throw error;
      }

      // Authentication/Authorization errors (401, 403) -> ignore for now
      if (error.status === 401 || error.status === 403) {
        console.log("Auth error ignored (to be implemented):", error.status);
        // Just throw without showing toast - will be handled when auth is implemented
        throw error;
      }

      // Show toast for specific errors that need user notification
      if ([408, 504, 413, 429].includes(error.status)) {
        switch (error.status) {
          case 408:
          case 504:
            ToastService.error(
              "Timeout",
              "The request timed out. Please try again."
            );
            break;
          case 413:
            ToastService.error(
              "File Too Large",
              "The file you are trying to upload is too large."
            );
            break;
          case 429:
            ToastService.warning(
              "Rate Limit",
              "Too many requests. Please wait a moment."
            );
            break;
        }
        throw error;
      }

      // Validation errors (422) -> show detailed validation errors
      if (error.status === 422) {
        console.warn("🔍 Validation error:", {
          status: error.status,
          message: error.message,
          errors: error.data?.errors,
        });

        // Show main validation message
        ToastService.error("Validation Error", error.message);

        // Show individual field validation errors if available
        if (error.data?.errors && typeof error.data.errors === "object") {
          Object.entries(error.data.errors).forEach(([field, messages]) => {
            if (Array.isArray(messages)) {
              messages.forEach((message: string) => {
                ToastService.warning(
                  `${
                    field.charAt(0).toUpperCase() +
                    field.slice(1).replace(/_/g, " ")
                  }`,
                  message
                );
              });
            }
          });
        }

        throw error;
      }

      // Other 4xx errors -> log and let component handle
      if (error.status >= 400 && error.status < 500) {
        console.warn("🔍 Client error - letting component handle:", {
          status: error.status,
          message: error.message,
          data: error.data,
        });
        // Don't show toast - let the component handle the error display
        throw error;
      }
    } else {
      // Unknown errors without status -> redirect to error page
      redirectToErrorPage(error);
      throw error;
    }

    // Fallback - throw the error
    throw error;
  });
};

export default apiInterceptor;
