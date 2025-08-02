import React from "react";
import { Link, useLocation } from "react-router-dom";
import DemoBanner from "../components/DemoBanner";
import Sidebar from "../components/Sidebar";
import { useSidebar } from "../hooks";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { isCollapsed } = useSidebar();
  const location = useLocation();

  // Get page info based on current route
  const getPageInfo = () => {
    const path = location.pathname;

    switch (path) {
      case "/dashboard/files":
        return {
          title: "Audio Files",
          description: "View and manage all your uploaded audio files",
        };
      case "/dashboard/transcripts":
        return {
          title: "Transcripts",
          description: "View and manage your audio transcripts",
        };
      case "/dashboard/analytics":
        return {
          title: "Analytics",
          description: "View insights and analytics for your audio files",
        };
      case "/dashboard/settings":
        return {
          title: "Settings",
          description: "Configure your account and application preferences",
        };
      case "/dashboard":
      default:
        return {
          title: "Dashboard",
          description: "Manage your audio files and transcriptions",
        };
    }
  };

  const pageInfo = getPageInfo();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Content with Dynamic Left Margin for Sidebar */}
      <div
        className={`flex flex-col min-h-screen transition-all duration-300 ${
          isCollapsed ? "ml-16" : "ml-16 lg:ml-64"
        }`}
      >
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {pageInfo.title}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {pageInfo.description}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Back to Home
              </Link>
              <button className="btn btn-primary">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Upload Audio
              </button>
            </div>
          </div>
        </header>

        {/* Demo Banner */}
        <div className="px-6">
          <DemoBanner />
        </div>

        {/* Page Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
