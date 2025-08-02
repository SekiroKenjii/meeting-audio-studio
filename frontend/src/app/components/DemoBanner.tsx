import { demo } from "@/lib/config/env";
import React from "react";

export const DemoBanner: React.FC = () => {
  const message = demo.getMessage();

  if (!message) return null;

  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
      <div className="flex">
        <div className="ml-3">
          <p className="text-sm text-blue-700">{message}</p>
          <p className="text-xs text-blue-600 mt-1">
            For full functionality, deploy a backend server and update the API
            configuration.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DemoBanner;
