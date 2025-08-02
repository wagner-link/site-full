// app/providers.tsx
"use client";
import { IgniterProvider } from "@igniter-js/core/client";
import { SessionProvider } from "next-auth/react";
import { EventSuccessModal } from "@/features/event/presentation";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <IgniterProvider>{children}</IgniterProvider>
      <EventSuccessModal />
    </SessionProvider>
  );
}
