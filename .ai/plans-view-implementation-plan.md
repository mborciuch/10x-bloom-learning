## Plan implementacji widoku Planów Nauki (`/app/plans`)

## 1. Przegląd

Widok **Planów Nauki** służy do zarządzania wszystkimi planami użytkownika: przeglądania listy planów, filtrowania/szukania, nawigacji do tworzenia i edycji planu, inicjowania generowania sesji AI oraz usuwania/archiwizowania planów.  
Widok musi być **chroniony (tylko zalogowany użytkownik)**, korzystać z danych z endpointu `GET /api/study-plans` i prezentować karty planów w responsywnej siatce z dobrym UX (empty state, paginacja, stany ładowania/błędu, dostępność).

## 2. Routing widoku

- **Ścieżka**: `/app/plans`
- **Typ routingu**: chroniony route Astro (SSR) wewnątrz przestrzeni `/app/*`, z kontrolą sesji Supabase w middleware.
- **Wejście widoku**:
  - Użytkownik nawigujący z sidebaru/bottom nav („Study Plans”).
  - Przekierowanie po utworzeniu nowego planu (`/app/plans/new` → sukces → `/app/plans`).
  - Potencjalnie query parametry w URL dla filtrów/paginacji (spójne z API):
    - `status=active|archived`
    - `search=...`
    - `page`, `pageSize`, `sort`, `sortOrder`
- **Oczekiwane zachowania routingu**:
  - Brak sesji → middleware przekierowuje do `/login?returnUrl=/app/plans`.
  - Po zalogowaniu z `returnUrl` → redirect z powrotem do `/app/plans`.
  - Zmiana filtrów/paginacji może aktualizować query parametry (dla deep-linków i odświeżenia strony).

## 3. Struktura komponentów

- **Struktura drzewa komponentów (wysokopoziomowa)**:

  - `AppLayout` (istniejący layout chroniony)
    - `PlansPage` (strona Astro/React dla `/app/plans`)
      - `PlansHeader`
        - `Input` (search, shadcn)
        - `Select` / `Dropdown` (filter status, shadcn)
        - `Button` "Create New Plan" (shadcn)
      - `PlansContent` (kontener stanu ładowania/pustego/błędu)
        - `PlansGrid` (dla `items.length > 0`)
          - [*N*] × `PlanCard`
            - `StatusBadge`
            - `WordCountBadge`
            - `PendingAiIndicator`
            - `DropdownMenu` (akcje)
        - `PlansEmptyState` (brak planów)
      - `PlansPagination` (jeśli `total > pageSize`)
      - Globalne komponenty cross-view (już istniejące):
        - `ConfirmDialog` (usunięcie planu)
        - `Toast`/`Notification` (wyniki akcji)
        - `LoadingSpinner` / skeletony

## 4. Szczegóły komponentów

### 4.1. `PlansPage`

- **Opis**: Główny komponent widoku `/app/plans`. Odpowiada za integrację z API (`useStudyPlans`), zarządzanie filtrami/paginacją, renderowanie nagłówka, gridu planów, empty state i paginacji.
- **Główne elementy**:
  - `PlansHeader` na górze.
  - `PlansContent` (sekcja listy).
  - `PlansPagination` u dołu (opcjonalnie).
- **Obsługiwane interakcje**:
  - Zmiana wyszukiwanej frazy.
  - Zmiana filtra statusu.
  - Kliknięcie przycisku „Create New Plan”.
  - Zmiana strony/paginacji.
  - Reakcja na mutacje (`delete`, `archive`), poprzez odświeżenie listy.
- **Obsługiwana walidacja (na poziomie widoku)**:
  - Ograniczenie długości `search` (1–200 znaków) zgodnie z `StudyPlanListQuerySchema`:
    - Pusta fraza = brak parametru `search`.
    - Jeśli użytkownik wpisze >200 znaków, input jest ucinany lub blokuje się wpisywanie.
  - `status` ograniczony do wartości: `"all" | "active" | "archived"`, gdzie:
    - `"all"` → brak parametru `status` w zapytaniu (pokazuje wszystkie).
    - `"active"` / `"archived"` mapują się na wartości z backendu.
  - `page` i `pageSize`:
    - `page >= 1`
    - `pageSize` w zakresie 1–100; UI używa stałej np. 20 i nie pozwala użytkownikowi wyjść poza zakres.
  - `sort` ∈ `["created_at","updated_at","title"]`, `sortOrder` ∈ `["asc","desc"]`; UI może ograniczyć usera do predefiniowanych opcji.
- **Typy**:
  - `Paginated<StudyPlanListItemDto>` – odpowiedź API.
  - `PlansFiltersViewModel`
  - `PlansPageState`
- **Propsy**:
  - Jako strona główna w drzewie `AppLayout` nie potrzebuje propsów zewnętrznych (dane wczytywane przez hooki i query parametry).

### 4.2. `PlansHeader`

- **Opis**: Pasek narzędzi u góry widoku z wyszukiwarką, filtrem statusu i przyciskiem do tworzenia nowego planu.
- **Główne elementy**:
  - `Input` (`<input type="search">` / `shadcn Input`) z placeholderem typu „Search plans…”.
  - `Select` / `Dropdown` (shadcn) z opcjami:
    - `All` (domyślnie)
    - `Active`
    - `Archived`
  - `Button` (primary) „Create New Plan”.
- **Obsługiwane interakcje**:
  - `onSearchChange(value: string)` – debounced (300 ms) aktualizacja filtra `search`.
  - `onStatusChange(value: "all" | "active" | "archived")`.
  - `onCreateClick()` – nawigacja do `/app/plans/new`.
- **Walidacja**:
  - `search`:
    - Trim na wejściu.
    - Jeśli użytkownik wpisze 0 znaków → nie wysyłamy `search` do API.
    - Maks. 200 znaków (HTML `maxLength`, dodatkowo Ramka z komunikatem, gdy osiągnięty).
  - `status`:
    - Dozwolone tylko trzy wyżej opisane wartości (kontrola na poziomie opcji Select).
- **Typy**:
  - `PlansHeaderProps`:
    - `search: string`
    - `status: "all" | "active" | "archived"`
    - `onSearchChange(value: string): void`
    - `onStatusChange(value: "all" | "active" | "archived"): void`
    - `onCreateClick(): void`
- **Propsy**:
  - Zgodne z `PlansHeaderProps` – sterowany z `PlansPage`.

### 4.3. `PlansContent`

- **Opis**: Kontener logiki: renderuje stany ładowania, błąd, empty state lub grid planów.
- **Główne elementy**:
  - Sekcja z:
    - Skeleton / `LoadingSpinner` podczas ładowania.
    - Komponent błędu (np. `ErrorState` z przyciskiem „Retry”).
    - `PlansEmptyState` gdy brak planów.
    - `PlansGrid` dla niepustego zbioru.
- **Obsługiwane interakcje**:
  - `onRetry()` – ponowne wywołanie `refetch` z `useStudyPlans`.
  - Propagacja akcji z dzieci (`onDelete`, `onArchive` itp.).
- **Walidacja**:
  - Brak walidacji formularzowej; komponent reaguje wyłącznie na stan danych.
- **Typy**:
  - `PlansContentProps`:
    - `data?: Paginated<StudyPlanListItemDto>`
    - `isLoading: boolean`
    - `error?: ErrorLike` (np. `unknown` zmapowane do lokalnego typu)
    - `onReload(): void`
    - `onDelete(plan: StudyPlanListItemDto): void`
    - `onArchive(plan: StudyPlanListItemDto): void`
    - `onUnarchive(plan: StudyPlanListItemDto): void`
    - `onGenerateAI(plan: StudyPlanListItemDto): void`
    - `onViewSessions(plan: StudyPlanListItemDto): void`
- **Propsy**:
  - Powyższy interfejs, sterowany przez `PlansPage`.

### 4.4. `PlansGrid`

- **Opis**: Odpowiada za responsywny layout kart planów (3 → 2 → 1 kolumny).
- **Główne elementy**:
  - `div` z gridem Tailwind:
    - Desktop: `grid-cols-3`
    - Tablet: `md:grid-cols-2`
    - Mobile: `grid-cols-1`
  - Dla każdego elementu `StudyPlanListItemDto` → `PlanCard`.
- **Obsługiwane interakcje**:
  - Przekazuje w dół do `PlanCard`: akcje „Generate AI”, „View Sessions”, „Edit”, „Archive/Unarchive”, „Delete”.
- **Walidacja**:
  - Brak – zakłada poprawne dane wejściowe.
- **Typy**:
  - `PlansGridProps`:
    - `plans: StudyPlanListItemDto[]`
    - `onGenerateAI(planId: string): void`
    - `onViewSessions(planId: string): void`
    - `onEdit(planId: string): void`
    - `onArchive(planId: string): void`
    - `onUnarchive(planId: string): void`
    - `onDelete(planId: string): void`
- **Propsy**:
  - Zgodne z powyższym, mapowane z `PlansContent`.

### 4.5. `PlanCard`

- **Opis**: Karta pojedynczego planu, prezentuje podstawowe informacje i menu akcji.
- **Główne elementy**:
  - Tytuł (h3, bold, ~20px).
  - `WordCountBadge` – badge z liczbą słów.
  - `StatusBadge` – Active/Archived.
  - Data utworzenia (`createdAt`) w formacie relative („2 days ago” – funkcja util).
  - `PendingAiIndicator` – jeśli `pendingAiGeneration === true`.
  - Dropdown `Actions` (shadcn DropdownMenu) z opcjami:
    - „Generate AI sessions”
    - „View sessions”
    - „Edit plan”
    - „Archive” / „Unarchive”
    - „Delete”
- **Obsługiwane interakcje**:
  - Kliknięcia w opcje menu, wywołujące odpowiednie callbacki.
  - Opcjonalnie klik w cały card → `onViewSessions`.
- **Walidacja**:
  - Brak walidacji formularzy; logika biznesowa:
    - Przy stanie `status = "archived"`:
      - „Archive” jest wyłączone/ukryte, wyświetlane „Unarchive”.
      - Pozostałe akcje mogą być dostępne lub ograniczone wg decyzji produktowej (w planie UI brak wzmianki o blokadzie).
    - `pendingAiGeneration`:
      - Jeśli true, „Generate AI sessions” może być disabled z tooltipem „AI generating…”.
- **Typy**:
  - `PlanCardViewModel`:
    - `id: string`
    - `title: string`
    - `wordCount: number`
    - `status: "active" | "archived"`
    - `createdAt: string` (ISO z backendu)
    - `createdAtRelative: string` (wyliczane w UI)
    - `pendingAiGeneration: boolean`
  - `PlanCardProps`:
    - `plan: PlanCardViewModel`
    - `onGenerateAI(id: string): void`
    - `onViewSessions(id: string): void`
    - `onEdit(id: string): void`
    - `onArchive(id: string): void`
    - `onUnarchive(id: string): void`
    - `onDelete(id: string): void`
- **Propsy**:
  - Jedno źródło prawdy: `plan` oraz zestaw callbacków.

### 4.6. `PlansEmptyState`

- **Opis**: Komponent wyświetlany, gdy użytkownik nie ma jeszcze żadnych planów.
- **Główne elementy**:
  - Ilustracja/ikona.
  - Nagłówek „No study plans yet”.
  - Krótki opis.
  - `Button` „Create Your First Plan”.
- **Obsługiwane interakcje**:
  - `onCreateFirstPlan()` → nawigacja do `/app/plans/new`.
- **Walidacja**:
  - Brak.
- **Typy**:
  - `PlansEmptyStateProps`:
    - `onCreateFirstPlan(): void`
- **Propsy**:
  - Jeden callback `onCreateFirstPlan`.

### 4.7. `PlansPagination`

- **Opis**: Pasek nawigacji między stronami wyników, oparty o dane z `Paginated<StudyPlanListItemDto>`.
- **Główne elementy**:
  - Tekst „Showing X–Y of Z plans”.
  - Przyciski `Previous` / `Next`.
  - Ewentualnie numery stron (prosty paginator).
- **Obsługiwane interakcje**:
  - `onPageChange(newPage: number)`.
- **Walidacja**:
  - Nie pozwala wyjść poza zakres:
    - `newPage >= 1`
    - `newPage <= maxPage` (`Math.ceil(total / pageSize)`).
- **Typy**:
  - `PlansPaginationProps`:
    - `page: number`
    - `pageSize: number`
    - `total: number`
    - `onPageChange(page: number): void`
- **Propsy**:
  - Powyższe, przekazywane z `PlansPage`.

## 5. Typy

### 5.1. DTO z backendu (istniejące)

- **`Paginated<TItem>`** (z `src/types.ts`):
  - `items: TItem[]` – elementy aktualnej strony.
  - `page: number` – numer strony (≥ 1).
  - `pageSize: number` – liczba elementów na stronie (1–100).
  - `total: number` – całkowita liczba elementów.
- **`StudyPlanListItemDto`**:
  - `id: StudyPlanRow["id"]` – identyfikator planu.
  - `title: StudyPlanRow["title"]` – nazwa planu.
  - `sourceMaterial: StudyPlanRow["source_material"]` – pełen tekst źródłowy (niekoniecznie wyświetlany w liście).
  - `wordCount: StudyPlanRow["word_count"]` – liczba słów (wyświetlana w badgu).
  - `status: StudyPlanRow["status"]` – `"active"` lub `"archived"`.
  - `createdAt: StudyPlanRow["created_at"]` – data utworzenia.
  - `updatedAt: StudyPlanRow["updated_at"]` – data ostatniej modyfikacji.
  - `pendingAiGeneration: boolean` – czy istnieje oczekujące generowanie AI.
- **`CreateStudyPlanCommand`** (dla integracji pośredniej – tworzenie planu na innym widoku):
  - `title: string` (1–200 znaków, wymagany).
  - `sourceMaterial: string` (wymagany, walidacja długości słów na poziomie UI na `/app/plans/new`).

### 5.2. Typy zapytań do listy (`StudyPlanListQuerySchemaInput`)

- Oparte o `StudyPlanListQuerySchema` (backend):
  - `status?: "active" | "archived"`
  - `search?: string` (1–200 znaków, trim)
  - `page: number` (domyślnie 1, min 1)
  - `pageSize: number` (domyślnie 20, min 1, max 100)
  - `sort: "created_at" | "updated_at" | "title"` (domyślnie `"created_at"`)
  - `sortOrder: "asc" | "desc"` (domyślnie `"desc"`)

### 5.3. Nowe typy ViewModel dla widoku

- **`PlansFiltersViewModel`**:
  - `search: string` – bieżąca wartość pola wyszukiwania (może być pusta).
  - `status: "all" | "active" | "archived"` – stan UI; `all` mapowane na brak `status` w zapytaniu.
  - `sort: "created_at" | "updated_at" | "title"` – bieżące sortowanie (opcjonalne UI).
  - `sortOrder: "asc" | "desc"` – kierunek sortowania.
  - `page: number` – aktualna strona (≥1).
  - `pageSize: number` – aktualny rozmiar strony (np. 20).
  - *Uzasadnienie*: separacja stanu UI od surowych parametrów query z backendu (np. możliwość posiadania „All” jako dodatkowej wartości).

- **`PlanCardViewModel`**:
  - `id: string`
  - `title: string`
  - `wordCount: number`
  - `status: "active" | "archived"`
  - `createdAt: string` (ISO data z backendu).
  - `createdAtRelative: string` (np. „2 days ago”, obliczane lokalnie).
  - `pendingAiGeneration: boolean`
  - *Uzasadnienie*: pozwala na enkapsulację logiki formatowania (daty, labeli statusu) w mapperze UI.

- **`PlansPageState`**:
  - `filters: PlansFiltersViewModel`
  - `isInitialLoad: boolean`
  - `isRefetching: boolean`
  - `lastError?: ErrorLike`
  - *Uzasadnienie*: spójny stan widoku do zarządzania loadingiem, błędami i filtrami.

### 5.4. Typy propsów komponentów

- `PlansHeaderProps`, `PlansContentProps`, `PlansGridProps`, `PlanCardProps`, `PlansEmptyStateProps`, `PlansPaginationProps` – jak opisano w sekcji 4.

## 6. Zarządzanie stanem

- **Poziom globalny (już zaplanowany w architekturze)**:
  - `AuthContext` (`useAuth`) – dostęp do użytkownika/sekcji chronionej.
  - `React Query` – zarządzanie stanem serwerowym (listy planów).
- **Stan lokalny widoku (`PlansPage`)**:
  - `filters` (`useState` lub `useReducer`):
    - `search`, `status`, `page`, `sort`, `sortOrder`, `pageSize`.
  - `debouncedSearch` – przez `useDebounce` (300 ms) do minimalizacji zapytań.
  - Flagi:
    - `isInitialLoad` – do wyświetlenia pełnego skeletonu tylko przy pierwszym wejściu.
    - `isMutating` – jeśli np. trwa usuwanie planu (disable UI elementów).
- **Custom hooki (dopasowane do architektury z UI-plan)**:
  - **`useStudyPlans(filters: PlansFiltersViewModel)`**:
    - Internie buduje query key: `['study-plans', { status, search, page, pageSize, sort, sortOrder }]`.
    - Wywołuje `GET /api/study-plans` z odpowiednimi parametrami.
    - Zwraca: `{ data?: Paginated<StudyPlanListItemDto>, isLoading, isError, error, refetch, isRefetching }`.
  - **`useDeletePlan()`**:
    - Mutacja: `DELETE /api/study-plans/{planId}` (endpoint spodziewany docelowo).
    - Integracja z React Query:
      - Optimistic update – usunięcie planu z cache.
      - Rollback przy błędzie.
  - **`useArchivePlan()` / `useUnarchivePlan()`**:
    - Mutacje `PATCH /api/study-plans/{planId}` ze zmianą `status`.
    - Optimistic switch statusu w cache.
  - **`useDebounce<T>(value: T, delay: number)`** – generik, zgodnie z planem architektury.
- **Przepływ stanu**:
  - Interakcje w `PlansHeader` aktualizują `filters` w `PlansPage`.
  - Zmiana `filters` → React Query ponownie wykonuje `useStudyPlans`.
  - `PlansContent` / `PlansGrid` są czysto prezentacyjne względem otrzymanych propsów.

## 7. Integracja API

- **Endpoint główny**: `GET /api/study-plans`
  - **Request**:
    - Metoda: `GET`.
    - Query params zgodnie z `StudyPlanListQuerySchema`:
      - `status?: "active" | "archived"`
      - `search?: string` (1–200 znaków, trim).
      - `page?: number` (min 1, default 1).
      - `pageSize?: number` (1–100, default 20).
      - `sort?: "created_at" | "updated_at" | "title"` (default `"created_at"`).
      - `sortOrder?: "asc" | "desc"` (default `"desc"`).
  - **Response (200)**:
    - `Paginated<StudyPlanListItemDto>`:
      - `items` – lista planów.
      - `page`, `pageSize`, `total`.
  - **Response (400)**:
    - `error: { code: "VALIDATION_ERROR", message: "Invalid query parameters", details: [...] }`.
  - **Response (5xx/other)**:
    - Zwracane przez `handleError(error)` – generuje spójny format błędu; frontend traktuje jako błąd ogólny.

- **Endpoint tworzenia planu (pośredni dla tego widoku)**: `POST /api/study-plans`
  - Wykorzystywany w `/app/plans/new`, ale `PlansPage` musi poprawnie zareagować po redirect (np. nowy plan pojawia się na liście).
  - **Request body**: `CreateStudyPlanCommand`.
  - **Response (201)**: nowo utworzony `StudyPlanListItemDto`.

- **Inne działania dostępne z widoku**:
  - **Usuwanie planu**:
    - Spodziewany endpoint: `DELETE /api/study-plans/{planId}`.
    - Frontend:
      - `ConfirmDialog` → po potwierdzeniu anuluje plan + powiązane sesje (zgodnie z PRD).
      - Po sukcesie: `toast("Plan deleted")` + `invalidateQueries(['study-plans'])`.
  - **Archiwizacja/odzarchiwizowanie**:
    - Spodziewany endpoint: `PATCH /api/study-plans/{planId}` z `status: "archived" | "active"`.
  - **Generowanie AI**:
    - Akcja w `PlanCard` **nie** woła bezpośrednio API – otwiera modal `AIGenerationForm`, który z kolei używa `POST /api/study-plans/{planId}/ai-generations`.
  - **Przejście do sesji planu**:
    - Akcja „View Sessions” → nawigacja do `/app/calendar?planId={id}` (przefiltrowany kalendarz).

## 8. Interakcje użytkownika

- **Lista głównych interakcji**:
  - **Wejście na stronę `/app/plans`**:
    - Widok ładuje listę planów (`useStudyPlans`).
    - Użytkownik widzi skeleton lub puste karty dopóki `isLoading === true`.
  - **Wpisanie tekstu w search bar**:
    - Po 300 ms bez zmian → aktualizacja `filters.search` (trim).
    - Wywołanie `useStudyPlans` z nowymi parametrami.
  - **Zmiana filtra statusu**:
    - Aktualizacja `filters.status`, reset `page` do 1.
    - Wywołanie zapytania do API.
  - **Zmiana strony w paginacji**:
    - Kliknięcie `Next` / `Previous` / numer → aktualizacja `filters.page`.
    - Wywołanie zapytania do API.
  - **Kliknięcie „Create New Plan”**:
    - `navigate("/app/plans/new")`.
  - **Kliknięcie któregoś z akcji w `PlanCard`**:
    - `Generate AI` → otwarcie modala `AIGenerationForm` dla danego planu.
    - `View sessions` → `navigate("/app/calendar?planId=id")`.
    - `Edit` → `navigate("/app/plans/{id}/edit")`.
    - `Archive/Unarchive` → wywołanie mutacji (patch) + aktualizacja listy.
    - `Delete` → otwarcie `ConfirmDialog`.
  - **Potwierdzenie usunięcia w `ConfirmDialog`**:
    - Wywołanie `DELETE` mutacji.
    - Optimistic removal z listy; przy błędzie – rollback + toast.

## 9. Warunki i walidacja

- **Walidacja po stronie interfejsu dla parametrów listy**:
  - `search`:
    - Długość 0 → brak parametru (`undefined`).
    - Długość 1–200 → valid.
    - >200 → input przycina wartość lub blokuje dalsze wpisywanie; pokazuje komunikat (opcjonalny tooltip).
  - `status`:
    - Ograniczony do `"all" | "active" | "archived"`.
    - `all` → mapowane na `undefined` w query.
  - `page`:
    - Minimalnie 1, domyślnie 1.
    - UI nie pozwala na `page < 1`.
  - `pageSize`:
    - Stała wartość w UI (np. 20), zgodna z ograniczeniami backendu (1–100).
  - `sort` / `sortOrder`:
    - Ograniczone do zdefiniowanych enumeracji.
    - UI może udostępnić np. 2–3 predefiniowane warianty („Newest first”, „Oldest first”, „Title A–Z”).

- **Walidacja działań na planach**:
  - **Delete**:
    - Zawsze otwierany jest `ConfirmDialog` z ostrzeżeniem (PRD: usunięcie planu kasuje powiązane sesje).
  - **Generate AI**:
    - Jeśli `pendingAiGeneration === true`, akcja może być zablokowana (UI dba, by użytkownik nie inicjował kilku generacji naraz).
  - **Archive**:
    - Zmiana statusu powinna być odzwierciedlona w UI (status badge, filtr).

## 10. Obsługa błędów

- **Błędy ładowania listy planów (`GET /api/study-plans`)**:
  - Sieć/API niedostępne:
    - `PlansContent` wyświetla komunikat „Failed to load study plans” + przycisk „Retry”.
    - Można pokazać także globalny toast.
  - `VALIDATION_ERROR` (np. nieprawidłowe parametry w URL):
    - UI może przywrócić domyślne filtry (page=1, sort domyślne) i ponowić zapytanie.
    - Alternatywnie: prosty komunikat i przycisk „Reset filters”.

- **Błędy mutacji (delete/archive)**:
  - Przy `DELETE` / `PATCH`:
    - W przypadku błędu – toast „Failed to delete/archive plan. Please try again.”.
    - Jeśli używamy optimistic update – rollback stanu listy.

- **Błędy związane z autoryzacją**:
  - 401/403 z API:
    - `useStudyPlans` może przechwycić i zainicjować `signOut()` + redirect do `/login`.

- **Błędy UI (React)**:
  - Cały widok `/app/plans` może być objęty `ErrorBoundary`:
    - Wyświetla komunikat „Something went wrong loading your study plans” + przycisk „Reload”.

## 11. Kroki implementacji

1. **Przygotowanie routingu**:
   - Utwórz plik strony dla `/app/plans` w strukturze Astro (np. `src/pages/app/plans.astro` lub `/plans/index.astro` w zależności od przyjętej konwencji).
   - Owiń zawartość w `AppLayout` (chroniony layout).
   - Upewnij się, że middleware autoryzacji przekierowuje niezalogowanych użytkowników.

2. **Definicja typów frontowych**:
   - Zaimportuj `StudyPlanListItemDto` i `Paginated` z `src/types.ts`.
   - Zdefiniuj lokalne typy: `PlansFiltersViewModel`, `PlanCardViewModel`, interfejsy propsów (`PlansHeaderProps` itd.).

3. **Implementacja hooka `useStudyPlans`**:
   - Utwórz hook w `src/lib/hooks/useStudyPlans.ts` (lub podobnej lokalizacji).
   - Zaimplementuj wywołanie React Query z kluczem zależnym od filtrów i mapowaniem na `Paginated<StudyPlanListItemDto>`.
   - Obsłuż mapowanie `PlansFiltersViewModel` → query params (`StudyPlanListQuerySchemaInput`).

4. **Implementacja komponentu `PlansPage`**:
   - Użyj `useState`/`useReducer` do zarządzania `filters` (`PlansFiltersViewModel`).
   - Użyj `useDebounce` dla `search`.
   - Wywołaj `useStudyPlans` z aktualnymi filtrami.
   - Renderuj strukturę: `PlansHeader` + `PlansContent` + `PlansPagination`.
   - Opcjonalnie synchronizuj filtry z query parametrami URL (parse na `useEffect`, push na zmianę).

5. **Implementacja `PlansHeader`**:
   - Zbuduj pasek z `Input`, `Select`, `Button` (shadcn/ui).
   - Dodaj obsługę: aktualizacja `search` i `status` przez propsy.
   - Zapewnij odpowiednie a11y (labels, `aria-label` dla search).

6. **Implementacja `PlansContent`**:
   - Przyjmuj `data`, `isLoading`, `error` i callbacki mutacji.
   - Zaimplementuj:
     - Stan ładowania (skeletony lub spinner).
     - Stan błędu z przyciskiem „Retry”.
     - `PlansEmptyState` gdy `data?.items.length === 0`.
     - `PlansGrid` w przeciwnym przypadku.

7. **Implementacja `PlansGrid` i `PlanCard`**:
   - Zaimplementuj grid Tailwind zgodnie z układem (3→2→1 kolumny, efekty hover).
   - W `PlanCard`:
     - Sformatuj datę `createdAt` do `createdAtRelative` (pomocnicza funkcja util).
     - Dodaj `StatusBadge`, `WordCountBadge`, `PendingAiIndicator`.
     - Dodaj `DropdownMenu` shadcn z akcjami oraz callbackami.

8. **Implementacja `PlansEmptyState` i `PlansPagination`**:
   - `PlansEmptyState`: karta z CTA „Create Your First Plan” prowadzącą do `/app/plans/new`.
   - `PlansPagination`: prosty paginator (Previous/Next, informacja o zakresie wyników).

9. **Mutacje: delete/archive/unarchive**:
   - Dodaj hooki `useDeletePlan`, `useArchivePlan`, `useUnarchivePlan` (lub użyj bezpośrednio `useMutation` w `PlansPage`).
   - Podłącz je do callbacków w `PlanCard` przez `PlansContent` i `PlansGrid`.
   - Zaimplementuj `ConfirmDialog` dla usuwania, zgodnie z PRD („This will delete X sessions” – na MVP można użyć uproszczonego tekstu).

10. **Integracja z AI i innymi widokami**:
    - W akcji „Generate AI sessions” wywołuj otwarcie modala `AIGenerationForm` z `planId`.
    - W akcji „View sessions” nawiguj do `/app/calendar?planId={id}`.
    - W akcji „Edit” nawiguj do `/app/plans/{id}/edit`.

11. **Dostępność, UX i testy**:
    - Dodaj znaczniki ARIA (np. `aria-label="Study plan card"` dla kart, `aria-label="Actions menu"` dla dropdownu).
    - Zapewnij focus management po usunięciu karty (focus na następną kartę lub nagłówek).
    - Dodaj testy jednostkowe dla mapperów (DTO → ViewModel) i hooka `useStudyPlans`.
    - Dodaj testy komponentowe dla `PlanCard`, `PlansHeader` i `PlansPage` (scenariusze: loading, empty, error, with data).







