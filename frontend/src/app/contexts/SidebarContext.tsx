import { SidebarContextType } from "@/app/types/sidebar";
import React, { createContext, ReactNode, useMemo, useState } from "react";

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export { SidebarContext };

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
