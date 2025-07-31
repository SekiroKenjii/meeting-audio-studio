import {
  AudioLines,
  BarChart3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  HelpCircle,
  Layers,
  LayoutDashboard,
  Settings,
  User,
} from "lucide-react";
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSidebar } from "../contexts/SidebarContext";

const Sidebar: React.FC = () => {
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { isCollapsed, setIsCollapsed } = useSidebar();

  const navigation = [
    {
      name: "Overview",
      href: "/dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      name: "Audio Files",
      href: "/dashboard/files",
      icon: <AudioLines className="w-5 h-5" />,
    },
    {
      name: "Transcripts",
      href: "/dashboard/transcripts",
      icon: <FileText className="w-5 h-5" />,
    },
    {
      name: "Analytics",
      href: "/dashboard/analytics",
      icon: <BarChart3 className="w-5 h-5" />,
    },
  ];

  const userMenuItems = [
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: <Settings className="w-5 h-5" />,
    },
    {
      name: "Help & Support",
      href: "/dashboard/support",
      icon: <HelpCircle className="w-5 h-5" />,
    },
  ];

  const isActiveLink = (href: string) => {
    if (href === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div
      className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 flex flex-col z-30 transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-16 lg:w-64"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div className={`${isCollapsed ? "hidden" : "hidden lg:block"}`}>
            <h1 className="text-lg font-semibold text-gray-900">
              Audio Studio
            </h1>
            <p className="text-xs text-gray-500">Dashboard</p>
          </div>
        </div>
        {/* Collapse Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-1.5 rounded-lg hover:bg-gray-100 transition-colors ${
            isCollapsed ? "block" : "hidden lg:block"
          }`}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          )}
        </button>
      </div>

      {/* Scrollable Navigation */}
      <div className="flex-1 overflow-y-auto">
        <nav
          className={`py-6 space-y-1 ${isCollapsed ? "px-2" : "px-2 lg:px-4"}`}
        >
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = isActiveLink(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center text-sm font-medium rounded-lg transition-colors ${
                    isCollapsed ? "px-2 py-2 justify-center" : "px-3 py-2"
                  } ${
                    isActive
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                  title={item.name} // Tooltip for collapsed view
                >
                  <span
                    className={`${
                      isActive
                        ? "text-gray-900"
                        : "text-gray-400 group-hover:text-gray-600"
                    } ${isCollapsed ? "" : "lg:mr-3"}`}
                  >
                    {item.icon}
                  </span>
                  <span
                    className={`${isCollapsed ? "hidden" : "hidden lg:block"}`}
                  >
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* User Profile with Menu */}
      <div
        className={`py-4 border-t border-gray-200 flex-shrink-0 relative ${
          isCollapsed ? "px-2" : "px-2 lg:px-4"
        }`}
      >
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className={`w-full flex items-center rounded-lg hover:bg-gray-50 transition-colors ${
            isCollapsed ? "px-2 py-2 justify-center" : "px-3 py-2 space-x-3"
          }`}
          title="User Menu" // Tooltip for collapsed view
        >
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-gray-600" />
          </div>
          <div
            className={`${
              isCollapsed ? "hidden" : "hidden lg:block"
            } flex-1 text-left ml-3`}
          >
            <p className="text-sm font-medium text-gray-900">User</p>
            <p className="text-xs text-gray-500">Free Plan</p>
          </div>
          <div className={`${isCollapsed ? "hidden" : "hidden lg:block"}`}>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform ${
                showUserMenu ? "rotate-180" : ""
              }`}
            />
          </div>
        </button>

        {/* User Menu Popup */}
        {showUserMenu && (
          <>
            {/* Backdrop */}
            <button
              className="fixed inset-0 z-40 bg-transparent border-0 cursor-default"
              onClick={() => setShowUserMenu(false)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setShowUserMenu(false);
                }
              }}
              aria-label="Close menu"
            />
            {/* Menu - positioned to the right of collapsed sidebar */}
            <div
              className={`absolute bottom-full mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 min-w-48 ${
                isCollapsed ? "left-16" : "lg:left-4 lg:right-4 left-16"
              }`}
            >
              {userMenuItems.map((item) => {
                const isActive = isActiveLink(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setShowUserMenu(false)}
                    className={`flex items-center px-4 py-2 text-sm transition-colors ${
                      isActive
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <span
                      className={`mr-3 ${
                        isActive ? "text-gray-900" : "text-gray-400"
                      }`}
                    >
                      {item.icon}
                    </span>
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
