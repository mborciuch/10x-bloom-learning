import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { StudyPlanListItemDto, UpdateStudyPlanCommand } from "@/types";
import { deleteStudyPlan, updateStudyPlan, APIError } from "@/lib/api/study-plans";

function invalidateStudyPlans(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ["study-plans"] });
}

export function useDeletePlan() {
  const queryClient = useQueryClient();

  return useMutation<unknown, APIError, { planId: string }>({
    mutationFn: ({ planId }) => deleteStudyPlan(planId),
    onSuccess: () => {
      invalidateStudyPlans(queryClient);
    },
  });
}

export function useUpdatePlanStatus() {
  const queryClient = useQueryClient();

  return useMutation<StudyPlanListItemDto, APIError, { planId: string; status: UpdateStudyPlanCommand["status"] }>({
    mutationFn: ({ planId, status }) => updateStudyPlan(planId, { status }),
    onSuccess: () => {
      invalidateStudyPlans(queryClient);
    },
  });
}
