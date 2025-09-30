import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

interface QueryWrapperProps {
  children: React.ReactNode;
}

export const createQueryWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: QueryWrapperProps) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};