import React, { useState } from "react";
import { useAudio } from "../contexts/AudioContext";
import { useAudioData } from "../hooks/useAudioData";
import { getAudioStatusConfig } from "../utils/audioStatus";
import {
  formatDate,
  formatDuration,
  formatFileSize,
} from "../utils/formatters";

interface AudioTableProps {
  itemsPerPage?: number;
}

const AudioTable: React.FC<AudioTableProps> = ({ itemsPerPage = 10 }) => {
  const { selectedAudioFile, setSelectedAudioFile } = useAudio();
  const { audioFiles, isLoading } = useAudioData();
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate pagination
  const totalPages = Math.ceil(audioFiles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentFiles = audioFiles.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFileSelect = (file: any) => {
    setSelectedAudioFile(file);
  };

  const renderTranscriptStatus = (file: any) => {
    if (file.has_transcript) {
      return (
        <div className="flex items-center text-green-600">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-xs">Available</span>
        </div>
      );
    }

    if (file.status === "transcribing" || file.status === "processing") {
      return (
        <div className="flex items-center text-blue-600">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
          <span className="text-xs">
            {file.status === "transcribing"
              ? "Transcribing..."
              : "Processing..."}
          </span>
        </div>
      );
    }

    if (file.status === "uploading") {
      return (
        <div className="flex items-center text-gray-400">
          <div className="animate-pulse bg-gray-200 rounded h-3 w-16"></div>
        </div>
      );
    }

    return <span className="text-xs text-gray-400">Not available</span>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          <span className="text-gray-600">Loading audio files...</span>
        </div>
      </div>
    );
  }

  if (audioFiles.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 48 48"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.713-3.714M14 40v-4c0-1.313.253-2.566.713-3.714m0 0A10.003 10.003 0 0124 26c4.21 0 7.813 2.602 9.288 6.286"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          No audio files
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Upload your first audio file to get started with transcription and
          analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                File Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Size
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Transcript
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Uploaded
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {currentFiles.map((file, index) => {
              const statusConfig = getAudioStatusConfig(file.status);
              const isSelected = selectedAudioFile?.id === file.id;
              const isLoading =
                file.status === "uploading" || file.status === "processing";
              const showTopBorder =
                index > 0 &&
                !isSelected &&
                !(
                  selectedAudioFile &&
                  currentFiles[index - 1]?.id === selectedAudioFile.id
                );

              return (
                <tr
                  key={file.id}
                  className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                    isSelected ? "bg-blue-50 border-l-4 border-blue-500" : ""
                  } ${
                    isLoading
                      ? "bg-gradient-to-r from-gray-50 to-white animate-pulse"
                      : ""
                  } ${showTopBorder ? "border-t border-gray-200" : ""}`}
                  onClick={() => handleFileSelect(file)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          {file.status === "uploading" ||
                          file.status === "processing" ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                          ) : (
                            <svg
                              className="h-4 w-4 text-gray-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12a7.971 7.971 0 00-1.343-4.243 1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div
                          className="text-sm font-medium text-gray-900 max-w-xs truncate"
                          title={file.filename}
                        >
                          {file.filename}
                        </div>
                        <div className="text-sm text-gray-500">
                          {file.mime_type}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {file.status === "uploading" ? (
                      <div className="flex items-center">
                        <div className="animate-pulse bg-gray-200 rounded h-4 w-16"></div>
                      </div>
                    ) : (
                      formatDuration(file.duration)
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {file.status === "uploading" ? (
                      <div className="flex items-center">
                        <div className="animate-pulse bg-gray-200 rounded h-4 w-12"></div>
                      </div>
                    ) : (
                      formatFileSize(file.file_size)
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex flex-col">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full justify-center text-xs font-medium ${statusConfig.color}`}
                        >
                          {statusConfig.label}
                        </span>
                        {/* Show progress bar for processing files */}
                        {file.status === "processing" &&
                          file.processing_progress !== undefined && (
                            <div className="mt-1 w-24">
                              <div className="bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      Math.max(0, file.processing_progress)
                                    )}%`,
                                  }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-500 mt-0.5">
                                {Math.round(file.processing_progress || 0)}%
                              </span>
                            </div>
                          )}
                        {/* Show upload progress for uploading files */}
                        {file.status === "uploading" && (
                          <div className="mt-1 w-24">
                            <div className="bg-gray-200 rounded-full h-1.5">
                              <div className="bg-green-500 h-1.5 rounded-full animate-pulse"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderTranscriptStatus(file)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(file.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFileSelect(file);
                      }}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                    >
                      {isSelected ? "Selected" : "Select"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() =>
                handlePageChange(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                <span className="font-medium">
                  {Math.min(endIndex, audioFiles.length)}
                </span>{" "}
                of <span className="font-medium">{audioFiles.length}</span>{" "}
                results
              </p>
            </div>
            <div>
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Previous</span>
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  onClick={() =>
                    handlePageChange(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Next</span>
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioTable;
