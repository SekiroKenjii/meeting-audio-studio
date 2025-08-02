// Auto-generated API service
// Generated on: 2025-08-01T15:35:46.596Z

import { apiService } from "@/lib/services/apiService";
import { ApiResponse } from "@/lib/types/apiResponse";

/**
 * TranscriptsService API Service
 * Auto-generated from backend API documentation
 */
class TranscriptsService {
  private request<T>(
    endpoint: string,
    options?: {
      method?: string;
      headers?: Record<string, string>;
      body?: any;
      showToast?: boolean;
    }
  ): Promise<ApiResponse<T>> {
    return apiService.request<T>(endpoint, options);
  }

  /**
   * Get Transcript by ID
   */
  async getTranscript(id: number): Promise<ApiResponse<any>> {
    return this.request(`/transcripts/${id}`);
  }

  /**
   * Create a new Transcript
   */
  async createTranscript(id: number, query: string): Promise<ApiResponse<any>> {
    return this.request(`/transcripts/${id}/queries`, {
      method: "POST",
      body: { query },
    });
  }
}

export const transcriptsService = new TranscriptsService();
