import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { vi } from "vitest";
import type { Paginated, ReviewSessionDto } from "@/types";
import { useCalendarSessions } from "../useCalendarSessions";

const originalFetch = globalThis.fetch;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, cacheTime: 0 },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const mockPaginated = (items: ReviewSessionDto[] = []): Paginated<ReviewSessionDto> => ({
  items,
  page: 1,
  pageSize: 20,
  total: items.length,
});

describe("useCalendarSessions", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    if (originalFetch) {
      globalThis.fetch = originalFetch;
    }
  });

  it("builds the request URL with all filters and returns the payload items", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockPaginated(),
    });
    globalThis.fetch = fetchMock as typeof fetch;

    const dateRange = { startDate: "2024-01-01", endDate: "2024-01-31" } as const;
    const extraFilters = { isCompleted: false, taxonomyLevel: "remember" } as const;

    const { result } = renderHook(() => useCalendarSessions(dateRange, "plan-1", extraFilters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = fetchMock.mock.calls[0][0] as string;
    const url = new URL(calledUrl, "http://localhost");

    expect(url.pathname).toBe("/api/review-sessions");
    expect(url.searchParams.get("dateFrom")).toBe(dateRange.startDate);
    expect(url.searchParams.get("dateTo")).toBe(dateRange.endDate);
    expect(url.searchParams.get("planId")).toBe("plan-1");
    expect(url.searchParams.get("isCompleted")).toBe("false");
    expect(url.searchParams.get("taxonomyLevel")).toBe("remember");
  });

  it("maps 401 responses to an UNAUTHORIZED error", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
    });
    globalThis.fetch = fetchMock as typeof fetch;

    const { result } = renderHook(() => useCalendarSessions({ startDate: "2024-01-01", endDate: "2024-01-02" }, null), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("UNAUTHORIZED");
  });

  it("prioritizes backend error messages over the generic fallback", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ error: { message: "Rate limit" } }),
    });
    globalThis.fetch = fetchMock as typeof fetch;

    const { result } = renderHook(() => useCalendarSessions({ startDate: "2024-01-01", endDate: "2024-01-02" }, null), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Rate limit");
  });
});
