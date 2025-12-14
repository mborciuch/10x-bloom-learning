<plan_testów>

## Wprowadzenie i cele testowania

### Cel produktu

Aplikacja webowa do tworzenia **planów nauki**, planowania i realizacji **sesji powtórek** (manualnych i generowanych przez AI), z widokiem kalendarza oraz panelem **AI Review** do akceptacji/odrzucania i edycji wygenerowanych sesji. Backend oparty o **Supabase (Postgres + Auth + RLS)** oraz integrację z **OpenRouter**.

### Główne cele testów

- **Weryfikacja krytycznych przepływów użytkownika**: rejestracja/logowanie, tworzenie planu, generowanie sesji AI, akceptacja/odrzucanie, edycja, ukończenie sesji, feedback.
- **Poprawność i stabilność API** (`src/pages/api/*`): walidacja wejścia (Zod), kody odpowiedzi, spójność kontraktów DTO z `src/types.ts`, paginacja, obsługa błędów.
- **Bezpieczeństwo i izolacja danych**: autoryzacja middleware (`src/middleware/index.ts`), RLS w Supabase (polityki w migracjach), brak wycieków danych między użytkownikami.
- **Jakość integracji AI**: odporność na błędy OpenRouter, timeouty/retry, walidacja schematu JSON, kontrola limitów i komunikatów błędów.
- **Użyteczność i dostępność**: formularze (react-hook-form + shadcn/Radix), komunikaty błędów, nawigacja klawiaturą, dialogi.
- **Obserwowalność i diagnostyka**: logi (logger), czytelne komunikaty dla użytkownika, spójne `error.code/message`.

---

## Zakres testów

### W zakresie (In-Scope)

- **Frontend (Astro + React)**:
  - Strony: `src/pages/*` (m.in. `/login`, `/register`, `/forgot-password`, `/app/calendar`, `/app/plans`, `/app/plans/new`, `/app/review-sessions/[sessionId]`, `/app/ai-review/[planId]`)
  - Komponenty kluczowe: `src/components/study-plans/*`, `src/components/Calendar/*`, `src/components/review-session/*`, `src/components/ai-review/*`
  - Hooki i cache: React Query (`src/components/hooks/*`, `src/lib/hooks/*`)
- **Backend (Astro API Routes)**: `src/pages/api/*`
  - Auth: `/api/auth/*`
  - Study plans: `/api/study-plans`, `/api/study-plans/{planId}`, `/api/study-plans/{planId}/ai-generate`
  - Review sessions: `/api/review-sessions*` (+ `/complete`, `/feedback`)
  - Exercise templates: `/api/exercise-templates`
  - Metrics: `/api/metrics/*`
  - Deprecated: `/api/ai-generation-worker` (410)
- **DB i bezpieczeństwo**:
  - Migracje w `supabase/migrations/*` (tabele, indeksy, RLS)
  - Seed danych: `supabase/seed.sql` (predefiniowane exercise templates)
- **Integracja z OpenRouter**: `src/lib/services/openrouter.service.ts` + `ai-generation.service.ts`

### Poza zakresem (Out-of-Scope) – na teraz

- Testy mobilne natywne (aplikacji mobilnej) – brak w repo.
- Integracja z płatnościami – brak w repo.
- Zaawansowane testy chaos/DR (Disaster Recovery) infrastruktury – jeśli nie ma środowiska.

---

## Typy testów do przeprowadzenia

### Testy jednostkowe (Unit)

- **Walidacje Zod**: `src/lib/validation/*.ts`
- **Serwisy domenowe**: `src/lib/services/*.ts` (mock Supabase / mock OpenRouter HTTP)
- **Utils i mappers**: `src/lib/utils/*`, `src/lib/mappers/*`, `src/lib/utils/error-handler.ts`, `src/lib/utils/auth-context.ts`, `src/db/supabase.client.ts` (np. serializacja cookies)
- **Krytyczne reguły biznesowe**:
  - Word count w `StudyPlanService` (200–5000)
  - Status transitions w `ReviewSessionService`
  - Zakaz usuwania sesji AI (`DELETE_NOT_ALLOWED`)
  - Markowanie `metadata.edited` przy edycji AI content

### Testy integracyjne (API + DB)

- Testy API routes uruchamiane na lokalnym Supabase (RLS włączone).
- Weryfikacja kontraktów DTO z `src/types.ts` (np. pola camelCase, typy, zawartość).
- Sprawdzenie RPC metryk: `get_ai_usage_metrics`, `get_ai_quality_metrics`.

### Testy E2E (przeglądarka)

- Przepływy użytkownika od UI do API, z prawdziwymi cookies/sesją Supabase.
- Pokrycie kluczowych ścieżek: plans → calendar → ai review → session detail.
- Scenariusze regresji: filtrowanie, paginacja, dialogi, toasty, abort AI generation.

### Testy kontraktowe (Frontend ↔ API)

- Zautomatyzowane sprawdzenie, że:
  - format błędu to `{ error: { code, message, details? } }` (lub dla auth: `{ message }`)
  - kody `error.code` są **spójne** z tym, co oczekuje UI (ryzyko rozjazdu)
  - nagłówki paginacji dla `/api/review-sessions` (`X-Total-Count`, `X-Page`, `X-Page-Size`)

### Testy niefunkcjonalne

- **Wydajność**: listowanie sesji (kalendarz), generowanie AI (timeout do ~90s, retry), paginacja.
- **Bezpieczeństwo**: open redirect (returnUrl sanitization), RLS, brak IDOR, polityki anon.
- **Dostępność (a11y)**: dialogi, focus management, aria, nawigacja klawiaturą.
- **Kompatybilność**: Chrome/Edge/Firefox (min. 2 najnowsze), responsywność podstawowa.

---

## Scenariusze testowe dla kluczowych funkcjonalności

### A. Autoryzacja i sesja (middleware + auth API)

1. **Redirect unauthenticated**
   - Wejście na `/app/calendar` bez sesji → redirect do `/login?returnUrl=...`.
2. **Redirect authenticated z public pages**
   - Użytkownik zalogowany wchodzi na `/login` lub `/register` → redirect do `/app/calendar`.
3. **Rejestracja**
   - Poprawne dane → 200 + `redirectTo` (domyślnie `/app/calendar`).
   - Email już istnieje → 409 + komunikat PL.
   - Niepoprawny JSON/val → 400 + komunikat PL.
   - `returnUrl`:
     - poprawny (zaczyna się od `/`, nie `//`) → `redirectTo` ustawione
     - próba open redirect (`https://`, `//evil`) → ignorowane, default redirect
4. **Logowanie**
   - Poprawne dane → 200 + `redirectTo`.
   - Błędne dane → 401 + komunikat PL.
5. **Reset hasła**
   - Zawsze 200 + generyczny komunikat (nie ujawnia czy email istnieje)
   - W razie błędu Supabase: logowanie do loggera (test: brak crash)
6. **Wylogowanie**
   - 204
   - Błąd Supabase → 400 + komunikat PL

### B. Study Plans (CRUD + list)

1. **GET /api/study-plans – lista**
   - Domyślna paginacja (page=1, pageSize=20) i sort (created_at desc)
   - Filtry: `status`, `search` (trim, min/max), `sort`, `sortOrder`
   - Walidacja query → 400 + `VALIDATION_ERROR` + `details`
2. **POST /api/study-plans – tworzenie**
   - Poprawne: 201 + DTO
   - Word count:
     - <200 lub >5000 → 400 + `VALIDATION_ERROR` z message o word count
   - Duplikat tytułu w obrębie usera (case-insensitive) → 409
   - Niepoprawny JSON → 400 `VALIDATION_ERROR`
3. **GET /api/study-plans/{planId} – szczegóły**
   - 200 + `totalSessions`, `completedSessions`
   - `planId` brak → 400
   - Nieistniejący plan → 404 `NOT_FOUND`
4. **PATCH /api/study-plans/{planId}**
   - Update status `active ↔ archived`
   - Update title/sourceMaterial:
     - weryfikacja, że update nie łamie constraints (min. DB; rekomendacja: test regresji)
5. **DELETE /api/study-plans/{planId}**
   - 204
   - Usunięcie kaskadowe sesji + feedback (sprawdzenie DB)
6. **Kontrakt UI ↔ API (ryzyko)**
   - UI mapuje błędy wg `error.code` (np. w UI pojawia się oczekiwanie `DUPLICATE_TITLE`, a API zwraca `CONFLICT`) → test kontraktowy ma wykryć rozjazd.

### C. Exercise Templates (read-only, global)

1. **GET /api/exercise-templates**
   - Domyślnie `isActive=true`
   - Filtry: `taxonomyLevel`, `search` (escape ILIKE), `page/pageSize`
   - Walidacja query: 400 + `VALIDATION_ERROR`
2. **RLS**
   - anon: brak dostępu
   - authenticated: tylko aktywne (wg polityki i parametru)

### D. Review Sessions (kalendarz + focus mode)

1. **GET /api/review-sessions – listing**
   - Filtry dat: `dateFrom/dateTo` (YYYY-MM-DD), `dateFrom <= dateTo`
   - Alias `planId` vs `studyPlanId`:
     - tylko `planId` → działa (transform)
     - oba różne → 400
   - Filtry: `status`, `isCompleted`, `taxonomyLevel`, `isAiGenerated`
   - Paginacja + nagłówki `X-*`
2. **POST /api/review-sessions – manual create**
   - Wymusza: status=accepted, isAiGenerated=false, isCompleted=false
   - Preconditions:
     - plan należy do usera → OK
     - plan cudzy → 409 `PLAN_OWNERSHIP_MISMATCH`
     - plan nie istnieje → 404
     - templateId nie istnieje → 404
   - Content schema:
     - questions/answers długości muszą się zgadzać
     - hints opcjonalne, ale jeśli są, długość = questions
     - długości elementów max 500
3. **GET /api/review-sessions/{sessionId}**
   - 200
   - 404 jeśli brak lub cudzy session
4. **PATCH /api/review-sessions/{sessionId}**
   - Puste body → 400 (refine “At least one field…”)
   - Status transitions:
     - proposed → accepted/rejected OK
     - accepted ↔ rejected OK wg reguł
     - inne nielegalne → 400 `INVALID_STATUS_TRANSITION`
   - Edycja content dla AI:
     - jeśli `existing.is_ai_generated = true` i zmiana `content` → ustawia `metadata.edited=true` + `editedAt`
     - manual session nie ustawia edited
5. **DELETE /api/review-sessions/{sessionId}**
   - Manual session → 204
   - AI-generated → 409 `DELETE_NOT_ALLOWED`
6. **POST /api/review-sessions/{sessionId}/complete**
   - Bez body (puste) → OK (payload `{}`)
   - `completedAt` opcjonalne ISO datetime:
     - poprawne → 200, `is_completed=true`, `completed_at`
     - błędne → 400 `VALIDATION_ERROR`
   - Powtórne complete → 409 `SESSION_ALREADY_COMPLETED`
7. **POST /api/review-sessions/{sessionId}/feedback**
   - Tylko po ukończeniu: inaczej 409 `SESSION_NOT_COMPLETED`
   - Tylko raz: duplikat → 409 `FEEDBACK_ALREADY_SUBMITTED`
   - rating 1–5, comment trim/null

### E. AI Generation + AI Review

1. **POST /api/study-plans/{planId}/ai-generate**
   - Walidacja:
     - `requestedCount` 1..50
     - `taxonomyLevels` min 1 max 6, wartości z enum
     - `includePredefinedTemplateIds` UUID[]
   - Brak `OPENROUTER_API_KEY` → 500 `CONFIGURATION_ERROR`
   - TemplateIds:
     - nieistniejące / nieaktywne → 400 `VALIDATION_ERROR`
   - Wynik:
     - zapis do DB jako `status=proposed`, `is_ai_generated=true`, `review_date=today`, `metadata.edited=false`
2. **Odporność na błędy OpenRouter**
   - INVALID_API_KEY → 500 `CONFIGURATION_ERROR`
   - RATE_LIMIT_EXCEEDED → 429 `RATE_LIMIT`
   - TIMEOUT → 408 `TIMEOUT`
   - błędy parsowania/schematu → 500 `AI_GENERATION_ERROR`
   - sprawdzenie retry/backoff w `OpenRouterService`
3. **/api/ai-generation-worker (deprecated)**
   - POST → 410 + `error.code=GONE`
4. **UI: AI Review (`/app/ai-review/{planId}`)**
   - Lista: tylko AI sessions `status=proposed` + `isAiGenerated=true`
   - Akceptuj/odrzuć pojedynczo
   - Bulk accept/reject:
     - przy brudnych (unsaved) edycjach → dialog ostrzegawczy
   - Zapis edycji:
     - po zmianie content → PATCH + walidacja; po sukcesie brak “dirty”
   - Odświeżanie danych / invalidation cache (React Query)

### F. UI: Create Plan (draft + walidacja + UX)

1. **Walidacja front**
   - title: required, max 200
   - sourceMaterial: required, word count 200–5000 (debounce)
2. **Draft w localStorage**
   - Auto-save gdy `isDirty`
   - Po wejściu na stronę przy istniejącym draft:
     - “Przywróć” → form wypełniony
     - “Odrzuć” → draft usunięty
3. **Cancel flow**
   - Jeśli dirty → dialog, po potwierdzeniu przejście wstecz/lista
4. **Obsługa błędów API**
   - 401 → redirect do `/login?returnUrl=/app/plans/new`
   - NETWORK_ERROR → toast z retry
   - VALIDATION_ERROR → podpięcie `details` do pól (jeśli pasuje)

### G. Metryki AI

1. **GET /api/metrics/ai-usage**
   - Dla usera bez sesji → 401
   - Dla usera bez danych → `aiUsageRate=0`, wartości 0
   - Spójność wyliczeń: manual = total - aiGenerated (fallback)
2. **GET /api/metrics/ai-quality?studyPlanId=...**
   - Walidacja UUID → 400
   - Bez parametru → agregacja po wszystkich planach usera
   - editRate = edited/accepted (zabezpieczenie przed dzieleniem przez 0)

---

## Środowisko testowe

### Lokalnie (DEV)

- Node.js zgodnie z projektem (repo wskazuje Node 22.x).
- `astro dev` na porcie 3000.
- Supabase lokalnie:
  - migracje + seed (`exercise_templates`)
  - 2 konta testowe (User A, User B) do testów izolacji danych
- Zmienne środowiskowe:
  - `SUPABASE_URL`, `SUPABASE_KEY`
  - `OPENROUTER_API_KEY` (dla testów integracyjnych AI; dla większości testów – mock)

### Test (CI)

- Pipeline, który:
  - startuje Supabase (lub używa testowego projektu Supabase)
  - uruchamia testy unit/integration/E2E
  - publikuje raporty (JUnit/HTML) i artefakty (trace/video z Playwright)

### Dane testowe

- Minimalny zestaw:
  - 1 plan aktywny + 1 archived (User A)
  - kilka manual sessions w różnych dniach/miesiącach
  - kilka AI sessions `proposed/accepted/rejected`, w tym edytowane (`metadata.edited=true`)
  - feedback dla części ukończonych sesji

---

## Narzędzia do testowania

- **Unit/Integration (TS)**: `Vitest` + `@testing-library/react` (dla komponentów React) + `jsdom`.
- **Mockowanie HTTP**:
  - `MSW` (frontend/hooki) lub mock `fetch` (np. undici) dla testów unit.
  - Dla OpenRouter: mock `OpenRouterHttpClient` lub intercept `fetch` na `/chat/completions`.
- **E2E**: `Playwright`
  - testy UI + API (request context)
  - nagrywanie trace/video/screenshot przy błędach
- **API kontrakty**: testy snapshot/JSON schema (np. `zod-to-json-schema` lub ręcznie)
- **A11y**: `axe-core` + `@axe-core/playwright`
- **Wydajność (smoke)**: pomiary czasu odpowiedzi (Playwright + custom metrics), opcjonalnie Lighthouse w CI.
- **Statyczna jakość**: ESLint/Prettier (jako gate, choć to nie testy funkcjonalne)

---

## Harmonogram testów (propozycja)

### Faza 0 — Przygotowanie (1–2 dni)

- Ustalenie danych testowych, kont testowych, reset DB.
- Konfiguracja narzędzi: Vitest + Playwright + MSW.
- Ustalenie “Definition of Done” dla testów (progi, raportowanie).

### Faza 1 — API i domena (2–4 dni)

- Unit: validation schemas + services (study plan, review session, metrics).
- Integration: API routes + Supabase (RLS i ownership).

### Faza 2 — E2E krytycznych przepływów (2–4 dni)

- Auth → create plan → generate AI → AI review → calendar → session detail → complete + feedback.
- Scenariusze negatywne: unauthorized, invalid input, delete constraints.

### Faza 3 — Regresja + niefunkcjonalne (1–3 dni cyklicznie)

- A11y smoke.
- Performance smoke dla list i AI generate.
- Security smoke (open redirect, IDOR/RLS).

_(Harmonogram należy dopasować do sprintów i zakresu zmian; E2E utrzymujemy w wąskim “happy path + 2–3 negatywy” na krytyczne funkcje)._

---

## Kryteria akceptacji testów

### Kryteria wejścia (Entry)

- Środowisko testowe działa (Supabase + migracje + seed).
- Zdefiniowane konta testowe i dane startowe.
- Zdefiniowane krytyczne przepływy (P0) i wymagane API kontrakty.

### Kryteria wyjścia (Exit)

- **100% testów P0 przechodzi** (Auth, create plan, calendar list, AI generate + AI review, complete + feedback).
- Brak otwartych defektów **Severity 1 (blokery)** i **Severity 2 (krytyczne)**.
- Pokrycie API kontraktów dla wszystkich endpointów w `src/pages/api/*` (min. test “success + walidacja/błąd auth” per endpoint).
- Stabilność E2E: flake rate < 2% na 20 uruchomień w CI (lub zgodnie z ustaleniami).
- Raport testów opublikowany (wyniki + lista znanych ograniczeń).

---

## Role i odpowiedzialności w procesie testowania

- **QA Engineer**
  - przygotowanie strategii, przypadków testowych, automatyzacji, raportów jakości
  - utrzymanie danych testowych i checklist regresji
- **Frontend Engineer**
  - wsparcie w testach komponentów/hooków, poprawki UX/a11y
  - utrzymanie kontraktów UI ↔ API (kody błędów, payloady)
- **Backend Engineer**
  - testy API/DB, poprawki walidacji i błędów, RLS/polityki
  - mock/feature-flag dla AI w środowiskach testowych
- **DevOps/CI Owner**
  - pipeline, sekrety, supabase w CI, artefakty testów
- **Product/Owner**
  - priorytety P0/P1, akceptacja funkcji i kryteriów

---

## Procedury raportowania błędów

### Kanał i format zgłoszeń

- Rejestr w narzędziu zespołu (np. GitHub Issues/Jira).
- Szablon zgłoszenia:
  - **Tytuł**: krótko + obszar (np. `[AI Review] Bulk accept loses edits without warning`)
  - **Środowisko**: local/CI/stage, commit hash, przeglądarka
  - **Kroki odtworzenia**
  - **Oczekiwany rezultat**
  - **Rzeczywisty rezultat**
  - **Severity / Priority**
  - **Załączniki**: screenshot, video/trace (Playwright), response payload, logi (console/server)
  - **Dane testowe**: user, planId/sessionId

### Klasyfikacja

- **Severity 1 (Blocker)**: brak możliwości użycia krytycznego flow (np. logowanie, zapis planu, generowanie AI).
- **Severity 2 (Critical)**: naruszenie bezpieczeństwa (RLS/IDOR), utrata danych, błędne przypisanie danych między userami.
- **Severity 3 (Major)**: istotny błąd funkcji bez utraty danych, obejście możliwe.
- **Severity 4 (Minor)**: UI/tekst/małe problemy.
- **Severity 5 (Trivial)**: kosmetyka.

### SLA (przykład)

- S1: hotfix / natychmiast, max 24h
- S2: max 48h
- S3: w sprincie
- S4/S5: wg priorytetu biznesowego

</plan_testów>
