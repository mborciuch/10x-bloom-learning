import type { SupabaseClient } from "@/db/supabase.client";
import type { CreateStudyPlanCommand, StudyPlanListItemDto } from "@/types";
import { mapToStudyPlanListItemDto } from "@/lib/mappers/study-plan.mapper";
import { ApiError } from "@/lib/utils/error-handler";
import { countWords } from "@/lib/utils/word-count";

const MIN_WORD_COUNT = 200;
const MAX_WORD_COUNT = 5000;

export class StudyPlanService {
  constructor(private readonly supabase: SupabaseClient) {}

  async create(userId: string, command: CreateStudyPlanCommand): Promise<StudyPlanListItemDto> {
    const normalizedTitle = command.title.trim();
    const sourceMaterial = command.sourceMaterial.trim();
    const actualWordCount = countWords(sourceMaterial);

    if (actualWordCount < MIN_WORD_COUNT || actualWordCount > MAX_WORD_COUNT) {
      throw new ApiError(
        "VALIDATION_ERROR",
        `Word count must be between ${MIN_WORD_COUNT} and ${MAX_WORD_COUNT} (got ${actualWordCount})`,
        400
      );
    }

    const { data: existingPlan, error: existingPlanError } = await this.supabase
      .from("study_plans")
      .select("id")
      .eq("user_id", userId)
      .ilike("title", normalizedTitle)
      .maybeSingle();

    if (existingPlanError) {
      throw existingPlanError;
    }

    if (existingPlan) {
      throw new ApiError("CONFLICT", "A study plan with this title already exists", 409);
    }

    const { data, error } = await this.supabase
      .from("study_plans")
      .insert({
        user_id: userId,
        title: normalizedTitle,
        source_material: sourceMaterial,
        word_count: actualWordCount,
        status: "active",
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return mapToStudyPlanListItemDto(data, false);
  }
}
