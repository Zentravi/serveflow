"use client";

import { SessionProvider } from "@/auth/session-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
