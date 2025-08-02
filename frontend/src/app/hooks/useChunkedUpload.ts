import { useState, useCallback } from "react";
import { api } from "@/sdk/services";

export interface ChunkUploadProgress {
  uploadedBytes: number;
  totalBytes: number;
  percentage: number;
  chunkIndex: number;
  totalChunks: number;
  isComplete: boolean;
  chunkSize: number;
  estimatedTimeRemaining?: number;
}

export interface ChunkedUploadSession {
  uploadId: string;
  status: "initialized" | "uploading" | "completed" | "failed" | "cancelled";
  progress: number;
  uploadedChunks: number;
  totalChunks: number;
  fileSize: number;
  filename: string;
  expiresAt: string;
  isExpired: boolean;
  isComplete: boolean;
}

interface UseChunkedUploadOptions {
  chunkSize?: number; // Will be calculated dynamically if not provided
  onProgress?: (progress: ChunkUploadProgress) => void;
  onChunkComplete?: (chunkIndex: number, progress: ChunkUploadProgress) => void;
  onError?: (error: Error) => void;
  onComplete?: (audioFile: any) => void;
  maxRetries?: number; // Default: 3
  retryDelay?: number; // Default: 1000ms
  maxChunks?: number; // Default: 50 (prevent too many requests)
  minChunkSize?: number; // Default: 1MB
  maxChunkSize?: number; // Default: 50MB
  enableParallelUploads?: boolean; // Default: false
  maxParallelChunks?: number; // Default: 3
}

export const useChunkedUpload = (options: UseChunkedUploadOptions = {}) => {
  const {
    chunkSize: fixedChunkSize,
    onProgress,
    onChunkComplete,
    onError,
    onComplete,
    maxRetries = 3,
    retryDelay = 1000,
    maxChunks = 50, // Limit total chunks to prevent too many requests
    minChunkSize = 1 * 1024 * 1024, // 1MB minimum
    maxChunkSize = 50 * 1024 * 1024, // 50MB maximum
    enableParallelUploads: _ENABLE_PARALLEL_UPLOADS = false,
    maxParallelChunks: _MAX_PARALLEL_CHUNKS = 3,
  } = options;

  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<ChunkUploadProgress | null>(null);
  const [currentSession, setCurrentSession] =
    useState<ChunkedUploadSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number>(0);

  // Dynamic chunk size calculation based on file size
  const calculateOptimalChunkSize = useCallback(
    (fileSize: number): number => {
      if (fixedChunkSize) return fixedChunkSize;

      // Calculate chunk size to stay within maxChunks limit
      let optimalSize = Math.ceil(fileSize / maxChunks);

      // Ensure chunk size is within bounds
      optimalSize = Math.max(minChunkSize, Math.min(maxChunkSize, optimalSize));

      // Round to nearest MB for cleaner chunks
      optimalSize = Math.ceil(optimalSize / (1024 * 1024)) * 1024 * 1024;

      console.log(
        `Dynamic chunk size for ${Math.round(
          fileSize / 1024 / 1024
        )}MB file: ${Math.round(optimalSize / 1024 / 1024)}MB (${Math.ceil(
          fileSize / optimalSize
        )} chunks)`
      );

      return optimalSize;
    },
    [fixedChunkSize, maxChunks, minChunkSize, maxChunkSize]
  );

  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const uploadChunkWithRetry = useCallback(
    async (
      uploadId: string,
      chunkIndex: number,
      chunk: Blob,
      totalChunks: number,
      retries = 0
    ): Promise<any> => {
      try {
        const response = await api.audioFiles.uploadChunk({
          uploadId,
          chunkIndex,
          chunk,
          totalChunks,
        });

        if (response.success) {
          return response.data;
        } else {
          throw new Error(
            `Upload failed: ${response.message || "Unknown error"}`
          );
        }
      } catch (error) {
        if (retries < maxRetries) {
          const delay = retryDelay * Math.pow(2, retries); // Exponential backoff
          console.warn(
            `Chunk ${chunkIndex} failed, retrying in ${delay}ms... (${
              retries + 1
            }/${maxRetries})`
          );
          await sleep(delay);
          return uploadChunkWithRetry(
            uploadId,
            chunkIndex,
            chunk,
            totalChunks,
            retries + 1
          );
        } else {
          throw new Error(
            `Chunk ${chunkIndex} failed after ${maxRetries} retries: ${error}`
          );
        }
      }
    },
    [maxRetries, retryDelay]
  );

  const uploadFile = useCallback(
    async (file: File, filename?: string): Promise<any> => {
      const actualFilename = filename || file.name;
      setIsUploading(true);
      setError(null);
      setProgress(null);
      setCurrentSession(null);
      setStartTime(Date.now());

      // Calculate optimal chunk size for this file
      const chunkSize = calculateOptimalChunkSize(file.size);
      const totalChunks = Math.ceil(file.size / chunkSize);

      console.log(
        `Uploading ${Math.round(
          file.size / 1024 / 1024
        )}MB file with ${totalChunks} chunks of ${Math.round(
          chunkSize / 1024 / 1024
        )}MB each`
      );

      try {
        // 1. Initialize upload session
        const sessionResponse = await api.audioFiles.initializeChunkedUpload({
          filename: actualFilename,
          fileSize: file.size,
          totalChunks,
          mimeType: file.type,
        });

        if (!sessionResponse.success || !sessionResponse.data) {
          throw new Error("Failed to initialize upload session");
        }

        const { uploadId } = sessionResponse.data;
        console.log("Upload session initialized:", uploadId);

        // 2. Upload chunks sequentially
        let uploadedBytes = 0;

        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
          if (!isUploading) {
            throw new Error("Upload cancelled by user");
          }

          const start = chunkIndex * chunkSize;
          const end = Math.min(start + chunkSize, file.size);
          const chunk = file.slice(start, end);

          console.log(
            `Uploading chunk ${chunkIndex + 1}/${totalChunks} (${Math.round(
              chunk.size / 1024 / 1024
            )}MB)`
          );

          const chunkResponse = await uploadChunkWithRetry(
            uploadId,
            chunkIndex,
            chunk,
            totalChunks
          );

          uploadedBytes += chunk.size;
          const timeElapsed = Date.now() - startTime;
          const uploadSpeed = uploadedBytes / (timeElapsed / 1000); // bytes per second
          const remainingBytes = file.size - uploadedBytes;
          const estimatedTimeRemaining = remainingBytes / uploadSpeed;

          const progressData: ChunkUploadProgress = {
            uploadedBytes,
            totalBytes: file.size,
            percentage: Math.round((uploadedBytes / file.size) * 100),
            chunkIndex,
            totalChunks,
            isComplete: chunkResponse.isComplete || false,
            chunkSize,
            estimatedTimeRemaining: estimatedTimeRemaining / 1000, // convert to seconds
          };

          setProgress(progressData);
          onProgress?.(progressData);
          onChunkComplete?.(chunkIndex, progressData);

          // Update session data
          if (chunkResponse) {
            setCurrentSession((prev) =>
              prev
                ? {
                    ...prev,
                    uploadedChunks: chunkResponse.uploadedChunks,
                    progress: chunkResponse.progress,
                  }
                : null
            );
          }
        }

        // 3. Finalize upload
        console.log("Finalizing upload...");
        const finalizeResponse = await api.audioFiles.finalizeChunkedUpload(
          uploadId
        );

        if (!finalizeResponse.success || !finalizeResponse.data) {
          throw new Error("Failed to finalize upload");
        }

        console.log("Upload completed successfully:", finalizeResponse.data);

        setIsUploading(false);
        setCurrentSession(null);

        const finalProgress: ChunkUploadProgress = {
          uploadedBytes: file.size,
          totalBytes: file.size,
          percentage: 100,
          chunkIndex: totalChunks - 1,
          totalChunks,
          isComplete: true,
          chunkSize,
        };
        setProgress(finalProgress);

        onComplete?.(finalizeResponse.data);
        return finalizeResponse.data;
      } catch (error) {
        console.error("Chunked upload failed:", error);
        setIsUploading(false);
        setError(error instanceof Error ? error.message : "Upload failed");
        onError?.(error instanceof Error ? error : new Error("Upload failed"));
        throw error;
      }
    },
    [
      calculateOptimalChunkSize,
      onProgress,
      onChunkComplete,
      onError,
      onComplete,
      isUploading,
      startTime,
      uploadChunkWithRetry,
    ]
  );

  const cancelUpload = useCallback(async () => {
    if (currentSession && isUploading) {
      try {
        await api.audioFiles.cancelChunkedUpload(currentSession.uploadId);
        setIsUploading(false);
        setCurrentSession(null);
        setProgress(null);
        setError("Upload cancelled");
      } catch (error) {
        console.error("Failed to cancel upload:", error);
      }
    }
  }, [currentSession, isUploading]);

  const getSessionStatus = useCallback(
    async (uploadId: string): Promise<ChunkedUploadSession | null> => {
      try {
        const response = await api.audioFiles.getChunkedUploadStatus(uploadId);
        if (response.success && response.data) {
          return response.data;
        }
        return null;
      } catch (error) {
        console.error("Failed to get session status:", error);
        return null;
      }
    },
    []
  );

  return {
    uploadFile,
    cancelUpload,
    getSessionStatus,
    isUploading,
    progress,
    currentSession,
    error,

    // Computed values
    isComplete: progress?.isComplete || false,
    progressPercentage: progress?.percentage || 0,
    uploadedChunks: currentSession?.uploadedChunks || 0,
    totalChunks: currentSession?.totalChunks || 0,
    estimatedTimeRemaining: progress?.estimatedTimeRemaining,
    chunkSize: progress?.chunkSize || 0,
  };
};
