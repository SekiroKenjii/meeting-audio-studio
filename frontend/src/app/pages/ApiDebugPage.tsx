import React, { useState } from "react";
import { api } from "../../sdk/api";

const ApiDebugPage: React.FC = () => {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    setIsLoading(true);
    const startTime = Date.now();

    try {
      const result = await testFn();
      const duration = Date.now() - startTime;

      setTestResults((prev) => [
        ...prev,
        {
          name: testName,
          status: "success",
          result,
          duration,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (error: any) {
      const duration = Date.now() - startTime;

      setTestResults((prev) => [
        ...prev,
        {
          name: testName,
          status: "error",
          error: {
            message: error?.message || "Unknown error",
            status: error?.status || "No status",
            name: error?.name || "Error",
          },
          duration,
          timestamp: new Date().toISOString(),
        },
      ]);
    }

    setIsLoading(false);
  };

  const runAllTests = async () => {
    setTestResults([]);

    // Test 1: Basic health check
    await runTest("Health Check", async () => {
      const response = await fetch("http://localhost:8000/api/health");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    });

    // Test 2: API Service health check
    await runTest("API Service Health", async () => {
      // We need to create a method for this or use a direct fetch
      const response = await fetch("http://localhost:8000/api/health");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    });

    // Test 3: Audio files list
    await runTest("Audio Files List", async () => {
      return await api.audioFiles.index();
    });

    // Test 4: Docs endpoint
    await runTest("API Docs", async () => {
      const response = await fetch("http://localhost:8000/api/docs");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">API Connectivity Debug</h1>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Environment</h2>
        <div className="bg-gray-100 p-4 rounded-lg space-y-2 text-sm">
          <div>
            <strong>API URL:</strong>{" "}
            {import.meta.env.VITE_API_URL || "undefined"}
          </div>
          <div>
            <strong>API Version:</strong>{" "}
            {import.meta.env.VITE_API_VERSION || "undefined"}
          </div>
          <div>
            <strong>Mode:</strong> {import.meta.env.MODE}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <button
          onClick={runAllTests}
          disabled={isLoading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? "Running Tests..." : "Run API Tests"}
        </button>
      </div>

      <div className="space-y-4">
        {testResults.map((result, index) => (
          <div
            key={`${result.name}-${result.timestamp}`}
            className={`p-4 rounded-lg border ${
              result.status === "success"
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold">{result.name}</h3>
              <span
                className={`px-2 py-1 rounded text-sm ${
                  result.status === "success"
                    ? "bg-green-200 text-green-800"
                    : "bg-red-200 text-red-800"
                }`}
              >
                {result.status === "success" ? "✅ Success" : "❌ Error"}
              </span>
            </div>

            <div className="text-sm text-gray-600 mb-2">
              Duration: {result.duration}ms | {result.timestamp}
            </div>

            <div className="bg-gray-900 text-gray-100 p-3 rounded text-sm overflow-auto">
              <pre>
                {JSON.stringify(
                  result.status === "success" ? result.result : result.error,
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApiDebugPage;
