import { ToastType, Toast } from "../types/toast";

// Global reference to toast functions
let globalToastFunctions: {
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
} | null = null;

/**
 * Sets the global toast functions (called by ToastInitializer)
 * @internal This should only be called by the ToastInitializer component
 */
export const setGlobalToastFunctions = (
  functions: typeof globalToastFunctions
) => {
  globalToastFunctions = functions;
};

/**
 * Toast Service - Provides a clean API for showing toast notifications
 * throughout the application without needing to import context directly
 */
export class ToastService {
  /**
   * Shows a success toast notification
   * @param title - The main message to display
   * @param message - Optional secondary message
   */
  static success(title: string, message?: string): void {
    if (!globalToastFunctions) {
      console.warn(
        "Toast service not initialized. Make sure ToastProvider is setup."
      );
      return;
    }
    globalToastFunctions.showSuccess(title, message);
  }

  /**
   * Shows an error toast notification
   * @param title - The main message to display
   * @param message - Optional secondary message
   */
  static error(title: string, message?: string): void {
    if (!globalToastFunctions) {
      console.warn(
        "Toast service not initialized. Make sure ToastProvider is setup."
      );
      return;
    }
    globalToastFunctions.showError(title, message);
  }

  /**
   * Shows an info toast notification
   * @param title - The main message to display
   * @param message - Optional secondary message
   */
  static info(title: string, message?: string): void {
    if (!globalToastFunctions) {
      console.warn(
        "Toast service not initialized. Make sure ToastProvider is setup."
      );
      return;
    }
    globalToastFunctions.showInfo(title, message);
  }

  /**
   * Shows a warning toast notification
   * @param title - The main message to display
   * @param message - Optional secondary message
   */
  static warning(title: string, message?: string): void {
    if (!globalToastFunctions) {
      console.warn(
        "Toast service not initialized. Make sure ToastProvider is setup."
      );
      return;
    }
    globalToastFunctions.showWarning(title, message);
  }

  /**
   * Shows a loading toast notification (using info style with semantic meaning for loading states)
   * @param title - The main message to display
   * @param message - Optional secondary message
   */
  static loading(title: string, message?: string): void {
    if (!globalToastFunctions) {
      console.warn(
        "Toast service not initialized. Make sure ToastProvider is setup."
      );
      return;
    }
    // Use info style but with semantic intent for loading operations
    globalToastFunctions.showInfo(title, message);
  }

  /**
   * Removes a specific toast by ID
   * @param id - The ID of the toast to remove
   */
  static remove(id: string): void {
    if (!globalToastFunctions) {
      console.warn(
        "Toast service not initialized. Make sure ToastProvider is setup."
      );
      return;
    }
    globalToastFunctions.removeToast(id);
  }

  /**
   * Shows a toast with custom configuration
   * @param title - The main message to display
   * @param message - Optional secondary message
   * @param type - The type of toast
   * @param duration - Duration in milliseconds
   * @param persistent - Whether the toast should persist
   */
  static show(
    title: string,
    message?: string,
    type: ToastType = "info",
    duration?: number,
    persistent?: boolean
  ): void {
    if (!globalToastFunctions) {
      console.warn(
        "Toast service not initialized. Make sure ToastProvider is setup."
      );
      return;
    }
    globalToastFunctions.addToast({
      type,
      title,
      message,
      duration,
      persistent,
    });
  }

  /**
   * Promise wrapper that shows loading, success, and error toasts
   * @param promise - The promise to execute
   * @param options - Configuration options
   */
  static async promise<T>(
    promise: Promise<T>,
    options: {
      loading?: { title: string; message?: string };
      success?:
        | { title: string; message?: string }
        | ((data: T) => { title: string; message?: string });
      error?:
        | { title: string; message?: string }
        | ((error: any) => { title: string; message?: string });
    }
  ): Promise<T> {
    const { loading, success, error } = options;

    // Show loading toast
    if (loading) {
      this.loading(loading.title, loading.message);
    }

    try {
      const result = await promise;

      // Show success toast
      if (success) {
        const config =
          typeof success === "function" ? success(result) : success;
        this.success(config.title, config.message);
      }

      return result;
    } catch (err) {
      // Show error toast
      if (error) {
        const config = typeof error === "function" ? error(err) : error;
        this.error(config.title, config.message);
      }

      throw err;
    }
  }

  /**
   * Utility method to handle API responses with automatic toast notifications
   * @param apiCall - Function that returns a promise
   * @param options - Configuration options
   */
  static async handleApiCall<T>(
    apiCall: () => Promise<T>,
    options: {
      successMessage?:
        | { title: string; message?: string }
        | ((data: T) => { title: string; message?: string });
      errorMessage?:
        | { title: string; message?: string }
        | ((error: any) => { title: string; message?: string });
      loadingMessage?: { title: string; message?: string };
      showSuccess?: boolean;
      showError?: boolean;
    } = {}
  ): Promise<T> {
    const {
      successMessage,
      errorMessage = { title: "Error", message: "An error occurred" },
      loadingMessage,
      showSuccess = true,
      showError = true,
    } = options;

    try {
      if (loadingMessage) {
        this.loading(loadingMessage.title, loadingMessage.message);
      }

      const result = await apiCall();

      if (showSuccess && successMessage) {
        const config =
          typeof successMessage === "function"
            ? successMessage(result)
            : successMessage;
        this.success(config.title, config.message);
      }

      return result;
    } catch (error) {
      if (showError) {
        const config =
          typeof errorMessage === "function"
            ? errorMessage(error)
            : errorMessage;
        this.error(config.title, config.message);
      }
      throw error;
    }
  }

  // Convenience methods for simple messages (backward compatibility)
  /**
   * Shows a simple success message
   * @param message - The message to display as title
   */
  static successMessage(message: string): void {
    this.success(message);
  }

  /**
   * Shows a simple error message
   * @param message - The message to display as title
   */
  static errorMessage(message: string): void {
    this.error(message);
  }

  /**
   * Shows a simple info message
   * @param message - The message to display as title
   */
  static infoMessage(message: string): void {
    this.info(message);
  }

  /**
   * Shows a simple warning message
   * @param message - The message to display as title
   */
  static warningMessage(message: string): void {
    this.warning(message);
  }
}

// Export default for convenience
export default ToastService;
