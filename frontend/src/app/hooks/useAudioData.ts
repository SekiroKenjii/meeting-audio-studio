import { useState } from "react";
import ToastService from "../../lib/services/toastService";
import { api } from "../../sdk/services";
import { useAudio } from "../hooks";
import { useStrictModeMountEffect } from "./useStrictModeEffect";

/**
 * Custom hook for managing audio files data fetching and polling
 */
export const useAudioData = () => {
  const { audioFiles, setAudioFiles, setError } = useAudio();
  const [isLoading, setIsLoading] = useState(true);

  useStrictModeMountEffect(() => {
    loadAudioFiles();
  });

  const loadAudioFiles = async () => {
    try {
      const response = await api.audioFiles.index();

      if (response.success && response.data) {
        console.log("Audio files loaded:", response.data);
        setAudioFiles(response.data);
      }
    } catch (error) {
      console.error("Failed to load audio files:", error);
      // Use ToastService instead of setError for better UX
      ToastService.error(
        "Failed to load audio files",
        "Please try refreshing the page or contact support if the problem persists."
      );
      setError("Failed to load audio files");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    audioFiles,
    isLoading,
    refreshAudioFiles: loadAudioFiles,
  };
};
