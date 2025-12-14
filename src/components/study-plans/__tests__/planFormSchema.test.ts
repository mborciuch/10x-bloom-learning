import { describe, expect, it } from "vitest";
import { CreateStudyPlanFormSchema } from "../planFormSchema";

const buildWords = (count: number) => Array.from({ length: count }, (_, idx) => `word${idx + 1}`).join(" ");

const baseData = {
  title: "Solid title",
  sourceMaterial: buildWords(200),
};

describe("CreateStudyPlanFormSchema", () => {
  it("fails when sourceMaterial has fewer than 200 words and passes at 200", () => {
    const almostEnough = CreateStudyPlanFormSchema.safeParse({
      ...baseData,
      sourceMaterial: buildWords(199),
    });

    expect(almostEnough.success).toBe(false);
    expect(almostEnough.error.issues.map((issue) => issue.message)).toContain(
      "Materiał musi zawierać co najmniej 200 słów"
    );

    const enough = CreateStudyPlanFormSchema.safeParse(baseData);
    expect(enough.success).toBe(true);
  });

  it("fails when sourceMaterial exceeds 5000 words", () => {
    const tooLong = CreateStudyPlanFormSchema.safeParse({
      ...baseData,
      sourceMaterial: buildWords(5001),
    });

    expect(tooLong.success).toBe(false);
    expect(tooLong.error.issues.map((issue) => issue.message)).toContain(
      "Materiał może zawierać maksymalnie 5000 słów"
    );
  });
});
