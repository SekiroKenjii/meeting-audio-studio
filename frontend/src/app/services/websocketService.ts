import Echo from "laravel-echo";
import Pusher from "pusher-js";

// Make Pusher available globally for Laravel Echo
(window as any).Pusher = Pusher;

export interface AudioFileStatusUpdate {
  id: number;
  filename: string;
  status: string;
  processing_progress: number;
  error?: string;
  duration?: number;
  file_size: number;
  created_at: string;
  updated_at: string;
}

export type AudioFileStatusCallback = (update: AudioFileStatusUpdate) => void;

class WebSocketService {
  private echo: Echo<any> | null = null;
  private readonly listeners: Map<string, AudioFileStatusCallback[]> =
    new Map();
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private reconnectTimer: NodeJS.Timeout | null = null;

  private isInitialized = false;
  private isInitializing = false;

  /**
   * Initialize the WebSocket connection
   */
  public initialize(): void {
    if (this.isInitialized || this.isInitializing) {
      console.log("WebSocket already initialized or initializing");
      return;
    }

    try {
      this.isInitializing = true;

      // Get configuration from environment variables
      const host = import.meta.env.VITE_REVERB_HOST || "localhost";
      const port = import.meta.env.VITE_REVERB_PORT || "8080";
      const scheme = import.meta.env.VITE_REVERB_SCHEME || "http";
      const appKey = import.meta.env.VITE_PUSHER_APP_KEY || "local";

      this.echo = new Echo({
        broadcaster: "reverb",
        key: appKey,
        wsHost: host,
        wsPort: port,
        wssPort: port,
        forceTLS: scheme === "https",
        enabledTransports: ["ws", "wss"],
        disableStats: true,
        cluster: "mt1",
      });

      // Listen for connection events
      this.echo.connector.pusher.connection.bind("connected", () => {
        console.log("WebSocket connected");
        this.resetReconnectionState();
      });

      this.echo.connector.pusher.connection.bind("disconnected", () => {
        console.log("WebSocket disconnected");
        this.handleReconnection();
      });

      this.echo.connector.pusher.connection.bind("error", (error: any) => {
        console.error("WebSocket error:", error);
        this.handleReconnection();
      });

      // Subscribe to audio files channel
      this.subscribeToAudioFiles();

      this.isInitialized = true;
      this.isInitializing = false;
      console.log("WebSocket service initialized");
    } catch (error) {
      console.error("Failed to initialize WebSocket:", error);
      this.isInitializing = false;
      this.handleReconnection();
    }
  }

  /**
   * Subscribe to audio files status updates
   */
  private subscribeToAudioFiles(): void {
    if (!this.echo) return;

    this.echo
      .channel("audio-files")
      .listen(".audio.status.updated", (data: AudioFileStatusUpdate) => {
        setTimeout(() => {
          this.notifyListeners("audio.status.updated", data);
        }, 2000);
      });
  }

  /**
   * Reset reconnection state when successfully connected
   */
  private resetReconnectionState(): void {
    this.reconnectAttempts = 0;
    this.reconnectDelay = 1000;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnection(): void {
    // Clear any existing reconnection timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnection attempts reached");
      return;
    }

    // Don't reconnect if we're already connected or trying to reconnect
    if (this.isConnected() || this.reconnectTimer) {
      return;
    }

    this.reconnectTimer = setTimeout(() => {
      console.log(
        `Attempting to reconnect... (${this.reconnectAttempts + 1}/${
          this.maxReconnectAttempts
        })`
      );
      this.reconnectAttempts++;
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000); // Cap at 30 seconds

      // Only disconnect and reinitialize if we're not already connected
      if (!this.isConnected()) {
        this.disconnect();
        this.initialize();
      }

      this.reconnectTimer = null;
    }, this.reconnectDelay);
  }

  /**
   * Add listener for audio file status updates
   */
  public onAudioFileStatusUpdate(
    callback: AudioFileStatusCallback
  ): () => void {
    const eventType = "audio.status.updated";

    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }

    this.listeners.get(eventType)!.push(callback);

    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(eventType);
      if (eventListeners) {
        const index = eventListeners.indexOf(callback);
        if (index > -1) {
          eventListeners.splice(index, 1);
        }
      }
    };
  }

  /**
   * Notify all listeners for a specific event
   */
  private notifyListeners(
    eventType: string,
    data: AudioFileStatusUpdate
  ): void {
    const eventListeners = this.listeners.get(eventType);
    if (eventListeners) {
      eventListeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error("Error in WebSocket listener callback:", error);
        }
      });
    }
  }

  /**
   * Disconnect from WebSocket
   */
  public disconnect(): void {
    // Clear reconnection timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.echo) {
      try {
        this.echo.disconnect();
      } catch (error) {
        console.warn("Error disconnecting WebSocket:", error);
      }
      this.echo = null;
    }
    this.isInitialized = false;
    this.isInitializing = false;
    this.listeners.clear();
    console.log("WebSocket service disconnected");
  }

  /**
   * Get connection status
   */
  public isConnected(): boolean {
    return this.echo?.connector?.pusher?.connection?.state === "connected";
  }

  /**
   * Get current connection state
   */
  public getConnectionState(): string {
    return this.echo?.connector?.pusher?.connection?.state || "disconnected";
  }
}

// Create and export singleton instance
export const websocketService = new WebSocketService();

// Initialize on import
websocketService.initialize();

export default websocketService;
