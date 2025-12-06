import { useQuery } from "@tanstack/react-query";
import type { ExerciseTemplateDto, Paginated, TaxonomyLevel } from "@/types";

interface UseExerciseTemplatesOptions {
  isActive?: boolean;
  taxonomyLevel?: TaxonomyLevel;
  search?: string;
  page?: number;
  pageSize?: number;
}

interface NormalizedUseExerciseTemplatesOptions {
  isActive: boolean;
  taxonomyLevel?: TaxonomyLevel;
  search?: string;
  page: number;
  pageSize: number;
}

/**
 * Custom React Query hook for fetching exercise templates
 *
 * @returns Query result with exercise templates data
 *
 * @example
 * const { data: templates, isLoading } = useExerciseTemplates();
 */
export function useExerciseTemplates(options: UseExerciseTemplatesOptions = {}) {
  const normalizedOptions: NormalizedUseExerciseTemplatesOptions = {
    isActive: options.isActive ?? true,
    page: options.page ?? 1,
    pageSize: options.pageSize ?? 50,
    taxonomyLevel: options.taxonomyLevel,
    search: options.search?.trim() || undefined,
  };

  return useQuery<Paginated<ExerciseTemplateDto>>({
    queryKey: ["exercise-templates", normalizedOptions],
    queryFn: async () => {
      const searchParams = new URLSearchParams();

      Object.entries(normalizedOptions).forEach(([key, value]) => {
        if (value === undefined) {
          return;
        }

        searchParams.append(key, String(value));
      });

      const queryString = searchParams.toString();
      const requestUrl = queryString ? `/api/exercise-templates?${queryString}` : "/api/exercise-templates";

      const response = await fetch(requestUrl);

      if (!response.ok) {
        throw new Error("Failed to fetch exercise templates");
      }

      return (await response.json()) as Paginated<ExerciseTemplateDto>;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes (templates don't change often)
    retry: 3,
  });
}
