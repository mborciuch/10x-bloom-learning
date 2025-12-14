import type { StudyPlanListItemDto } from "@/types";
import { vi } from "vitest";

vi.mock("date-fns", () => ({
  formatDistanceToNow: vi.fn(() => "2 days ago"),
}));

import { formatDistanceToNow } from "date-fns";
import { mapToPlanCardViewModel, mapToPlanCardViewModels } from "../plans.mappers";

const basePlan = (overrides: Partial<StudyPlanListItemDto> = {}): StudyPlanListItemDto => ({
  id: overrides.id ?? crypto.randomUUID(),
  title: overrides.title ?? "Plan title",
  sourceMaterial: overrides.sourceMaterial ?? "Lorem ipsum",
  wordCount: overrides.wordCount ?? 1000,
  status: overrides.status ?? "draft",
  createdAt: overrides.createdAt ?? "2024-01-01T12:00:00.000Z",
  updatedAt: overrides.updatedAt ?? "2024-01-02T12:00:00.000Z",
});

describe("plans.mappers", () => {
  it("maps all fields 1:1 and enriches createdAtRelative", () => {
    const plan = basePlan();

    const viewModel = mapToPlanCardViewModel(plan);

    expect(viewModel).toMatchObject({
      id: plan.id,
      title: plan.title,
      wordCount: plan.wordCount,
      status: plan.status,
      createdAt: plan.createdAt,
      createdAtRelative: "2 days ago",
    });
    expect(formatDistanceToNow).toHaveBeenCalledWith(new Date(plan.createdAt), { addSuffix: true });
  });

  it("preserves ordering when mapping plan collections", () => {
    const plans = [basePlan({ id: "a" }), basePlan({ id: "b" }), basePlan({ id: "c" })];

    const viewModels = mapToPlanCardViewModels(plans);
    expect(viewModels.map((vm) => vm.id)).toEqual(["a", "b", "c"]);
  });
});
