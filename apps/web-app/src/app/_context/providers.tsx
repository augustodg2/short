"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../_services/query-client";
import { AuthKitProvider } from "@workos-inc/authkit-nextjs/components";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthKitProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </AuthKitProvider>
  );
}
