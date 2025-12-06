import { useQuery } from "@tanstack/react-query";
import type { Paginated, StudyPlanListItemDto } from "@/types";
import type { PlansFiltersViewModel } from "@/components/study-plans/plans.types";

const DEFAULT_STALE_TIME_MS = 5 * 60 * 1000; // 5 minutes

function buildStudyPlansQueryParams(filters: PlansFiltersViewModel): string {
  const params = new URLSearchParams();

  const page = Math.max(1, filters.page);
  const pageSize = Math.min(Math.max(1, filters.pageSize), 100);
  const trimmedSearch = filters.search.trim();

  if (filters.status !== "all") {
    params.set("status", filters.status);
  }

  if (trimmedSearch.length > 0) {
    params.set("search", trimmedSearch.slice(0, 200));
  }

  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  params.set("sort", filters.sort);
  params.set("sortOrder", filters.sortOrder);

  return params.toString();
}

async function fetchStudyPlans(filters: PlansFiltersViewModel): Promise<Paginated<StudyPlanListItemDto>> {
  const query = buildStudyPlansQueryParams(filters);
  const response = await fetch(`/api/study-plans?${query}`);

  if (!response.ok) {
    // Surface structured backend error when available
    let errorBody: unknown;
    try {
      errorBody = await response.json();
    } catch {
      // swallow JSON parse errors, we'll fall back to generic message
    }

    const error: Error & { status?: number; body?: unknown } = new Error("Failed to fetch study plans");
    error.status = response.status;
    error.body = errorBody;
    throw error;
  }

  return response.json();
}

/**
 * React Query hook for fetching paginated study plans list.
 * Integrates with GET /api/study-plans and keeps filters in the query key.
 */
export function useStudyPlans(filters: PlansFiltersViewModel) {
  return useQuery<Paginated<StudyPlanListItemDto>>({
    queryKey: ["study-plans", filters],
    queryFn: () => fetchStudyPlans(filters),
    staleTime: DEFAULT_STALE_TIME_MS,
    retry: 2,
    keepPreviousData: true,
  });
}
