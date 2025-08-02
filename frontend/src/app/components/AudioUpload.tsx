import ToastService from "@/lib/services/toastService";
import { api } from "@/sdk/services";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAudio } from "../hooks";
import { useChunkedUpload } from "../hooks/useChunkedUpload";
import { useStrictModeMountEffect } from "../hooks/useStrictModeEffect";
import { UploadConfig } from "../types/audio";
import FilenameConfirmDialog from "./FilenameConfirmDialog";
import { EVENTS } from "../constants/events";

const AudioUpload: React.FC = () => {
  const { addAudioFile, setError } = useAudio();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadConfig, setUploadConfig] = useState<UploadConfig | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [showFilenameDialog, setShowFilenameDialog] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadMethod, setUploadMethod] = useState<"regular" | "chunked">(
    "regular"
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadProgressRef = useRef<number>(0);
  const isUploadingRef = useRef<boolean>(false);
  const uploadConfigRef = useRef<UploadConfig | null>(null);

  // Update refs when state changes
  uploadProgressRef.current = uploadProgress;
  isUploadingRef.current = isUploading;
  uploadConfigRef.current = uploadConfig;

  // Memoized callbacks for the chunked upload hook to prevent re-initialization
  const handleChunkedProgress = useCallback((progress: any) => {
    setUploadProgress(progress.percentage);
  }, []);

  const handleChunkedComplete = useCallback(
    (audioFile: any) => {
      addAudioFile(audioFile);
      ToastService.success(
        "Upload Completed",
        `${audioFile.filename} has been uploaded and is being processed.`
      );
    },
    [addAudioFile]
  );

  const handleChunkedError = useCallback(
    (error: any) => {
      setError(error.message);
      console.log(
        "Chunked upload failed with progress:",
        uploadProgressRef.current
      );
      ToastService.error("Upload Failed", error.message);
    },
    [setError]
  );

  // Chunked upload hook
  const chunkedUpload = useChunkedUpload({
    onProgress: handleChunkedProgress,
    onComplete: handleChunkedComplete,
    onError: handleChunkedError,
  });

  useStrictModeMountEffect(() => {
    const fetchUploadConfig = async () => {
      try {
        const request = api.audioFiles.getUploadConfig();
        request.catch((_) => {
          ToastService.error(
            "Configuration Error",
            "Failed to load upload configuration"
          );
        });
        const response = await request;
        if (response.success && response.data) {
          setUploadConfig(response.data);
        } else {
          ToastService.error(
            "Configuration Error",
            "Failed to load upload configuration"
          );
        }
      } finally {
        setIsLoadingConfig(false);
      }
    };

    fetchUploadConfig();
  });

  // Separate effect for event listener that only runs once on mount
  useEffect(() => {
    const handleUploadTrigger = () => {
      if (!isUploadingRef.current && uploadConfigRef.current) {
        fileInputRef.current?.click();
      } else {
        console.log(
          "AudioUpload: cannot trigger upload - uploading or no config"
        );
      }
    };

    window.addEventListener(EVENTS.TRIGGER_FILE_UPLOAD, handleUploadTrigger);

    return () => {
      window.removeEventListener(
        EVENTS.TRIGGER_FILE_UPLOAD,
        handleUploadTrigger
      );
    };
  }, []);

  const validateFile = (file: File): string | null => {
    if (!uploadConfig) {
      return "Upload configuration not loaded";
    }

    // Validate file type
    if (!uploadConfig.allowed_mime_types.includes(file.type)) {
      const supportedFormats = uploadConfig.allowed_extensions
        .map((ext) => ext.toUpperCase())
        .join(", ");
      return `Please select a valid audio file (${supportedFormats})`;
    }

    // Validate file size
    if (file.size > uploadConfig.max_file_size_bytes) {
      return `File size must be less than ${uploadConfig.max_file_size_mb}MB`;
    }

    return null;
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const validationError = validateFile(file);

    if (validationError) {
      setError(validationError);
      ToastService.error("Invalid File", validationError);
      return;
    }

    // Store the file and show filename confirmation dialog
    setPendingFile(file);
    setShowFilenameDialog(true);
  };

  const resetUploadState = () => {
    setIsUploading(false);
    setPendingFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFilenameConfirm = async (filename: string) => {
    if (!pendingFile || !uploadConfig) return;

    setShowFilenameDialog(false);
    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Create a new File object with the custom filename
      const renamedFile = new File([pendingFile], filename, {
        type: pendingFile.type,
        lastModified: pendingFile.lastModified,
      });

      // Determine upload method based on file size
      const chunkThreshold = 20 * 1024 * 1024; // 20MB threshold for chunked upload
      const useChunkedUpload = renamedFile.size > chunkThreshold;
      setUploadMethod(useChunkedUpload ? "chunked" : "regular");

      if (useChunkedUpload) {
        console.log(
          `Using chunked upload for large file (${Math.round(
            renamedFile.size / 1024 / 1024
          )}MB)`
        );

        // Use chunked upload for large files
        // Don't catch errors here - let them bubble up to be handled in the main catch block
        await chunkedUpload.uploadFile(renamedFile, filename);

        // Only reset upload state after successful chunked upload
        resetUploadState();
      } else {
        console.log(
          `Using regular upload for file (${Math.round(
            renamedFile.size / 1024 / 1024
          )}MB)`
        );

        // Use regular upload for smaller files
        const response = await api.audioFiles.uploadAudio(renamedFile);
        if (response.success && response.data) {
          addAudioFile(response.data);
          ToastService.success(
            "Upload Started",
            `${filename} is being uploaded and processed. You'll see real-time updates.`
          );
        } else {
          const errorMessage = "Failed to upload audio file";
          setError(errorMessage);
          ToastService.error("Upload Failed", errorMessage);
        }

        // Reset state after successful regular upload
        resetUploadState();
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Upload failed";
      setError(errorMessage);

      // Only show additional toast for non-API errors if not already handled by chunked upload
      if (
        !(error instanceof Error) ||
        !error.message.includes("Request failed")
      ) {
        ToastService.error("Upload Error", errorMessage);
      }

      // Reset state on error for both upload types
      resetUploadState();
    }
    // Remove the finally block since we handle cleanup in each path
  };

  const handleFilenameCancel = () => {
    setShowFilenameDialog(false);
    setPendingFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const renderLoadingState = () => (
    <div className="w-full border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center">
      <div className="mx-auto w-12 h-12 flex items-center justify-center mb-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
      <p className="text-gray-600">Loading upload configuration...</p>
    </div>
  );

  const renderUploadingState = () => (
    <>
      <div className="mx-auto w-12 h-12 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {uploadMethod === "chunked"
            ? "Uploading in chunks..."
            : "Uploading your file..."}
        </h3>
        <p className="text-gray-600">
          {uploadMethod === "chunked"
            ? "Large file detected - using optimized chunked upload"
            : "Please wait while we process your audio file"}
        </p>

        {/* Progress bar for chunked uploads */}
        {uploadMethod === "chunked" && chunkedUpload.progress && (
          <div className="w-full max-w-xs mx-auto">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progress</span>
              <span>{Math.round(chunkedUpload.progress.percentage)}%</span>
            </div>
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${chunkedUpload.progress.percentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>
                Chunk {chunkedUpload.progress.chunkIndex + 1} of{" "}
                {chunkedUpload.progress.totalChunks}
              </span>
              <span>
                {Math.round(chunkedUpload.progress.uploadedBytes / 1024 / 1024)}
                MB /{" "}
                {Math.round(chunkedUpload.progress.totalBytes / 1024 / 1024)}MB
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );

  const renderUploadInterface = () => (
    <>
      <div className="mx-auto w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
          />
        </svg>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold text-gray-900">
          Upload your audio file
        </h3>
        <p className="text-gray-600 text-base">
          Drag and drop your audio file here, or{" "}
          <span className="text-gray-900 font-medium">click to browse</span>
        </p>

        <div className="space-y-2 text-sm text-gray-500">
          <p>
            Supported formats:{" "}
            {uploadConfig
              ? uploadConfig.allowed_extensions
                  .map((ext) => ext.toUpperCase())
                  .join(", ")
              : "Loading..."}
          </p>
          <p>
            Maximum file size:{" "}
            {uploadConfig ? `${uploadConfig.max_file_size_mb}MB` : "Loading..."}
          </p>
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <span>
              Files larger than 20MB use chunked upload for better reliability
              and resumable transfers
            </span>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="w-full max-w-4xl mx-auto">
      {isLoadingConfig && renderLoadingState()}

      {!isLoadingConfig && isUploading && (
        // When uploading, don't use a button wrapper to avoid nested buttons
        <div
          className={`
            w-full relative border-2 border-dashed rounded-2xl p-12 text-center
            transition-all duration-200 ease-in-out
            ${
              isDragging
                ? "border-gray-400 bg-gray-50 scale-[1.02]"
                : "border-gray-300"
            }
          `}
        >
          <div className="space-y-4">{renderUploadingState()}</div>

          {/* Cancel button for chunked uploads - outside of any button */}
          {uploadMethod === "chunked" && (
            <button
              onClick={() => chunkedUpload.cancelUpload()}
              className="mt-4 px-4 py-2 text-sm text-red-600 hover:text-red-800 border border-red-300 hover:border-red-400 rounded-md transition-colors"
            >
              Cancel Upload
            </button>
          )}
        </div>
      )}

      {!isLoadingConfig && !isUploading && (
        <button
          type="button"
          className={`
            w-full relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
            transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
            ${
              isDragging
                ? "border-gray-400 bg-gray-50 scale-[1.02]"
                : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
            }
          `}
          aria-label="Upload audio file - click or drag and drop files here"
          disabled={!uploadConfig}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleButtonClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={
              uploadConfig
                ? `audio/*,.${uploadConfig.allowed_extensions.join(",.")}`
                : "audio/*"
            }
            onChange={handleFileInputChange}
            className="hidden"
            disabled={isUploading || !uploadConfig}
          />

          <div className="space-y-4">{renderUploadInterface()}</div>
        </button>
      )}

      {/* Filename Confirmation Dialog */}
      <FilenameConfirmDialog
        isOpen={showFilenameDialog}
        originalFilename={pendingFile?.name || ""}
        onConfirm={handleFilenameConfirm}
        onCancel={handleFilenameCancel}
      />
    </div>
  );
};

export default AudioUpload;
