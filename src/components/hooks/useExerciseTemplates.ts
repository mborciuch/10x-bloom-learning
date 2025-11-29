import { useQuery } from "@tanstack/react-query";
import type { ExerciseTemplateDto } from "@/types";

/**
 * Custom React Query hook for fetching exercise templates
 *
 * @returns Query result with exercise templates data
 *
 * @example
 * const { data: templates, isLoading } = useExerciseTemplates();
 */
export function useExerciseTemplates() {
  return useQuery<ExerciseTemplateDto[]>({
    queryKey: ["exercise-templates"],
    queryFn: async () => {
      const response = await fetch("/api/exercise-templates");

      if (!response.ok) {
        throw new Error("Failed to fetch exercise templates");
      }

      return response.json();
    },
    staleTime: 15 * 60 * 1000, // 15 minutes (templates don't change often)
    retry: 3,
  });
}
