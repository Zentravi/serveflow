"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface SessionUser {
  id: string;
  email: string;
  name: string;
  platformRole?: string;
}

interface SessionContextType {
  user: SessionUser | null;
  activeBusiness: { id: string; name: string; slug: string } | null;
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextType | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [activeBusiness, setActiveBusiness] = useState<SessionContextType["activeBusiness"]>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Phase 3: load session from HTTP-only cookie via /api/v1/auth/me
  useEffect(() => {
    setIsLoading(false);
    void setUser;
    void setActiveBusiness;
  }, []);

  const value: SessionContextType = {
    user,
    activeBusiness,
    isLoading,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
