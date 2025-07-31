import { AlertCircle, CheckCircle, Info, X, XCircle } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Toast as ToastType } from "../types/toast";

interface ToastProps {
  toast: ToastType;
  onRemove: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleRemove = () => {
    setIsLeaving(true);
    setTimeout(() => onRemove(toast.id), 300); // Animation duration
  };

  const getToastStyles = () => {
    const baseStyles =
      "max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden transition-all duration-300 ease-in-out transform";

    if (isLeaving) {
      return `${baseStyles} translate-x-full opacity-0`;
    }

    if (isVisible) {
      return `${baseStyles} translate-x-0 opacity-100`;
    }

    return `${baseStyles} translate-x-full opacity-0`;
  };

  const getIconAndColor = () => {
    switch (toast.type) {
      case "success":
        return {
          icon: <CheckCircle className="w-6 h-6" />,
          iconColor: "text-green-400",
          borderColor: "border-l-green-400",
        };
      case "error":
        return {
          icon: <XCircle className="w-6 h-6" />,
          iconColor: "text-red-400",
          borderColor: "border-l-red-400",
        };
      case "warning":
        return {
          icon: <AlertCircle className="w-6 h-6" />,
          iconColor: "text-yellow-400",
          borderColor: "border-l-yellow-400",
        };
      case "info":
        return {
          icon: <Info className="w-6 h-6" />,
          iconColor: "text-blue-400",
          borderColor: "border-l-blue-400",
        };
      default:
        return {
          icon: <Info className="w-6 h-6" />,
          iconColor: "text-gray-400",
          borderColor: "border-l-gray-400",
        };
    }
  };

  const { icon, iconColor, borderColor } = getIconAndColor();

  return (
    <div className={`${getToastStyles()} border-l-4 ${borderColor}`}>
      <div className="p-4">
        <div className="flex items-start">
          <div className={`flex-shrink-0 ${iconColor}`}>{icon}</div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium text-gray-900">{toast.title}</p>
            {toast.message && (
              <p className="mt-1 text-sm text-gray-500">{toast.message}</p>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={handleRemove}
            >
              <span className="sr-only">Close</span>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toast;
