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
      const request = api.audioFiles.index();
      request.catch((_) => {
        ToastService.error(
          "Failed to load audio files",
          "Please try refreshing the page or contact support if the problem persists."
        );
        setError("Failed to load audio files");
      });
      const response = await request;

      if (response.success && response.data) {
        setAudioFiles(response.data);
      }
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
