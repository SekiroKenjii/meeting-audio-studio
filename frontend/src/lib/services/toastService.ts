import { ToastType, Toast } from "../types/toast";

// Global reference to toast functions
let globalToastFunctions: {
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
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
  private static readonly _toastNotInitWarning = () => {
    console.warn(
      "Toast service not initialized. Make sure ToastProvider is setup."
    );
  };

  /**
   * Shows a success toast notification
   * @param title - The main message to display
   * @param message - Optional secondary message
   * @param duration - Optional duration in milliseconds
   */
  static success(title: string, message?: string, duration?: number): void {
    if (!globalToastFunctions) {
      this._toastNotInitWarning();
      return;
    }
    globalToastFunctions.addToast({
      type: ToastType.Success,
      title,
      message,
      duration: duration || 4000,
    });
  }

  /**
   * Shows an error toast notification
   * @param title - The main message to display
   * @param message - Optional secondary message
   * @param duration - Optional duration in milliseconds
   */
  static error(title: string, message?: string, duration?: number): void {
    if (!globalToastFunctions) {
      this._toastNotInitWarning();
      return;
    }
    globalToastFunctions.addToast({
      type: ToastType.Error,
      title,
      message,
      duration: duration || 8000,
    });
  }

  /**
   * Shows an info toast notification
   * @param title - The main message to display
   * @param message - Optional secondary message
   * @param duration - Optional duration in milliseconds
   */
  static info(title: string, message?: string, duration?: number): void {
    if (!globalToastFunctions) {
      this._toastNotInitWarning();
      return;
    }
    globalToastFunctions.addToast({
      type: ToastType.Info,
      title,
      message,
      duration: duration || 4000,
    });
  }

  /**
   * Shows a warning toast notification
   * @param title - The main message to display
   * @param message - Optional secondary message
   * @param duration - Optional duration in milliseconds
   */
  static warning(title: string, message?: string, duration?: number): void {
    if (!globalToastFunctions) {
      this._toastNotInitWarning();
      return;
    }
    globalToastFunctions.addToast({
      type: ToastType.Warning,
      title,
      message,
      duration: duration || 6000,
    });
  }

  /**
   * Shows a loading toast notification (using info style with semantic meaning for loading states)
   * @param title - The main message to display
   * @param message - Optional secondary message
   * @param duration - Optional duration in milliseconds (defaults to persistent if not specified)
   */
  static loading(title: string, message?: string, duration?: number): void {
    if (!globalToastFunctions) {
      this._toastNotInitWarning();
      return;
    }
    // Loading toasts are typically persistent unless duration is explicitly set
    globalToastFunctions.addToast({
      type: ToastType.Info,
      title,
      message,
      duration: duration,
      persistent: duration === undefined, // Make persistent if no duration specified
    });
  }

  /**
   * Removes a specific toast by ID
   * @param id - The ID of the toast to remove
   */
  static remove(id: string): void {
    if (!globalToastFunctions) {
      this._toastNotInitWarning();
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
    type: ToastType = ToastType.Info,
    duration?: number,
    persistent?: boolean
  ): void {
    if (!globalToastFunctions) {
      this._toastNotInitWarning();
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
}

// Export default for convenience
export default ToastService;
