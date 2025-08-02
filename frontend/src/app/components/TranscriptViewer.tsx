import React, { useState } from "react";
import { api } from "../../sdk/services";
import { useAudio } from "../hooks";
import { useStrictModeEffect } from "../hooks/useStrictModeEffect";
import { TranscriptDiarizedSegment, TranscriptQuery } from "../types/audio";

const TranscriptViewer: React.FC = () => {
  const { selectedAudioFile, transcript, setTranscript, setError } = useAudio();
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryResult, setQueryResult] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"diarized" | "full" | "queries">(
    "diarized"
  );

  useStrictModeEffect(() => {
    if (selectedAudioFile?.has_transcript) {
      loadTranscript();
    } else {
      setTranscript(null);
    }
  }, [selectedAudioFile, setTranscript]);

  const loadTranscript = async () => {
    if (!selectedAudioFile) return;

    setIsLoading(true);
    try {
      const request = api.audioFiles.getTranscriptByAudioFile(
        selectedAudioFile.id
      );
      request.catch((_) => {
        setError("Failed to load transcript");
      });
      const response = await request;
      if (response.success && response.data) {
        setTranscript(response.data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transcript || !query.trim()) return;

    setIsQuerying(true);
    setQueryResult(null);

    try {
      const request = api.transcripts.createTranscript(
        transcript.id,
        query.trim()
      );
      request.catch((_) => {
        setError("Failed to process query");
      });
      const response = await request;
      if (response.success && response.data) {
        setQueryResult(response.data.response);
        // Update transcript with new query
        setTranscript({
          ...transcript,
          queries: [...transcript.queries, response.data],
        });
      }
    } finally {
      setIsQuerying(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!selectedAudioFile) {
    return (
      <div className="text-center py-12">
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
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No audio file selected
        </h3>
        <p className="text-gray-600">
          Choose an audio file from the list to view its transcript and
          analysis.
        </p>
      </div>
    );
  }

  if (!selectedAudioFile.has_transcript) {
    return (
      <div className="text-center py-12">
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {selectedAudioFile.filename}
        </h3>
        <p className="text-gray-600 mb-4">
          {selectedAudioFile.status === "failed"
            ? "Processing failed. Please try uploading the file again."
            : selectedAudioFile.status === "processing"
            ? "Audio is being processed. Transcript will be available shortly."
            : "Transcript not yet available for this file."}
        </p>
        {selectedAudioFile.status === "processing" && (
          <div className="inline-flex items-center space-x-2 text-sm text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
            <span>Processing audio...</span>
          </div>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          <span className="text-gray-600">Loading transcript...</span>
        </div>
      </div>
    );
  }

  if (!transcript) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.982 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Failed to load transcript
        </h3>
        <p className="text-gray-600">
          There was an error loading the transcript for this file.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* File Info Header */}
      <div className="border-b border-gray-200 pb-4">
        <h4 className="text-lg font-semibold text-gray-900 mb-2">
          {selectedAudioFile.filename}
        </h4>
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span className="flex items-center space-x-1">
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
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>Transcribed {formatDate(transcript.created_at)}</span>
          </span>
          {transcript.confidence_score && (
            <span className="flex items-center space-x-1">
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
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <span>
                {Math.round(transcript.confidence_score * 100)}% confidence
              </span>
            </span>
          )}
        </div>
      </div>

      {/* AI Query Section */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h4 className="text-base font-semibold text-gray-900 mb-3">
          Ask questions about this transcript
        </h4>
        <form onSubmit={handleQuery} className="space-y-3">
          <div className="flex space-x-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What were the main topics discussed?"
              className="flex-1 input"
              disabled={isQuerying}
            />
            <button
              type="submit"
              disabled={isQuerying || !query.trim()}
              className="btn btn-primary px-6"
            >
              {isQuerying ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Analyzing...</span>
                </div>
              ) : (
                "Ask AI"
              )}
            </button>
          </div>
        </form>

        {queryResult && (
          <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-4 h-4 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h5 className="text-sm font-medium text-gray-900 mb-1">
                  AI Analysis
                </h5>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {queryResult}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div>
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("diarized")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "diarized"
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Speaker Diarization
            </button>
            <button
              onClick={() => setActiveTab("full")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "full"
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Full Transcript
            </button>
            {transcript.queries.length > 0 && (
              <button
                onClick={() => setActiveTab("queries")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "queries"
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Previous Queries ({transcript.queries.length})
              </button>
            )}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === "diarized" && (
            <div className="space-y-4">
              {transcript.diarized_segments.map(
                (segment: TranscriptDiarizedSegment, index: number) => (
                  <div
                    key={`${segment.speaker}-${segment.start}-${index}`}
                    className="bg-gray-50 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-700">
                            {segment.speaker.replace("Speaker ", "")}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {segment.speaker}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 font-mono">
                        {formatTime(segment.start)} - {formatTime(segment.end)}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {segment.text}
                    </p>
                  </div>
                )
              )}
            </div>
          )}

          {activeTab === "full" && (
            <div className="bg-gray-50 rounded-lg p-6">
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                {transcript.full_transcript}
              </p>
            </div>
          )}

          {activeTab === "queries" && transcript.queries.length > 0 && (
            <div className="space-y-4">
              {transcript.queries.map((q: TranscriptQuery) => (
                <div
                  key={q.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="space-y-3">
                    <div>
                      <h6 className="text-sm font-medium text-gray-900 mb-1">
                        Question
                      </h6>
                      <p className="text-gray-700 text-sm">{q.query}</p>
                    </div>
                    <div>
                      <h6 className="text-sm font-medium text-gray-900 mb-1">
                        AI Response
                      </h6>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {q.response}
                      </p>
                    </div>
                    <div className="text-xs text-gray-500">
                      Asked on {formatDate(q.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TranscriptViewer;
