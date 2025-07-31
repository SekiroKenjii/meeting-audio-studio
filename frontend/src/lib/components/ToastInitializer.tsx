import { useEffect } from "react";
import { useToast } from "../context/ToastContext";
import { setGlobalToastFunctions as setToastServiceFunctions } from "../services/toastService";

const ToastInitializer: React.FC = () => {
  const {
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  } = useToast();

  useEffect(() => {
    const toastFunctions = {
      addToast,
      removeToast,
      showSuccess,
      showError,
      showWarning,
      showInfo,
    };

    // Set up global toast functions for ToastService
    setToastServiceFunctions(toastFunctions);

    // Cleanup function
    return () => {
      setToastServiceFunctions(null);
    };
  });

  return null;
};

export default ToastInitializer;
