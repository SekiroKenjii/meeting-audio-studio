import { useEffect } from "react";
import { useToast } from "../hooks";
import { setGlobalToastFunctions as setToastServiceFunctions } from "../services/toastService";

const ToastInitializer: React.FC = () => {
  const { addToast, removeToast } = useToast();

  useEffect(() => {
    const toastFunctions = {
      addToast,
      removeToast,
    };

    // Set up global toast functions for ToastService
    setToastServiceFunctions(toastFunctions);

    // Cleanup function
    return () => {
      setToastServiceFunctions(null);
    };
  }, [addToast, removeToast]);

  return null;
};

export default ToastInitializer;
