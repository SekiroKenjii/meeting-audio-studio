import { useCallback, useRef, useState } from "react";
import ToastService from "../services/toastService";

interface UseAsyncOperationOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
  errorDescription?: string;
}

interface AsyncOperationState {
  isLoading: boolean;
  error: string | null;
}

/**
 * Custom hook for handling async operations with loading, error, and toast management
 */
export const useAsyncOperation = <T = any>(
  options: UseAsyncOperationOptions<T> = {}
) => {
  const {
    onSuccess,
    onError,
    showSuccessToast = false,
    showErrorToast = true,
    successMessage = "Operation completed successfully",
    errorMessage = "Operation failed",
    errorDescription = "Please try again or contact support if the problem persists.",
  } = options;

  const [state, setState] = useState<AsyncOperationState>({
    isLoading: false,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(
    async <TResult = T>(
      asyncFn: () => Promise<TResult>,
      overrideOptions?: Partial<UseAsyncOperationOptions<TResult>>
    ): Promise<TResult | null> => {
      // Cancel any previous operation
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this operation
      abortControllerRef.current = new AbortController();
      const currentController = abortControllerRef.current;

      setState({ isLoading: true, error: null });

      try {
        const result = await asyncFn();

        // Check if this operation was cancelled
        if (currentController.signal.aborted) {
          return null;
        }

        // Handle success
        onSuccess?.(result as unknown as T);
        overrideOptions?.onSuccess?.(result);

        if (showSuccessToast || overrideOptions?.showSuccessToast) {
          ToastService.success(
            overrideOptions?.successMessage || successMessage,
            ""
          );
        }

        setState({ isLoading: false, error: null });
        return result;
      } catch (error) {
        // Check if this operation was cancelled
        if (currentController.signal.aborted) {
          return null;
        }

        const errorObj =
          error instanceof Error ? error : new Error("Unknown error");
        const errorMsg = errorObj.message || errorMessage;

        console.error("Async operation failed:", errorObj);

        // Handle error
        onError?.(errorObj);
        overrideOptions?.onError?.(errorObj);

        if (showErrorToast || overrideOptions?.showErrorToast !== false) {
          ToastService.error(
            overrideOptions?.errorMessage || errorMsg || errorMessage,
            overrideOptions?.errorDescription || errorDescription
          );
        }

        setState({
          isLoading: false,
          error: errorMsg || overrideOptions?.errorMessage || errorMessage,
        });

        return null;
      }
    },
    [
      onSuccess,
      onError,
      showSuccessToast,
      showErrorToast,
      successMessage,
      errorMessage,
      errorDescription,
    ]
  );

  const reset = useCallback(() => {
    // Cancel any ongoing operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState({ isLoading: false, error: null });
  }, []);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState({ isLoading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
    cancel,
  };
};
