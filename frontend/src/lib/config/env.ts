// Environment configuration utilities
export const config = {
  // API Configuration
  apiUrl: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  apiVersion: import.meta.env.VITE_API_VERSION || "v1",

  // WebSocket Configuration
  reverbHost: import.meta.env.VITE_REVERB_HOST || "localhost",
  reverbPort: import.meta.env.VITE_REVERB_PORT || "8081",
  reverbScheme: import.meta.env.VITE_REVERB_SCHEME || "http",
  pusherAppKey: import.meta.env.VITE_PUSHER_APP_KEY || "local",

  // Environment flags
  isDemoMode: import.meta.env.VITE_DEMO_MODE === "true",
  isGitHubPages: import.meta.env.GITHUB_PAGES === "true",
  showDemoNotice: import.meta.env.VITE_SHOW_DEMO_NOTICE === "true",
  baseUrl: import.meta.env.VITE_BASE_URL || "/",

  // Development flags
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
} as const;

// Demo mode utilities
export const demo = {
  // Check if we should use demo data
  isEnabled: config.isDemoMode || config.isGitHubPages,

  // Check if API is likely to be unavailable
  isApiUnavailable: () => {
    const url = config.apiUrl.toLowerCase();
    return (
      config.isGitHubPages &&
      (url.includes("localhost") ||
        url.includes("127.0.0.1") ||
        url.includes("your-backend-api.com") ||
        url.includes("example.com"))
    );
  },

  // Demo message for users
  getMessage: () => {
    if (config.showDemoNotice || demo.isApiUnavailable()) {
      return "Demo Version: This is a showcase deployment with mock data. Backend features are simulated.";
    }
    if (config.isDemoMode && config.isGitHubPages) {
      return "GitHub Pages Demo: Some features use mock data for demonstration.";
    }
    if (config.isDemoMode) {
      return "Demo mode enabled: Using mock data for testing.";
    }
    return null;
  },

  // Sample mock data
  mockData: {
    audioFiles: [
      {
        id: 1,
        filename: "Sample Meeting Recording.mp3",
        file_size: 15728640, // 15MB
        mime_type: "audio/mpeg",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: "processed",
        duration: 1845, // 30 minutes 45 seconds
        has_transcript: true,
        processing_progress: 100,
      },
      {
        id: 2,
        filename: "Team Standup - Feb 2025.wav",
        file_size: 8388608, // 8MB
        mime_type: "audio/wav",
        created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        updated_at: new Date(Date.now() - 86400000).toISOString(),
        status: "processing",
        duration: 900, // 15 minutes
        has_transcript: false,
        processing_progress: 67,
      },
      {
        id: 3,
        filename: "Client Call - Product Demo.m4a",
        file_size: 25165824, // 24MB
        mime_type: "audio/x-m4a",
        created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        updated_at: new Date(Date.now() - 172800000).toISOString(),
        status: "processed",
        duration: 2700, // 45 minutes
        has_transcript: true,
        processing_progress: 100,
      },
      {
        id: 4,
        filename: "Engineering Review.mp3",
        file_size: 12582912, // 12MB
        mime_type: "audio/mpeg",
        created_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        updated_at: new Date(Date.now() - 259200000).toISOString(),
        status: "failed",
        duration: 0,
        has_transcript: false,
        processing_progress: 0,
        error: "Audio format not supported or file corrupted",
      },
    ],

    transcripts: [
      {
        id: 1,
        audio_file: {
          id: 1,
          filename: "Sample Meeting Recording.mp3",
          duration: 1845,
        },
        full_transcript:
          "This is a sample transcript from a demo meeting where we discussed project milestones, team responsibilities, and upcoming deadlines. The conversation covered various technical aspects of the implementation and next steps for the project.",
        diarized_segments: [
          {
            start: 0,
            end: 5.5,
            speaker: "John Doe",
            text: "Good morning everyone, let's start today's meeting.",
          },
          {
            start: 5.5,
            end: 12.3,
            speaker: "Jane Smith",
            text: "Thanks John. I'd like to review the progress on our Q1 milestones.",
          },
          {
            start: 12.3,
            end: 18.7,
            speaker: "Mike Johnson",
            text: "Sure, we've completed about 75% of the planned features so far.",
          },
          {
            start: 18.7,
            end: 25.2,
            speaker: "John Doe",
            text: "That's great progress. Let's discuss the remaining 25% and prioritize them.",
          },
          {
            start: 25.2,
            end: 32.8,
            speaker: "Jane Smith",
            text: "I think we should focus on the user interface improvements first, as they impact user experience directly.",
          },
          {
            start: 32.8,
            end: 40.1,
            speaker: "Mike Johnson",
            text: "Agreed. The backend optimizations can wait until the next sprint.",
          },
        ],
        speakers: [
          { id: "speaker-1", total_time: 15.4, segment_count: 2 },
          { id: "speaker-2", total_time: 19.1, segment_count: 2 },
          { id: "speaker-3", total_time: 14.6, segment_count: 2 },
        ],
        queries: [
          {
            id: 1,
            query: "What were the main topics discussed?",
            response:
              "The main topics were Q1 milestones progress (75% completion), prioritization of remaining work, and focus on user interface improvements over backend optimizations.",
            created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          },
        ],
        confidence_score: 0.92,
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        audio_file: {
          id: 3,
          filename: "Client Call - Product Demo.m4a",
          duration: 2700,
        },
        full_transcript:
          "This is a sample transcript from a client product demonstration call. We walked through the key features of our platform, discussed implementation timeline, and addressed technical questions from the client team.",
        diarized_segments: [
          {
            start: 0,
            end: 8.2,
            speaker: "Sarah Wilson",
            text: "Good afternoon everyone, thank you for joining our product demo today.",
          },
          {
            start: 8.2,
            end: 15.8,
            speaker: "Client Rep",
            text: "Thanks Sarah. We're excited to see what you've built for us.",
          },
          {
            start: 15.8,
            end: 24.5,
            speaker: "Sarah Wilson",
            text: "Let me start by showing you the dashboard and main navigation features.",
          },
          {
            start: 24.5,
            end: 32.1,
            speaker: "Tech Lead",
            text: "The architecture supports real-time data processing with 99.9% uptime.",
          },
          {
            start: 32.1,
            end: 39.7,
            speaker: "Client Rep",
            text: "That's impressive. How does the system handle peak loads during busy periods?",
          },
          {
            start: 39.7,
            end: 48.3,
            speaker: "Tech Lead",
            text: "We use auto-scaling infrastructure that can handle 10x normal traffic without degradation.",
          },
        ],
        speakers: [
          { id: "speaker-1", total_time: 32.7, segment_count: 2 },
          { id: "speaker-2", total_time: 24.0, segment_count: 2 },
          { id: "speaker-3", total_time: 16.4, segment_count: 2 },
        ],
        queries: [
          {
            id: 1,
            query: "What features were demonstrated?",
            response:
              "The demo covered dashboard navigation, real-time data processing capabilities, auto-scaling infrastructure, and system performance metrics with 99.9% uptime guarantee.",
            created_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
          },
          {
            id: 2,
            query: "What questions did the client ask?",
            response:
              "The client asked about peak load handling and system scalability during busy periods.",
            created_at: new Date(Date.now() - 5400000).toISOString(), // 1.5 hours ago
          },
        ],
        confidence_score: 0.88,
        created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      },
    ],

    analytics: {
      totalFiles: 24,
      totalDuration: 86400, // 24 hours in seconds
      averageFileSize: 18874368, // ~18MB
      processingStats: {
        processed: 18,
        processing: 3,
        failed: 3,
      },
      monthlyStats: [
        { month: "Jan 2025", files: 8, duration: 28800 },
        { month: "Feb 2025", files: 12, duration: 43200 },
        { month: "Mar 2025", files: 4, duration: 14400 },
      ],
      topSpeakers: [
        { name: "John Doe", appearances: 15, totalDuration: 25200 },
        { name: "Jane Smith", appearances: 12, totalDuration: 18900 },
        { name: "Mike Johnson", appearances: 10, totalDuration: 14400 },
      ],
    },
  },
} as const;

// API utilities
export const api = {
  // Get full API URL
  getUrl: (endpoint: string) => {
    if (demo.isApiUnavailable()) {
      console.warn("Demo mode: API calls will use mock data");
    }
    return `${config.apiUrl}/${endpoint}`;
  },

  // Check if API should be called
  shouldUseRealAPI: () => {
    return !demo.isEnabled && !demo.isApiUnavailable();
  },

  // Mock API response helper
  mockResponse: <T>(data: T, delay = 1000): Promise<T> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(data), delay);
    });
  },

  // Get mock data based on endpoint
  getMockResponse: (url: string, method: string = "GET") => {
    const endpoint = url.replace(config.apiUrl, "").replace(/^\/+/, "");

    console.log(`Demo Mode: Mocking ${method} ${endpoint}`);

    // Audio files endpoints (handle both with and without v1 prefix)
    if (
      endpoint === "v1/audio-files" ||
      endpoint === "audio-files" ||
      endpoint.startsWith("v1/audio-files?") ||
      endpoint.startsWith("audio-files?")
    ) {
      return {
        success: true,
        data: demo.mockData.audioFiles,
        message: "Audio files retrieved successfully",
      };
    }

    // Upload configuration endpoint
    if (
      endpoint === "v1/audio-files/config" ||
      endpoint === "audio-files/config"
    ) {
      console.log("Mocking upload configuration");
      return {
        success: true,
        data: {
          max_file_size_bytes: 1073741824, // 1GB
          max_file_size_mb: 1024,
          max_chunk_size_bytes: 52428800, // 50MB
          max_chunk_size_mb: 50,
          allowed_extensions: [".mp3", ".wav", ".m4a", ".mp4", ".flac", ".aac"],
          allowed_mime_types: [
            "audio/mpeg",
            "audio/wav",
            "audio/mp4",
            "audio/x-m4a",
            "audio/flac",
            "audio/aac",
            "video/mp4",
          ],
          chunk_upload_threshold_bytes: 20971520, // 20MB
          chunk_upload_threshold_mb: 20,
          supported_formats: ["MP3", "WAV", "M4A", "MP4", "FLAC", "AAC"],
          processing_time_estimate: "2-5 minutes per hour of audio",
        },
        message: "Upload configuration retrieved successfully",
      };
    }

    if (/^(v1\/)?audio-files\/\d+$/.exec(endpoint)) {
      const parts = endpoint.split("/");
      const id = parseInt(parts[parts.length - 1], 10); // Parse as number
      const audioFile = demo.mockData.audioFiles.find((file) => file.id === id);
      return {
        success: !!audioFile,
        data: audioFile,
        message: audioFile
          ? "Audio file retrieved successfully"
          : "Audio file not found",
      };
    }

    // Transcripts endpoints
    if (
      endpoint === "v1/transcripts" ||
      endpoint === "transcripts" ||
      endpoint.startsWith("v1/transcripts?") ||
      endpoint.startsWith("transcripts?")
    ) {
      return {
        success: true,
        data: demo.mockData.transcripts,
        message: "Transcripts retrieved successfully",
      };
    }

    if (/^(v1\/)?transcripts\/\d+$/.exec(endpoint)) {
      const parts = endpoint.split("/");
      const id = parts[parts.length - 1];
      const transcript = demo.mockData.transcripts.find(
        (transcript) => transcript.id === parseInt(id)
      );
      return {
        success: !!transcript,
        data: transcript,
        message: transcript
          ? "Transcript retrieved successfully"
          : "Transcript not found",
      };
    }

    if (/^(v1\/)?audio-files\/\d+\/transcript$/.exec(endpoint)) {
      const parts = endpoint.split("/");
      const audioFileId = parseInt(parts[parts.length - 2], 10); // Parse as number
      const transcript = demo.mockData.transcripts.find(
        (transcript) => transcript.audio_file.id === audioFileId
      );
      return {
        success: !!transcript,
        data: transcript,
        message: transcript
          ? "Transcript retrieved successfully"
          : "Transcript not found",
      };
    }

    // Analytics endpoints
    if (
      endpoint === "v1/analytics" ||
      endpoint === "analytics" ||
      endpoint === "v1/analytics/dashboard" ||
      endpoint === "analytics/dashboard"
    ) {
      return {
        success: true,
        data: demo.mockData.analytics,
        message: "Analytics retrieved successfully",
      };
    }

    // Upload simulation
    if (
      (endpoint === "v1/audio-files" || endpoint === "audio-files") &&
      method === "POST"
    ) {
      const newFile = {
        id: Date.now(), // Use timestamp as number ID
        filename: "Demo Upload.mp3",
        file_size: 10485760, // 10MB
        mime_type: "audio/mpeg",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: "processing",
        duration: 0,
        has_transcript: false,
        processing_progress: 0,
      };
      return {
        success: true,
        data: newFile,
        message: "File uploaded successfully",
      };
    }

    // Default response
    console.warn(`Demo Mode: No mock data available for endpoint: ${endpoint}`);
    return {
      message: "Demo mode: No mock data available for this endpoint",
      endpoint,
    };
  },
} as const;

export default config;
