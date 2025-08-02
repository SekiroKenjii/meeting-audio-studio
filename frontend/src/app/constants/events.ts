export const EVENTS = {
  // Event to trigger file upload from anywhere in the app
  TRIGGER_FILE_UPLOAD: "triggerFileUpload",

  // Event to notify that a file has been successfully uploaded
  FILE_UPLOADED: "fileUploaded",

  // Event to notify that a file upload has failed
  FILE_UPLOAD_FAILED: "fileUploadFailed",

  // Event to notify that the audio processing is complete
  AUDIO_PROCESSING_COMPLETE: "audioProcessingComplete",

  // Event to notify that the audio processing has failed
  AUDIO_PROCESSING_FAILED: "audioProcessingFailed",
};

export type EventType = keyof typeof EVENTS;

// Utility function to get the event name
export const getEventName = (event: EventType): string => {
  return EVENTS[event];
};
