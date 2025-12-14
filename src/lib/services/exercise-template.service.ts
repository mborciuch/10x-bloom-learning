import type { SupabaseClient } from "@/db/supabase.client";
import type { ExerciseTemplateDto, Paginated, TaxonomyLevel } from "@/types";
import { mapToExerciseTemplateDto } from "@/lib/mappers/exercise-template.mapper";

export interface ExerciseTemplateListOptions {
  isActive: boolean;
  taxonomyLevel?: TaxonomyLevel;
  search?: string;
  page: number;
  pageSize: number;
}

export class ExerciseTemplateService {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * List exercise templates with optional filters and pagination.
   *
   * Templates are global (not scoped per user), so no userId parameter
   * is required.
   */
  async list(options: ExerciseTemplateListOptions): Promise<Paginated<ExerciseTemplateDto>> {
    const { page, pageSize, ...filters } = options;

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = this.supabase.from("exercise_templates").select("*", { count: "exact" });

    query = query.eq("is_active", filters.isActive);

    if (filters.taxonomyLevel) {
      query = query.eq("default_taxonomy_level", filters.taxonomyLevel);
    }

    if (filters.search) {
      const sanitizedSearch = escapeForILike(filters.search);
      if (sanitizedSearch.length > 0) {
        query = query.or(`name.ilike.%${sanitizedSearch}%,description.ilike.%${sanitizedSearch}%`);
      }
    }

    const { data, count, error } = await query.order("name", { ascending: true }).range(from, to);

    if (error) {
      throw error;
    }

    const rows = data ?? [];

    return {
      items: rows.map((row) => mapToExerciseTemplateDto(row)),
      page,
      pageSize,
      total: count ?? rows.length,
    };
  }
}

function escapeForILike(value: string): string {
  return value
    .replace(/[%_\\]/g, "\\$&")
    .replace(/[(),]/g, " ")
    .trim();
}
