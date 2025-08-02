import { apiService } from "@/lib/services/apiService";
import { api } from "@/sdk/services";
import { useAsyncOperation, useAudio } from "../hooks";
import { useStrictModeMountEffect } from "./useStrictModeEffect";

/**
 * Custom hook for managing audio files data fetching and polling
 */
export const useAudioData = () => {
  const { audioFiles, setAudioFiles, setError } = useAudio();

  const { isLoading, execute: executeAsync } = useAsyncOperation({
    onSuccess: (data: any) => {
      console.log("Audio files loaded:", data);
      setAudioFiles(data);
    },
    onError: (_error) => {
      setError("Failed to load audio files");
    },
    errorMessage: "Failed to load audio files",
    errorDescription:
      "Please try refreshing the page or contact support if the problem persists.",
  });

  useStrictModeMountEffect(() => {
    loadAudioFiles();
  });

  const loadAudioFiles = async () => {
    await executeAsync(() => apiService.handleResponse(api.audioFiles.index()));
  };

  return {
    audioFiles,
    isLoading,
    refreshAudioFiles: loadAudioFiles,
  };
};
