-- seed: predefined exercise templates
-- description: populate public.exercise_templates with system-wide, read-only templates
-- notes:
--   - runs automatically on `supabase start` / `supabase db reset` as configured in `supabase/config.toml`
--   - aligns with MVP requirement: exercise templates are predefined only and populated via seed data

insert into public.exercise_templates (
  name,
  description,
  default_taxonomy_level,
  is_active,
  metadata
)
values
  (
    'Pamięciowe fiszki – kluczowe pojęcia',
    'Zestaw krótkich pytań i odpowiedzi sprawdzających zapamiętanie definicji, faktów i podstawowych pojęć.',
    'remember',
    true,
    jsonb_build_object(
      'recommendedQuestionCount', 5,
      'focus', 'Zapamiętywanie podstawowych faktów i definicji.',
      'tags', jsonb_build_array('flashcards', 'definitions', 'remember')
    )
  ),
  (
    'Zrozumienie idei – pytania otwarte',
    'Pytania, które wymagają wyjaśnienia własnymi słowami głównych idei i zależności między pojęciami.',
    'understand',
    true,
    jsonb_build_object(
      'recommendedQuestionCount', 5,
      'focus', 'Parafrazowanie, wyjaśnianie i ilustrowanie przykładami.',
      'tags', jsonb_build_array('concepts', 'explanations', 'understand')
    )
  ),
  (
    'Zastosowanie w praktyce – zadania scenariuszowe',
    'Scenariusze i zadania wymagające użycia wiedzy w praktycznych sytuacjach.',
    'apply',
    true,
    jsonb_build_object(
      'recommendedQuestionCount', 5,
      'focus', 'Rozwiązywanie problemów na podstawie poznanych zasad.',
      'tags', jsonb_build_array('problems', 'scenarios', 'apply')
    )
  ),
  (
    'Analiza i porównanie – pytania problemowe',
    'Pytania wymagające rozłożenia materiału na części, porównania podejść i identyfikacji kluczowych różnic.',
    'analyze',
    true,
    jsonb_build_object(
      'recommendedQuestionCount', 5,
      'focus', 'Porównywanie, kategoryzowanie i identyfikowanie relacji.',
      'tags', jsonb_build_array('analysis', 'comparison', 'analyze')
    )
  ),
  (
    'Krytyczna ocena – argumentacja',
    'Zadania wymagające oceny jakości rozwiązań, formułowania opinii i uzasadniania stanowiska.',
    'evaluate',
    true,
    jsonb_build_object(
      'recommendedQuestionCount', 5,
      'focus', 'Formułowanie kryteriów oceny i uzasadnianie decyzji.',
      'tags', jsonb_build_array('evaluation', 'argumentation', 'evaluate')
    )
  ),
  (
    'Tworzenie – projektowanie własnych rozwiązań',
    'Zadania zachęcające do tworzenia nowych rozwiązań, projektów lub pytań na podstawie materiału.',
    'create',
    true,
    jsonb_build_object(
      'recommendedQuestionCount', 5,
      'focus', 'Synteza wiedzy i tworzenie nowych struktur.',
      'tags', jsonb_build_array('creation', 'projects', 'create')
    )
  )
on conflict (name) do update
set
  description = excluded.description,
  default_taxonomy_level = excluded.default_taxonomy_level,
  is_active = excluded.is_active,
  metadata = excluded.metadata;


