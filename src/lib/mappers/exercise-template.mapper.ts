import type { Tables } from "@/db/database.types";
import type { ExerciseTemplateDto } from "@/types";

type ExerciseTemplateRow = Tables<"exercise_templates">;

export function mapToExerciseTemplateDto(row: ExerciseTemplateRow): ExerciseTemplateDto {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    defaultTaxonomyLevel: row.default_taxonomy_level,
    metadata: row.metadata,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}






