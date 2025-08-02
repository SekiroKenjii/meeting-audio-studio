import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DemoBanner from "../components/DemoBanner";
import Sidebar from "../components/Sidebar";
import { EVENTS } from "../constants/events";
import { getRouteInfo, ROUTES } from "../constants/routes";
import { useSidebar } from "../hooks";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { isCollapsed } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();

  // Function to trigger file upload
  const handleUploadClick = () => {
    const pagesWithUpload = [ROUTES.DASHBOARD, ROUTES.DASHBOARD_FILES];
    const currentPath = location.pathname;

    if (pagesWithUpload.includes(currentPath)) {
      const uploadEvent = new CustomEvent(EVENTS.TRIGGER_FILE_UPLOAD);
      window.dispatchEvent(uploadEvent);
    } else {
      navigate(ROUTES.DASHBOARD_FILES);
    }
  };

  // Get page info based on current route
  const getPageInfo = () => {
    const path = location.pathname;

    return getRouteInfo(path);
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
              <button className="btn btn-primary" onClick={handleUploadClick}>
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
