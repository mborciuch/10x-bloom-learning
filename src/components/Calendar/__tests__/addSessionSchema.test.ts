import { addSessionSchema } from "../addSessionSchema";

const baseData = {
  studyPlanId: "11111111-1111-4111-8111-111111111111",
  reviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // within allowed range
  exerciseType: "template" as const,
  exerciseTemplateId: "22222222-2222-4222-8222-222222222222",
  customExerciseLabel: "Ignored for template",
  taxonomyLevel: "remember" as const,
  questionsText: "Question 1?",
  answersText: "Answer 1.",
  notes: "Optional notes",
};

const buildData = (overrides: Partial<typeof baseData> = {}) => ({
  ...baseData,
  ...overrides,
});

const hasIssueOnPath = (result: ReturnType<typeof addSessionSchema.safeParse>, path: string) =>
  !result.success && result.error.issues.some((issue) => issue.path.join(".") === path);

describe("addSessionSchema", () => {
  it("requires a custom exercise label between 3 and 200 chars when exerciseType=custom", () => {
    const invalid = addSessionSchema.safeParse(
      buildData({
        exerciseType: "custom",
        customExerciseLabel: "ab",
        exerciseTemplateId: undefined,
      })
    );

    expect(invalid.success).toBe(false);
    expect(hasIssueOnPath(invalid, "customExerciseLabel")).toBe(true);

    const valid = addSessionSchema.safeParse(
      buildData({
        exerciseType: "custom",
        customExerciseLabel: "My custom exercise",
        exerciseTemplateId: undefined,
      })
    );

    expect(valid.success).toBe(true);
  });

  it("requires exerciseTemplateId whenever exerciseType=template", () => {
    const missingTemplate = addSessionSchema.safeParse(
      buildData({
        exerciseTemplateId: undefined,
      })
    );

    expect(missingTemplate.success).toBe(false);
    expect(hasIssueOnPath(missingTemplate, "exerciseTemplateId")).toBe(true);

    const valid = addSessionSchema.safeParse(baseData);
    expect(valid.success).toBe(true);
  });

  it("limits questions to 50 entries and enforces equal number of answers", () => {
    const fiftyOneLines = Array.from({ length: 51 }, (_, idx) => `Question ${idx + 1}?`).join("\n");
    const questionsTooMany = addSessionSchema.safeParse(
      buildData({
        questionsText: fiftyOneLines,
        answersText: Array.from({ length: 51 }, (_, idx) => `Answer ${idx + 1}.`).join("\n"),
      })
    );

    expect(questionsTooMany.success).toBe(false);
    expect(hasIssueOnPath(questionsTooMany, "questionsText")).toBe(true);

    const mismatchedAnswers = addSessionSchema.safeParse(
      buildData({
        questionsText: "Q1?\nQ2?",
        answersText: "A1.",
      })
    );

    expect(mismatchedAnswers.success).toBe(false);
    expect(hasIssueOnPath(mismatchedAnswers, "answersText")).toBe(true);
  });
});

