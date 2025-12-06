import { useCallback, useMemo, useState, useEffect } from "react";
import type { StudyPlanListItemDto } from "@/types";
import type { PlansFiltersViewModel, PlansPageState } from "./plans.types";
import { useDebounce, useStudyPlans, useDeletePlan, useUpdatePlanStatus } from "@/lib/hooks";
import { PlansHeader } from "./PlansHeader";
import { PlansContent } from "./PlansContent";
import { PlansPagination } from "./PlansPagination";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toast } from "sonner";

const DEFAULT_PAGE_SIZE = 20;

const INITIAL_FILTERS: PlansFiltersViewModel = {
  search: "",
  status: "all",
  sort: "created_at",
  sortOrder: "desc",
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
};

export function PlansPage() {
  const [state, setState] = useState<PlansPageState>({
    filters: INITIAL_FILTERS,
    isInitialLoad: true,
    isRefetching: false,
    lastError: undefined,
  });

  const [planToDelete, setPlanToDelete] = useState<StudyPlanListItemDto | null>(null);

  const deletePlanMutation = useDeletePlan();
  const updateStatusMutation = useUpdatePlanStatus();

  const debouncedSearch = useDebounce(state.filters.search, 300);

  const effectiveFilters = useMemo<PlansFiltersViewModel>(
    () => ({
      ...state.filters,
      search: debouncedSearch,
    }),
    [state.filters, debouncedSearch]
  );

  const { data, isLoading, isFetching, error, refetch } = useStudyPlans(effectiveFilters);

  useEffect(() => {
    setState((prev) => ({
      ...prev,
      isInitialLoad: prev.isInitialLoad && isLoading,
      isRefetching: !prev.isInitialLoad && isFetching,
      lastError: error ?? prev.lastError,
    }));
  }, [isLoading, isFetching, error]);

  const handleSearchChange = useCallback((value: string) => {
    setState((prev) => ({
      ...prev,
      filters: {
        ...prev.filters,
        search: value,
        page: 1,
      },
    }));
  }, []);

  const handleStatusChange = useCallback((value: PlansFiltersViewModel["status"]) => {
    setState((prev) => ({
      ...prev,
      filters: {
        ...prev.filters,
        status: value,
        page: 1,
      },
    }));
  }, []);

  const handleCreateClick = useCallback(() => {
    window.location.href = "/app/plans/new";
  }, []);

  const handleReload = useCallback(() => {
    void refetch();
  }, [refetch]);

  const handleDelete = useCallback((plan: StudyPlanListItemDto) => {
    setPlanToDelete(plan);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!planToDelete) {
      return;
    }

    const planId = String(planToDelete.id);

    deletePlanMutation.mutate(
      { planId },
      {
        onSuccess: () => {
          setPlanToDelete(null);
          toast.success("Plan deleted successfully.");
        },
        onError: (error) => {
          toast.error(error.message || "Failed to delete plan. Please try again.");
        },
      }
    );
  }, [deletePlanMutation, planToDelete]);

  const handleArchive = useCallback(
    (plan: StudyPlanListItemDto) => {
      updateStatusMutation.mutate(
        { planId: String(plan.id), status: "archived" },
        {
          onSuccess: () => {
            toast.success("Plan archived.");
          },
          onError: (error) => {
            toast.error(error.message || "Failed to archive plan. Please try again.");
          },
        }
      );
    },
    [updateStatusMutation]
  );

  const handleUnarchive = useCallback(
    (plan: StudyPlanListItemDto) => {
      updateStatusMutation.mutate(
        { planId: String(plan.id), status: "active" },
        {
          onSuccess: () => {
            toast.success("Plan unarchived.");
          },
          onError: (error) => {
            toast.error(error.message || "Failed to unarchive plan. Please try again.");
          },
        }
      );
    },
    [updateStatusMutation]
  );

  const handleGenerateAI = useCallback((plan: StudyPlanListItemDto) => {
    const planId = String(plan.id);

    void fetch(`/api/study-plans/${planId}/ai-generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requestedCount: 10,
        taxonomyLevels: ["remember", "understand", "apply"],
      }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const data = await response.json().catch(() => null);
          const message =
            (data && data.error && typeof data.error.message === "string" && data.error.message) ||
            "Failed to generate AI sessions. Please try again.";
          throw new Error(message);
        }
        toast.success("AI sessions generated successfully.");
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Failed to generate AI sessions. Please try again.";
        toast.error(message);
      });
  }, []);

  const handleViewSessions = useCallback((plan: StudyPlanListItemDto) => {
    const url = new URL(window.location.href);
    url.pathname = "/app/calendar";
    url.searchParams.set("planId", String(plan.id));
    window.location.href = url.toString();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 md:py-10">
      <PlansHeader
        search={state.filters.search}
        status={state.filters.status}
        onSearchChange={handleSearchChange}
        onStatusChange={handleStatusChange}
        onCreateClick={handleCreateClick}
      />

      <PlansContent
        data={data}
        isLoading={isLoading}
        error={error}
        onReload={handleReload}
        onDelete={handleDelete}
        onArchive={handleArchive}
        onUnarchive={handleUnarchive}
        onGenerateAI={handleGenerateAI}
        onViewSessions={handleViewSessions}
      />

      {data && data.total > data.pageSize && (
        <PlansPagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          onPageChange={(newPage) => {
            setState((prev) => ({
              ...prev,
              filters: {
                ...prev.filters,
                page: newPage,
              },
            }));
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(planToDelete)}
        title="Delete study plan"
        description="This will delete the study plan and all associated review sessions. This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setPlanToDelete(null)}
      />
    </div>
  );
}
