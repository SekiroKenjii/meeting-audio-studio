import apiInterceptor, {
  setupDefaultInterceptors,
} from "../interceptors/apiInterceptor";
import { ApiResponse } from "../types/apiResponse";
import { InterceptorResponse } from "../types/http";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const API_VERSION = import.meta.env.VITE_API_VERSION || "v1";

class ApiService {
  constructor() {
    // Setup default interceptors on initialization
    setupDefaultInterceptors();
  }

  /**
   * Core request method used by all resource services
   * @param endpoint - The API endpoint (with or without version prefix)
   * @param options - Request options (method, headers, body, etc.)
   * @returns Promise<ApiResponse<T>>
   */
  async request<T>(
    endpoint: string,
    options: {
      method?: string;
      headers?: Record<string, string>;
      body?: any;
      showToast?: boolean;
    } = {}
  ): Promise<ApiResponse<T>> {
    // Ensure endpoint starts with API version
    const versionedEndpoint = endpoint.startsWith(`/${API_VERSION}`)
      ? endpoint
      : `/${API_VERSION}${endpoint}`;

    const url = `${API_BASE_URL}${versionedEndpoint}`;

    const response: InterceptorResponse<ApiResponse<T>> =
      await apiInterceptor.request(url, {
        method: options.method || "GET",
        headers: options.headers || {},
        body: options.body,
      });

    return response.data;
  }
}

export const apiService = new ApiService();
