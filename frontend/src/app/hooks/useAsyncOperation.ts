import ToastService from "@/lib/services/toastService";
import { useCallback, useState } from "react";

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

  const execute = useCallback(
    async <TResult = T>(
      asyncFn: () => Promise<TResult>,
      overrideOptions?: Partial<UseAsyncOperationOptions<TResult>>
    ): Promise<TResult | null> => {
      setState({ isLoading: true, error: null });

      try {
        const result = await asyncFn();

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
        const errorObj =
          error instanceof Error ? error : new Error("Unknown error");
        const errorMsg = errorObj.message || errorMessage;

        console.error("Async operation failed:", errorObj);

        // Handle error
        onError?.(errorObj);
        overrideOptions?.onError?.(errorObj);

        if (showErrorToast || overrideOptions?.showErrorToast !== false) {
          ToastService.error(
            overrideOptions?.errorMessage ?? errorMsg ?? errorMessage,
            overrideOptions?.errorDescription || errorDescription
          );
        }

        setState({
          isLoading: false,
          error: errorMsg ?? overrideOptions?.errorMessage ?? errorMessage,
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
    setState({ isLoading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
};
