"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { AutoRefreshProvider } from "./AutoRefreshProvider";

interface SessionWrapperProps {
  children: ReactNode;
}

export function SessionWrapper({ children }: SessionWrapperProps) {
  return (
    <SessionProvider>
      <AutoRefreshProvider>{children}</AutoRefreshProvider>
    </SessionProvider>
  );
}
