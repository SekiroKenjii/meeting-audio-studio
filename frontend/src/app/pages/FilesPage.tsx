import React from "react";
import AudioTable from "../components/AudioTable";
import AudioUpload from "../components/AudioUpload";
import { AudioProvider } from "../contexts/AudioContext";

const FilesPage: React.FC = () => {
  return (
    <AudioProvider>
      <div className="space-y-6">
        {/* Upload Section */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Upload New Audio File
          </h2>
          <AudioUpload />
        </div>

        {/* Files Table */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            All Audio Files
          </h3>
          <AudioTable />
        </div>
      </div>
    </AudioProvider>
  );
};

export default FilesPage;
