import type { SupabaseClient } from "@/db/supabase.client";
import type { Paginated, ReviewSessionDto, ReviewStatus, TaxonomyLevel } from "@/types";
import { mapToReviewSessionDto } from "@/lib/mappers/review-session.mapper";

type ReviewSessionSortField = "review_date";
type ReviewSessionSortOrder = "asc" | "desc";

export interface ListReviewSessionsOptions {
  studyPlanId?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: ReviewStatus;
  isCompleted?: boolean;
  taxonomyLevel?: TaxonomyLevel;
  isAiGenerated?: boolean;
  page: number;
  pageSize: number;
  sort: ReviewSessionSortField;
  sortOrder: ReviewSessionSortOrder;
}

export class ReviewSessionService {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * List review sessions for a given user with advanced filtering and pagination.
   *
   * This powers the calendar view and other list screens.
   */
  async list(userId: string, options: ListReviewSessionsOptions): Promise<Paginated<ReviewSessionDto>> {
    const { page, pageSize, sort, sortOrder, ...filters } = options;

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = this.supabase
      .from("review_sessions")
      .select("*", { count: "exact" })
      .eq("user_id", userId);

    if (filters.studyPlanId) {
      query = query.eq("study_plan_id", filters.studyPlanId);
    }

    if (filters.dateFrom) {
      query = query.gte("review_date", filters.dateFrom);
    }

    if (filters.dateTo) {
      query = query.lte("review_date", filters.dateTo);
    }

    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    if (typeof filters.isCompleted === "boolean") {
      query = query.eq("is_completed", filters.isCompleted);
    }

    if (filters.taxonomyLevel) {
      query = query.eq("taxonomy_level", filters.taxonomyLevel);
    }

    if (typeof filters.isAiGenerated === "boolean") {
      query = query.eq("is_ai_generated", filters.isAiGenerated);
    }

    const { data, count, error } = await query
      .order(sort, { ascending: sortOrder === "asc" })
      .range(from, to);

    if (error) {
      throw error;
    }

    const rows = data ?? [];

    return {
      items: rows.map((row) => mapToReviewSessionDto(row)),
      page,
      pageSize,
      total: count ?? rows.length,
    };
  }
}


