import type { SupabaseClient } from "@/db/supabase.client";
import type {
  CreateStudyPlanCommand,
  Paginated,
  StudyPlanDetailsDto,
  StudyPlanListItemDto,
  UpdateStudyPlanCommand,
} from "@/types";
import { mapToStudyPlanListItemDto } from "@/lib/mappers/study-plan.mapper";
import { ApiError } from "@/lib/utils/error-handler";
import { countWords } from "@/lib/utils/word-count";

const MIN_WORD_COUNT = 200;
const MAX_WORD_COUNT = 5000;

type StudyPlanSortField = "created_at" | "updated_at" | "title";
type StudyPlanSortOrder = "asc" | "desc";

export interface ListStudyPlansOptions {
  status?: "active" | "archived";
  search?: string;
  page: number;
  pageSize: number;
  sort: StudyPlanSortField;
  sortOrder: StudyPlanSortOrder;
}

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

    return mapToStudyPlanListItemDto(data);
  }

  async list(userId: string, options: ListStudyPlansOptions): Promise<Paginated<StudyPlanListItemDto>> {
    const { page, pageSize, sort, sortOrder, status, search } = options;

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = this.supabase.from("study_plans").select("*", { count: "exact" }).eq("user_id", userId);

    if (status) {
      query = query.eq("status", status);
    }

    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    const { data, count, error } = await query.order(sort, { ascending: sortOrder === "asc" }).range(from, to);

    if (error) {
      throw error;
    }

    return {
      items: (data ?? []).map((plan) => mapToStudyPlanListItemDto(plan)),
      page,
      pageSize,
      total: count ?? (data ?? []).length,
    };
  }

  async delete(userId: string, planId: string): Promise<void> {
    const { error } = await this.supabase.from("study_plans").delete().eq("user_id", userId).eq("id", planId);

    if (error) {
      throw error;
    }
  }

  async update(userId: string, planId: string, command: UpdateStudyPlanCommand): Promise<StudyPlanListItemDto> {
    const { data, error } = await this.supabase
      .from("study_plans")
      .update({
        title: command.title,
        source_material: command.sourceMaterial,
        status: command.status,
      })
      .eq("user_id", userId)
      .eq("id", planId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return mapToStudyPlanListItemDto(data);
  }

  async getDetails(userId: string, planId: string): Promise<StudyPlanDetailsDto> {
    const { data, error } = await this.supabase
      .from("study_plans")
      .select("*")
      .eq("user_id", userId)
      .eq("id", planId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        throw new ApiError("NOT_FOUND", "Study plan not found", 404);
      }
      throw error;
    }

    if (!data) {
      throw new ApiError("NOT_FOUND", "Study plan not found", 404);
    }

    const [{ count: totalSessions, error: totalError }, { count: completedSessions, error: completedError }] =
      await Promise.all([
        this.supabase
          .from("review_sessions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("study_plan_id", planId),
        this.supabase
          .from("review_sessions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("study_plan_id", planId)
          .eq("is_completed", true),
      ]);

    if (totalError) {
      throw totalError;
    }

    if (completedError) {
      throw completedError;
    }

    const base = mapToStudyPlanListItemDto(data);

    return {
      ...base,
      totalSessions: totalSessions ?? 0,
      completedSessions: completedSessions ?? 0,
    };
  }
}
