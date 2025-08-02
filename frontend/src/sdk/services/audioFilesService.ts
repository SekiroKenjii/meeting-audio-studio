// Auto-generated API service
// Generated on: 2025-08-01T15:35:46.595Z

import { apiService } from "@/lib/services/apiService";
import { ApiResponse } from "@/lib/types/apiResponse";

/**
 * AudioFilesService API Service
 * Auto-generated from backend API documentation
 */
class AudioFilesService {
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
   * Index audio files
   */
  async index(): Promise<ApiResponse<any>> {
    return this.request(`/audio-files`);
  }

  /**
   * Create a new Audio file
   */
  async uploadAudio(file: File): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append("audio_file", file);

    return this.request("/audio-files", {
      method: "POST",
      body: formData,
    });
  }

  /**
   * Get backup files list
   */
  async getBackupFiles(): Promise<ApiResponse<any>> {
    return this.request(`/audio-files/backups`);
  }

  /**
   * Download Audio file file
   */
  async downloadAudioFile(filename: string): Promise<Response> {
    const url = `/audio-files/backups/${encodeURIComponent(filename)}/download`;
    return fetch(url);
  }

  /**
   * Stream Audio file file
   */
  async streamAudioFile(filename: string): Promise<Response> {
    const url = `/audio-files/backups/${encodeURIComponent(filename)}/stream`;
    return fetch(url);
  }

  /**
   * Cancel chunked upload
   */
  async cancelChunkedUpload(uploadId: string): Promise<ApiResponse<any>> {
    return this.request(`/audio-files/chunked/cancel/${uploadId}`, {
      method: "DELETE",
    });
  }

  /**
   * Finalize chunked upload
   */
  async finalizeChunkedUpload(uploadId: string): Promise<ApiResponse<any>> {
    return this.request(`/audio-files/chunked/finalize/${uploadId}`, {
      method: "POST",
    });
  }

  /**
   * Initialize chunked upload session
   */
  async initializeChunkedUpload(params: { filename: string; fileSize: number; totalChunks: number; mimeType: string }): Promise<ApiResponse<any>> {
    return this.request("/audio-files/chunked/initialize", {
      method: "POST",
      body: JSON.stringify(params),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Get chunked upload status
   */
  async getChunkedUploadStatus(uploadId: string): Promise<ApiResponse<any>> {
    return this.request(`/audio-files/chunked/status/${uploadId}`);
  }

  /**
   * Upload a single chunk
   */
  async uploadChunk(params: { uploadId: string; chunkIndex: number; chunk: Blob; totalChunks: number }): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append("uploadId", params.uploadId);
    formData.append("chunkIndex", params.chunkIndex.toString());
    formData.append("totalChunks", params.totalChunks.toString());
    formData.append("chunk", params.chunk);

    return this.request("/audio-files/chunked/upload", {
      method: "POST",
      body: formData,
    });
  }

  /**
   * Get upload configuration
   */
  async getUploadConfig(): Promise<ApiResponse<any>> {
    return this.request(`/audio-files/config`);
  }

  /**
   * Get Audio file by ID
   */
  async getAudioFile(id: number): Promise<ApiResponse<any>> {
    return this.request(`/audio-files/${id}`);
  }

  /**
   * Get transcript for audio file
   */
  async getTranscriptByAudioFile(id: number): Promise<ApiResponse<any>> {
    return this.request(`/audio-files/${id}/transcript`);
  }
}

export const audioFilesService = new AudioFilesService();
