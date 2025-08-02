import React from "react";
import { ROUTES } from "../constants/routes";
import { useAudio } from "../hooks";
import { useAudioData } from "../hooks/useAudioData";
import { AudioFile } from "../types/audio";
import { getAudioStatusConfig } from "../utils/audioStatus";
import {
  formatDate,
  formatDuration,
  formatFileSize,
} from "../utils/formatters";

interface AudioListProps {
  showAll?: boolean;
}

const AudioList: React.FC<AudioListProps> = ({ showAll = false }) => {
  const { selectedAudioFile, setSelectedAudioFile } = useAudio();
  const { audioFiles, isLoading } = useAudioData();

  const handleFileSelect = (file: any) => {
    setSelectedAudioFile(file);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          <span className="text-gray-600">Loading audio files...</span>
        </div>
      </div>
    );
  }

  if (audioFiles.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-gray-400"
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
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No audio files yet
        </h3>
        <p className="text-gray-600">
          Upload your first audio file to get started with transcription and
          analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {(showAll ? audioFiles : audioFiles.slice(0, 3)).map(
        (file: AudioFile) => {
          const statusConfig = getAudioStatusConfig(file.status);
          const isSelected = selectedAudioFile?.id === file.id;

          return (
            <div key={file.id} className="relative">
              <button
                type="button"
                className={`
                w-full text-left p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-medium
                ${
                  isSelected
                    ? "border-gray-900 bg-gray-50 shadow-medium"
                    : "border-gray-200 hover:border-gray-300"
                }
              `}
                onClick={() => handleFileSelect(file)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4
                        className="text-sm font-medium text-gray-900 truncate"
                        title={file.filename}
                      >
                        {file.filename}
                      </h4>
                      {file.has_transcript && (
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>Transcript</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className="flex items-center space-x-1">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>{formatDuration(file.duration)}</span>
                      </span>

                      <span className="flex items-center space-x-1">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                        <span>{formatFileSize(file.file_size)}</span>
                      </span>

                      <span className="flex items-center space-x-1">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span>{formatDate(file.created_at)}</span>
                      </span>
                    </div>
                  </div>

                  <div className="ml-4 flex items-center space-x-2">
                    {file.status === "processing" && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                    )}
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${statusConfig.color}`}
                    >
                      {statusConfig.label}
                    </span>
                  </div>
                </div>
              </button>

              {isSelected && (
                <div className="absolute -right-2 -top-2 w-4 h-4 bg-gray-900 rounded-full flex items-center justify-center z-20 pointer-events-none">
                  <svg
                    className="w-2.5 h-2.5 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
          );
        }
      )}

      {!showAll && audioFiles.length > 3 && (
        <div className="text-center pt-3">
          <a
            href={ROUTES.DASHBOARD_FILES}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center space-x-1"
          >
            <span>View all {audioFiles.length} files</span>
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
};

export default AudioList;
