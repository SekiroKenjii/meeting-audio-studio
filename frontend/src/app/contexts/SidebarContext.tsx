import { SidebarContextType } from "@/app/types/sidebar";
import React, {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);

  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }

  return context;
};

interface SidebarProviderProps {
  children: ReactNode;
}

export const SidebarProvider: React.FC<SidebarProviderProps> = ({
  children,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const value = useMemo(
    () => ({
      isCollapsed,
      setIsCollapsed,
    }),
    [isCollapsed]
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
};
