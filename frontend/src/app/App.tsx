import ToastContainer from "@/lib/components/ToastContainer";
import ToastInitializer from "@/lib/components/ToastInitializer";
import { ToastProvider } from "@/lib/context/ToastContext";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { SidebarProvider } from "./contexts/SidebarContext";
import DashboardLayout from "./layouts/DashboardLayout";
import ApiDebugPage from "./pages/ApiDebugPage";
import Dashboard from "./pages/Dashboard";
import ErrorPage from "./pages/ErrorPage";
import FilesPage from "./pages/FilesPage";
import LandingPage from "./pages/LandingPage";

function App() {
  // Get the base URL for GitHub Pages deployment
  const basename = import.meta.env.VITE_BASE_URL?.replace(/\/$/, '') || "";

  return (
    <ToastProvider>
      <ToastInitializer />
      <Router
        basename={basename}
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          {/* Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Error Page */}
          <Route path="/error" element={<ErrorPage />} />

          {/* Debug Page (development only) */}
          <Route path="/debug" element={<ApiDebugPage />} />

          {/* Dashboard Routes with Sidebar Context */}
          <Route
            path="/dashboard"
            element={
              <SidebarProvider>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </SidebarProvider>
            }
          />
          <Route
            path="/dashboard/files"
            element={
              <SidebarProvider>
                <DashboardLayout>
                  <FilesPage />
                </DashboardLayout>
              </SidebarProvider>
            }
          />
          <Route
            path="/dashboard/*"
            element={
              <SidebarProvider>
                <DashboardLayout>
                  <div className="text-center py-12">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                      Coming Soon
                    </h2>
                    <p className="text-gray-600">
                      This section is under development.
                    </p>
                  </div>
                </DashboardLayout>
              </SidebarProvider>
            }
          />
        </Routes>
        <ToastContainer />
      </Router>
    </ToastProvider>
  );
}

export default App;
