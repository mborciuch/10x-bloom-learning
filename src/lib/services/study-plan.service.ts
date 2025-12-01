import type { SupabaseClient } from "@/db/supabase.client";
import type { CreateStudyPlanCommand, Paginated, StudyPlanListItemDto, UpdateStudyPlanCommand } from "@/types";
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

    return mapToStudyPlanListItemDto(data, false);
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

    const plans = data ?? [];
    const planIds = plans.map((plan) => plan.id);
    const pendingPlanIds = new Set<string>();

    if (planIds.length > 0) {
      const { data: pendingRows, error: pendingError } = await this.supabase
        .from("ai_generation_log")
        .select("study_plan_id")
        .in("study_plan_id", planIds)
        .eq("state", "pending");

      if (pendingError) {
        throw pendingError;
      }

      for (const row of pendingRows ?? []) {
        if (row.study_plan_id) {
          pendingPlanIds.add(row.study_plan_id);
        }
      }
    }

    return {
      items: plans.map((plan) => mapToStudyPlanListItemDto(plan, pendingPlanIds.has(plan.id))),
      page,
      pageSize,
      total: count ?? plans.length,
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

    // Recompute pending flag based on ai_generation_log
    const { data: pendingRows, error: pendingError } = await this.supabase
      .from("ai_generation_log")
      .select("study_plan_id")
      .eq("study_plan_id", planId)
      .eq("state", "pending");

    if (pendingError) {
      throw pendingError;
    }

    const hasPending = (pendingRows ?? []).some((row) => row.study_plan_id === planId);

    return mapToStudyPlanListItemDto(data, hasPending);
  }
}
