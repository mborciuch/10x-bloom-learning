import { formatDistanceToNow } from "date-fns";
import type { StudyPlanListItemDto } from "@/types";
import type { PlanCardViewModel } from "./plans.types";

export function mapToPlanCardViewModel(plan: StudyPlanListItemDto): PlanCardViewModel {
  return {
    id: plan.id,
    title: plan.title,
    wordCount: plan.wordCount,
    status: plan.status,
    createdAt: plan.createdAt,
    createdAtRelative: formatDistanceToNow(new Date(plan.createdAt), { addSuffix: true }),
  };
}

export function mapToPlanCardViewModels(plans: StudyPlanListItemDto[]): PlanCardViewModel[] {
  return plans.map(mapToPlanCardViewModel);
}
