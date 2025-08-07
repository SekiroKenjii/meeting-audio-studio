export interface AudioStatusConfig {
  color: string;
  label: string;
}

export enum AudioFileStatus {
  Uploading = "uploading",
  Uploaded = "uploaded",
  Processing = "processing",
  Processed = "processed",
  Transcribing = "transcribing",
  Transcribed = "transcribed",
  Completed = "completed",
  Failed = "failed",
}

export interface AudioFile {
  id: number;
  filename: string;
  status: AudioFileStatus;
  duration?: number;
  file_size?: number;
  mime_type?: string;
  has_transcript: boolean;
  processing_progress?: number;
  error?: string;
  created_at: string;
  updated_at?: string;
}

export interface TranscriptAudioFile {
  id: number;
  filename: string;
  duration?: number;
}

export interface TranscriptDiarizedSegment {
  start: number;
  end: number;
  text: string;
  speaker: string;
}

export interface TranscriptSpeaker {
  id: string;
  total_time: number;
  segment_count: number;
}

export interface TranscriptQuery {
  id: number;
  query: string;
  response: string;
  created_at: string;
}

export interface Transcript {
  id: number;
  audio_file: TranscriptAudioFile;
  full_transcript: string;
  diarized_segments: Array<TranscriptDiarizedSegment>;
  speakers: Array<TranscriptSpeaker>;
  queries: Array<TranscriptQuery>;
  confidence_score?: number;
  created_at: string;
}

export interface UploadConfig {
  allowed_mime_types: string[];
  allowed_extensions: string[];
  max_file_size_mb: number;
  max_file_size_bytes: number;
  compression_threshold_mb: number;
  compression_threshold_bytes: number;
}
