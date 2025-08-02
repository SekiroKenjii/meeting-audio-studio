export interface RouteInfo {
  title: string;
  description: string;
}

export const ROUTES_MAP: Record<string, RouteInfo> = {
  "/": {
    title: "Home Page",
    description: "Welcome to the Audio Studio",
  },
  "/error": {
    title: "Error Page",
    description: "Oops! Something went wrong.",
  },
  "/debug": {
    title: "Debug Page",
    description: "Debugging tools and information.",
  },
  "/dashboard": {
    title: "Dashboard",
    description: "Manage your audio files and transcriptions",
  },
  "/dashboard/files": {
    title: "Audio Files",
    description: "View and manage all your uploaded audio files",
  },
  "/dashboard/transcripts": {
    title: "Transcripts",
    description: "View and manage your audio transcripts",
  },
  "/dashboard/analytics": {
    title: "Analytics",
    description: "View insights and analytics for your audio files",
  },
  "/dashboard/settings": {
    title: "Settings",
    description: "Configure your account and application preferences",
  },
};

export const ROUTES = {
  // Landing Page
  LANDING: "/",

  // Error Page
  ERROR: "/error",

  // Debug Page (development only)
  DEBUG: "/debug",

  // Dashboard Routes
  DASHBOARD: "/dashboard",
  DASHBOARD_FILES: "/dashboard/files",
  DASHBOARD_OVERVIEW: "/dashboard/overview",
  DASHBOARD_SETTINGS: "/dashboard/settings",
  DASHBOARD_TRANSCRIPTS: "/dashboard/transcripts",
  DASHBOARD_ANALYTICS: "/dashboard/analytics",
  DASHBOARD_SUPPORT: "/dashboard/support",

  // Catch-all for dashboard sub-routes
  DASHBOARD_CATCH_ALL: "/dashboard/*",
};

export type RouteType = keyof typeof ROUTES;

// Utility function to get the route path
export const getRoutePath = (route: RouteType): string => {
  return ROUTES[route];
};

// Utility function to check if a path is a dashboard route
export const isDashboardRoute = (path: string): boolean => {
  return path.startsWith(ROUTES.DASHBOARD) || path === ROUTES.DASHBOARD;
};

// Utility function to get the base dashboard path
export const getDashboardBasePath = (): string => {
  return ROUTES.DASHBOARD;
};

// Utility function to get the full path for a specific dashboard route
export const getDashboardPath = (subRoute: string): string => {
  return `${ROUTES.DASHBOARD}/${subRoute}`;
};

export const getRouteInfo = (path: string): RouteInfo => {
  return (
    ROUTES_MAP[path] || {
      title: "Unknown",
      description: "No description available.",
    }
  );
};
