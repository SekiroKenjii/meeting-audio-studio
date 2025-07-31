import React, { useState, useEffect } from "react";

interface FilenameConfirmDialogProps {
  isOpen: boolean;
  originalFilename: string;
  onConfirm: (filename: string) => void;
  onCancel: () => void;
}

const FilenameConfirmDialog: React.FC<FilenameConfirmDialogProps> = ({
  isOpen,
  originalFilename,
  onConfirm,
  onCancel,
}) => {
  const [filename, setFilename] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      // Remove file extension for editing, but keep it for validation
      const nameWithoutExtension = originalFilename.replace(/\.[^/.]+$/, "");
      setFilename(nameWithoutExtension);
      setError(""); // Clear any previous errors
    }
  }, [isOpen, originalFilename]);

  const validateFilename = (value: string): string => {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return "Filename is required";
    }

    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(trimmedValue)) {
      return "Filename contains invalid characters";
    }

    // Check for reserved names (Windows)
    const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;
    if (reservedNames.test(trimmedValue)) {
      return "Filename uses a reserved name";
    }

    return "";
  };

  const handleFilenameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilename(value);

    // Validate on change
    const validationError = validateFilename(value);
    setError(validationError);
  };

  const handleConfirm = () => {
    const validationError = validateFilename(filename);

    if (validationError) {
      setError(validationError);
      return;
    }

    // Get the file extension from original filename
    const regex = /\.[^/.]+$/;
    const extension = regex.exec(originalFilename)?.[0] || "";
    const finalFilename = filename.trim() + extension;
    onConfirm(finalFilename);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!error && filename.trim()) {
        handleConfirm();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  if (!isOpen) return null;

  const extension = originalFilename.match(/\.[^/.]+$/)?.[0] || "";

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Confirm Filename
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              You can edit the filename before uploading
            </p>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="filename"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Filename <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="filename"
                    type="text"
                    value={filename}
                    onChange={handleFilenameChange}
                    onKeyDown={handleKeyPress}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                      error
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="Enter filename"
                    autoFocus
                    required
                  />
                  {extension && (
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                      {extension}
                    </span>
                  )}
                </div>
                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600">
                  <strong>Preview:</strong> {filename.trim()}
                  {extension}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!filename.trim() || !!error}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Upload File
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default FilenameConfirmDialog;
