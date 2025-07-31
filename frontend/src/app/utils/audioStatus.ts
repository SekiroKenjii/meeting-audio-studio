/**
 * Audio file status configuration utility
 * Provides consistent status display configuration across components
 */

export interface StatusConfig {
  color: string;
  label: string;
}

export type AudioFileStatus =
  | "uploading"
  | "uploaded"
  | "processing"
  | "processed"
  | "transcribing"
  | "transcribed"
  | "completed"
  | "failed";

/**
 * Get status configuration for audio file status
 * @param status - The audio file status
 * @returns Configuration object with color classes and display label
 */
export const getAudioStatusConfig = (status: string): StatusConfig => {
  switch (status) {
    case "uploading":
      return { color: "bg-yellow-100 text-orange-800", label: "Uploading" };
    case "uploaded":
      return { color: "bg-yellow-100 text-yellow-800", label: "Uploaded" };
    case "processing":
      return { color: "bg-blue-100 text-blue-800", label: "Processing" };
    case "processed":
      return { color: "bg-green-100 text-green-800", label: "Processed" };
    case "transcribing":
      return { color: "bg-indigo-100 text-indigo-800", label: "Transcribing" };
    case "transcribed":
      return { color: "bg-purple-100 text-purple-800", label: "Transcribed" };
    case "completed":
      return { color: "bg-green-100 text-green-800", label: "Completed" };
    case "failed":
      return { color: "bg-red-100 text-red-800", label: "Failed" };
    default:
      return { color: "bg-gray-100 text-gray-800", label: "Unknown" };
  }
};

/**
 * Get list of all possible audio statuses
 * @returns Array of all supported status values
 */
export const getAudioStatuses = (): string[] => {
  return [
    "uploading",
    "uploaded",
    "processing",
    "processed",
    "transcribing",
    "transcribed",
    "completed",
    "failed",
  ];
};
