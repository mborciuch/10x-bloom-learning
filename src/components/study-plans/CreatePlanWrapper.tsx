import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CreatePlanLayout } from "./CreatePlanLayout";
import { PlanForm } from "./PlanForm";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

/**
 * Wrapper component that provides React Query context for the Create Plan form
 * This is the entry point for the Astro page
 */
export function CreatePlanWrapper() {
  const handleSuccess = () => {
    // Redirect to plans list after a short delay to allow toast to show
    setTimeout(() => {
      window.location.href = "/app/plans";
    }, 500);
  };

  const handleCancel = () => {
    // Go back or redirect to plans list
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/app/plans";
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <CreatePlanLayout>
        <PlanForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </CreatePlanLayout>
    </QueryClientProvider>
  );
}
