import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { vi } from "vitest";
import type { Paginated, StudyPlanListItemDto } from "@/types";
import { useStudyPlans } from "../useStudyPlans";

const originalFetch = globalThis.fetch;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });

  const TestQueryClientProvider = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  TestQueryClientProvider.displayName = "TestQueryClientProvider";

  return TestQueryClientProvider;
};

const plansResponse = (items: StudyPlanListItemDto[]): Paginated<StudyPlanListItemDto> => ({
  items,
  page: 1,
  pageSize: items.length || 1,
  total: items.length,
});

const samplePlan: StudyPlanListItemDto = {
  id: "plan-1",
  title: "My plan",
  sourceMaterial: "Book",
  wordCount: 200,
  status: "draft",
  createdAt: "2024-01-01T10:00:00.000Z",
  updatedAt: "2024-01-02T10:00:00.000Z",
};

describe("useStudyPlans", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    if (originalFetch) {
      globalThis.fetch = originalFetch;
    }
  });

  it("returns only the items array from the paginated payload", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => plansResponse([samplePlan]),
    });
    globalThis.fetch = fetchMock as typeof fetch;

    const { result } = renderHook(() => useStudyPlans(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([samplePlan]);
  });

  it("maps 401 responses to UNAUTHORIZED errors", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
    });
    globalThis.fetch = fetchMock as typeof fetch;

    const { result } = renderHook(() => useStudyPlans(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("UNAUTHORIZED");
  });

  it("uses a generic error message for non-401 failures", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: "Internal error" }),
    });
    globalThis.fetch = fetchMock as typeof fetch;

    const { result } = renderHook(() => useStudyPlans(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Failed to fetch study plans");
  });
});
