import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PlansPage } from "./PlansPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

/**
 * Entry-point React wrapper for the /app/plans page.
 * Provides React Query context for the nested PlansPage component.
 */
export function PlansPageWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <PlansPage />
    </QueryClientProvider>
  );
}


