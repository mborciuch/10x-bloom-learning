import type { Tables } from "@/db/database.types";
import type { StudyPlanListItemDto } from "@/types";

export function mapToStudyPlanListItemDto(row: Tables<"study_plans">): StudyPlanListItemDto {
  return {
    id: row.id,
    title: row.title,
    sourceMaterial: row.source_material,
    wordCount: row.word_count,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
