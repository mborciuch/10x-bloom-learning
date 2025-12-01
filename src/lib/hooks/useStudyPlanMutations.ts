import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { StudyPlanListItemDto, UpdateStudyPlanCommand } from "@/types";
import { deleteStudyPlan, updateStudyPlan, APIError } from "@/lib/api/study-plans";

type StudyPlansQueryKey = ["study-plans", unknown] | ["study-plans"];

function invalidateStudyPlans(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ["study-plans"] as StudyPlansQueryKey });
}

export function useDeletePlan() {
  const queryClient = useQueryClient();

  return useMutation<void, APIError, { planId: string }>({
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



