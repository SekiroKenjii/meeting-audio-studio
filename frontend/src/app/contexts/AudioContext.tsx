import React, {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import websocketService, {
  AudioFileStatusUpdate,
} from "../services/websocketService";
import { AudioFile, AudioFileStatus, Transcript } from "../types/audio";

interface AudioContextType {
  audioFiles: AudioFile[];
  selectedAudioFile: AudioFile | null;
  transcript: Transcript | null;
  isLoading: boolean;
  error: string | null;
  refreshTrigger: number;

  // Actions
  setAudioFiles: (files: AudioFile[]) => void;
  setSelectedAudioFile: (file: AudioFile | null) => void;
  setTranscript: (transcript: Transcript | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addAudioFile: (file: AudioFile) => void;
  updateAudioFile: (id: number, updates: Partial<AudioFile>) => void;
  refreshTranscript: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export { AudioContext };

interface AudioProviderProps {
  children: ReactNode;
}

export const AudioProvider: React.FC<AudioProviderProps> = ({ children }) => {
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [selectedAudioFile, setSelectedAudioFile] = useState<AudioFile | null>(
    null
  );
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const addAudioFile = useCallback((file: AudioFile) => {
    setAudioFiles((prev) => [file, ...prev]);
  }, []);

  const refreshTranscript = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const updateAudioFile = useCallback(
    (id: number, updates: Partial<AudioFile>) => {
      setAudioFiles((prev) =>
        prev.map((file) => (file.id === id ? { ...file, ...updates } : file))
      );

      // Update selected file if it's the one being updated
      setSelectedAudioFile((prev) =>
        prev?.id === id ? { ...prev, ...updates } : prev
      );
    },
    []
  );

  // Handle WebSocket audio file status updates
  const handleAudioStatusUpdate = useCallback(
    (update: AudioFileStatusUpdate) => {
      console.log("Updating audio file status:", update);

      // Map WebSocket update to AudioFile format
      const audioFileUpdate: Partial<AudioFile> = {
        status: update.status as AudioFileStatus,
        duration: update.duration,
        file_size: update.file_size,
        created_at: update.created_at,
        updated_at: update.updated_at,
      };
      updateAudioFile(update.id, audioFileUpdate);
    },
    [updateAudioFile]
  );

  useEffect(() => {
    console.log("Setting up WebSocket listeners");

    const unsubscribe = websocketService.onAudioFileStatusUpdate(
      handleAudioStatusUpdate
    );

    return () => {
      console.log("Cleaning up WebSocket listeners");
      unsubscribe();
    };
  }, [handleAudioStatusUpdate]);

  const value: AudioContextType = useMemo(
    () => ({
      audioFiles,
      selectedAudioFile,
      transcript,
      isLoading,
      error,
      refreshTrigger,
      setAudioFiles,
      setSelectedAudioFile,
      setTranscript,
      setIsLoading,
      setError,
      addAudioFile,
      updateAudioFile,
      refreshTranscript,
    }),
    [
      audioFiles,
      selectedAudioFile,
      transcript,
      isLoading,
      error,
      refreshTrigger,
      setAudioFiles,
      setSelectedAudioFile,
      setTranscript,
      setIsLoading,
      setError,
      addAudioFile,
      updateAudioFile,
      refreshTranscript,
    ]
  );

  return (
    <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
  );
};
