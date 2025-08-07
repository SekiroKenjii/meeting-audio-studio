/**
 * Audio file status configuration utility
 * Provides consistent status display configuration across components
 */

import { AudioFileStatus, AudioStatusConfig } from "../types/audio";
/**
 * Get status configuration for audio file status
 * @param status - The audio file status
 * @returns Configuration object with color classes and display label
 */
export const getAudioStatusConfig = (
  status: AudioFileStatus
): AudioStatusConfig => {
  switch (status) {
    case AudioFileStatus.Uploading:
      return { color: "bg-yellow-100 text-orange-800", label: "Uploading" };
    case AudioFileStatus.Uploaded:
      return { color: "bg-yellow-100 text-yellow-800", label: "Uploaded" };
    case AudioFileStatus.Processing:
      return { color: "bg-blue-100 text-blue-800", label: "Processing" };
    case AudioFileStatus.Processed:
      return { color: "bg-green-100 text-green-800", label: "Processed" };
    case AudioFileStatus.Transcribing:
      return { color: "bg-indigo-100 text-indigo-800", label: "Transcribing" };
    case AudioFileStatus.Transcribed:
      return { color: "bg-purple-100 text-purple-800", label: "Transcribed" };
    case AudioFileStatus.Completed:
      return { color: "bg-green-100 text-green-800", label: "Completed" };
    case AudioFileStatus.Failed:
      return { color: "bg-red-100 text-red-800", label: "Failed" };
    default:
      return { color: "bg-gray-100 text-gray-800", label: "Unknown" };
  }
};

export const getAudioFileStatus = (status: string): AudioFileStatus => {
  return (
    Object.values(AudioFileStatus).find((x) => x === status) ||
    AudioFileStatus.Failed
  );
};
