import React, { createContext, ReactNode, useMemo, useState } from "react";

interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

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
