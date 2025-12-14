import type { SupabaseClient } from "@/db/supabase.client";
import type { AiQualityMetricsDto, AiUsageMetricsDto } from "@/types";
import { ApiError } from "@/lib/utils/error-handler";

interface AiUsageAggregationRow {
  total: number | null;
  ai_generated: number | null;
  manual: number | null;
}

interface AiQualityAggregationRow {
  study_plan_id: string;
  generated: number | null;
  accepted: number | null;
  edited: number | null;
}

/**
 * Provides aggregated analytics for AI usage KPIs.
 */
export class MetricsService {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Step 2 & 3: Fetch raw aggregates via single RPC call and derive final rate.
   */
  async getAiUsage(userId: string): Promise<AiUsageMetricsDto> {
    const { data, error } = await this.supabase.rpc("get_ai_usage_metrics", {
      p_user_id: userId,
    });

    if (error) {
      throw error;
    }

    if (!data) {
      throw new ApiError("METRICS_UNAVAILABLE", "Unable to calculate AI usage metrics", 500);
    }

    const raw = data as AiUsageAggregationRow;
    const totalReviewSessions = Number(raw.total ?? 0);
    const aiGeneratedSessions = Number(raw.ai_generated ?? 0);
    const manualSessions = Number(raw.manual ?? Math.max(totalReviewSessions - aiGeneratedSessions, 0));
    const aiUsageRate = totalReviewSessions > 0 ? aiGeneratedSessions / totalReviewSessions : 0;

    return {
      totalReviewSessions,
      aiGeneratedSessions,
      manualSessions,
      aiUsageRate,
    };
  }

  /**
   * Aggregates AI quality metrics per study plan with optional filtering.
   */
  async getAiQuality(userId: string, studyPlanId?: string): Promise<AiQualityMetricsDto> {
    const { data, error } = await this.supabase.rpc("get_ai_quality_metrics", {
      p_user_id: userId,
      p_study_plan_id: studyPlanId ?? null,
    });

    if (error) {
      throw error;
    }

    const rows = (data ?? []) as AiQualityAggregationRow[];

    const studyPlans = rows.map((row) => {
      const generatedSessions = Number(row.generated ?? 0);
      const acceptedSessions = Number(row.accepted ?? 0);
      const editedSessions = Number(row.edited ?? 0);
      const editRate = acceptedSessions > 0 ? editedSessions / acceptedSessions : 0;

      return {
        studyPlanId: row.study_plan_id,
        generatedSessions,
        acceptedSessions,
        editedSessions,
        editRate,
      };
    });

    return {
      studyPlans,
    };
  }
}
