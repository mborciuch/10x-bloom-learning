## Plan implementacji widoku Dodawanie powtórki (Add Session Modal)

## 1. Przegląd

Widok „Dodawanie powtórki” realizuje user story US-010 (manualne dodawanie powtórki) i stanowi rozszerzenie głównego widoku kalendarza.  
Umożliwia użytkownikowi ręczne utworzenie nowej sesji powtórkowej (review session) powiązanej z konkretnym „Planem Nauki”, przy użyciu predefiniowanego szablonu ćwiczenia lub całkowicie własnego polecenia.  
Widok jest zaimplementowany jako modal (`AddSessionModal`) z formularzem (`AddSessionForm`), wywoływany z widoku kalendarza (`CalendarView`) po kliknięciu dnia lub przycisku FAB na urządzeniach mobilnych.  
Po poprawnym zapisaniu nowa sesja jest tworzona przez endpoint `POST /api/review-sessions` i automatycznie pojawia się w kalendarzu dzięki integracji z React Query.

## 2. Routing widoku

- **Główna ścieżka widoku kalendarza**: `/app/calendar` (zgodnie z PRD i planem UI).
- **Widok dodawania powtórki**:
  - Nie posiada osobnej ścieżki; jest renderowany jako modal na stronie `/app/calendar`.
  - Otwarcie modala jest kontrolowane stanem w komponencie `CalendarView` (np. `isAddModalOpen` oraz `selectedDate`).

## 3. Struktura komponentów

- **`CalendarView` (React, strona `/app/calendar`)**
  - Odpowiada za:
    - pobranie danych do kalendarza (hook `useCalendarSessions`),
    - pobranie listy planów nauki (hook `useStudyPlans`),
    - kontrolę stanu modala dodawania sesji,
    - przekazywanie `studyPlans` i `defaultDate` do `AddSessionModal`.
  - Renderuje:
    - `CalendarHeader`
    - `CalendarGrid`
    - `FloatingActionButton`
    - `AddSessionModal`

- **`CalendarGrid` / `CalendarDayCell`**
  - Siatka miesięczna kalendarza.
  - Emituje zdarzenia kliknięcia dnia (`onDayClick(date)`), które powodują otwarcie `AddSessionModal` z odpowiednią datą.

- **`FloatingActionButton`**
  - FAB widoczny głównie na urządzeniach mobilnych.
  - Po kliknięciu otwiera `AddSessionModal` (z domyślną datą, np. dzisiaj).

- **`AddSessionModal` (React, Dialog)**
  - Komponent modala odpowiedzialny za:
    - wyświetlenie nagłówka i opisu,
    - wstrzyknięcie listy planów (`studyPlans`) do formularza,
    - pobranie listy szablonów ćwiczeń (hook `useExerciseTemplates`),
    - konwersję danych formularza (`AddSessionFormData`) do `CreateReviewSessionCommand`,
    - wywołanie mutacji `useCreateSession` (POST `/api/review-sessions`),
    - zamknięcie modala po sukcesie.
  - Dziecko: `AddSessionForm`.

- **`AddSessionForm` (React Hook Form + Zod)**
  - Prezentuje wszystkie pola wymagane do utworzenia sesji:
    - wybór planu, daty, typu ćwiczenia (template/custom),
    - wybór szablonu lub wpisanie własnej etykiety,
    - wybór poziomu taksonomii Blooma,
    - pytania, odpowiedzi i opcjonalne notatki.
  - Wykorzystuje schemat `addSessionSchema` z Zod do walidacji.
  - Na submit przekazuje dane do `onSubmit` (dostarczonego przez `AddSessionModal`).

- **Hooki wspierające**
  - `useCreateSession` – mutacja POST `/api/review-sessions` (tworzenie sesji).
  - `useExerciseTemplates` – zapytanie GET `/api/exercise-templates` (pobieranie szablonów ćwiczeń).
  - `useStudyPlans` – zapytanie GET `/api/study-plans` (lista planów dla selecta).
  - `useCalendarSessions` – zapytanie GET `/api/review-sessions`/kalendarz (odświeżane po utworzeniu sesji).

## 4. Szczegóły komponentów

### 4.1. `CalendarView`

- **Opis komponentu**  
  Główny widok kalendarza, pokazujący wszystkie zaplanowane powtórki (US-011) oraz umożliwiający ręczne dodanie nowej powtórki (US-010) poprzez otwarcie `AddSessionModal`.  
  Odpowiada za routing `/app/calendar`, pobieranie danych i zarządzanie stanem modala.

- **Główne elementy**:
  - Kontener strony (np. `div` z layoutem).
  - `CalendarHeader` – przełączanie miesięcy/filtry.
  - `CalendarGrid` – siatka dni z sesjami.
  - `FloatingActionButton` – mobilny przycisk „Dodaj powtórkę”.
  - `AddSessionModal` – zasilany danymi (`studyPlans`, `defaultDate`).

- **Obsługiwane interakcje**:
  - `onDayClick(date: Date)` z `CalendarGrid`:
    - ustawia `selectedDate`,
    - ustawia `isAddModalOpen = true`.
  - Kliknięcie FAB:
    - ustawia `selectedDate` (np. na dziś),
    - ustawia `isAddModalOpen = true`.
  - `onOpenChange(open: boolean)` z `AddSessionModal`:
    - steruje `isAddModalOpen`.

- **Obsługiwana walidacja**:
  - Brak bezpośredniej walidacji formularzowej; `CalendarView` jedynie zarządza stanem.  
  - Powinien jednak zapewnić, że:
    - do `AddSessionModal` przekazywana jest niepusta lista planów (jeśli użytkownik w ogóle ma plany),
    - `defaultDate` jest poprawną datą (pochodzącą z klikniętego dnia).

- **Typy i ViewModel**:
  - `selectedDate: Date | undefined` – aktualnie wybrany dzień dla modala.
  - `isAddModalOpen: boolean` – czy modal jest otwarty.
  - `studyPlans: StudyPlanListItemDto[]` – lista planów z API.

- **Propsy**:
  - Jako strona, `CalendarView` zwykle nie przyjmuje propsów (dane ładuje sam przez hooki).
  - Jeśli jest opakowany w wrapper (np. `CalendarViewWrapper` w Astro), może otrzymywać wstępne dane przez SSR, ale na poziomie implementacji widoku nie jest to wymagane.

### 4.2. `AddSessionModal`

- **Opis komponentu**  
  Modal (Dialog z shadcn/ui) stanowiący „shell” dla formularza dodawania powtórki.  
  Odpowiada za integrację z API, mapowanie danych formularza na `CreateReviewSessionCommand` oraz zarządzanie zamknięciem modala po sukcesie lub pozostawieniem go otwartego w razie błędu.

- **Główne elementy**:
  - `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`.
  - Dziecko: `AddSessionForm` z propsami:
    - `studyPlans`
    - `onSubmit`
    - `onCancel`
    - `defaultDate`

- **Obsługiwane interakcje**:
  - `open` / `onOpenChange` – kontrola otwarcia/zamknięcia modala.
  - `onSubmit(formData: AddSessionFormData)` – obsługa submitu formularza.
  - `onCancel()` – wywołuje `onOpenChange(false)`.

- **Warunki walidacji (na poziomie komponentu)**:
  - Nie wykonuje własnej walidacji danych użytkownika – deleguje ją do `AddSessionForm` (Zod + React Hook Form).
  - Odpowiada natomiast za:
    - Korrektne zmapowanie `AddSessionFormData` → `CreateReviewSessionCommand`:
      - formatowanie daty do `YYYY-MM-DD`,
      - filtracja pustych linii z pytań/odpowiedzi,
      - ustawienie `exerciseLabel` w zależności od typu ćwiczenia:
        - `custom` → `customExerciseLabel` (fallback „Custom Exercise”),
        - `template` → `template.name` (fallback „Template Exercise”),
      - ustawienie `exerciseTemplateId` tylko wtedy, gdy `exerciseType === "template"`.
    - Zapewnienie, że do API trafią `content.questions` i `content.answers` jako niepuste tablice.

- **Typy (DTO i ViewModel)**:
  - DTO:
    - `CreateReviewSessionCommand` (z `src/types.ts`).
    - `StudyPlanListItemDto` – dla selecta planu.
    - `ExerciseTemplateDto` – dla dropdownu szablonów (pobierane hookiem).
  - ViewModel:

    ```ts
    interface AddSessionModalProps {
      open: boolean;
      onOpenChange: (open: boolean) => void;
      studyPlans: StudyPlanListItemDto[];
      defaultDate?: Date;
    }
    ```

- **Propsy**:
  - `open` – sterowanie widocznością modala z rodzica (`CalendarView`).
  - `onOpenChange` – callback zmiany stanu otwarcia.
  - `studyPlans` – lista dostępnych planów dla użytkownika.
  - `defaultDate` – data, dla której ma zostać wstępnie ustawione pole `reviewDate` w formularzu.

### 4.3. `AddSessionForm`

- **Opis komponentu**  
  Formularz React Hook Form z walidacją w Zod (schema `addSessionSchema`), który zbiera wszystkie dane wymagane przez `CreateReviewSessionCommand` i przekazuje je w formie `AddSessionFormData` do rodzica (modala).  
  Obsługuje zarówno wybór szablonu ćwiczenia, jak i tworzenie całkowicie własnego ćwiczenia.

- **Główne elementy HTML / komponenty dzieci**:
  - `Form` (shadcn/ui) + `useForm<AddSessionFormData>`.
  - Pole „Study Plan”:
    - `Select` (`SelectTrigger`, `SelectContent`, `SelectItem`) z `studyPlans`.
  - Pole „Review Date”:
    - `Popover` + `Button` (trigger) + `Calendar` (shadcn/ui).
  - Pole „Exercise Type”:
    - `RadioGroup` z opcjami `"custom"` i `"template"`.
  - Pole „Exercise Template” (warunkowo, gdy `exerciseType === "template"`):
    - `Select` z `ExerciseTemplateDto[]` (hook `useExerciseTemplates`).
  - Pole „Exercise Label” (warunkowo, gdy `exerciseType === "custom"`):
    - `Input` (tekst, min. 3, max. 200 znaków).
  - Pole „Bloom's Taxonomy Level”:
    - `Select` z wartościami: `remember`, `understand`, `apply`, `analyze`, `evaluate`, `create`.
  - Pole „Questions”:
    - `Textarea`, jedna linia = jedno pytanie, min. 1 pytanie, max. 50.
  - Pole „Answers”:
    - `Textarea`, jedna linia = jedna odpowiedź; liczba odpowiedzi musi odpowiadać liczbie pytań.
  - Pole „Notes (Optional)”:
    - `Textarea`, maks. 1000 znaków.
  - Sekcja akcji:
    - `Button type="button"` – Cancel.
    - `Button type="submit"` – Create Session.

- **Obsługiwane interakcje**:
  - Zmiany w każdym polu formularza (controlled by RHF).
  - Przełączanie `exerciseType`:
    - dynamiczna zmiana sekcji (template select vs custom label).
  - Submit formularza:
    - wywołuje `form.handleSubmit(handleSubmit)`,
    - w `handleSubmit` wywoływane jest `onSubmit(data)` przekazane z modala.
  - Cancel:
    - wywołuje `onCancel()` z propsów.

- **Obsługiwana walidacja (szczegółowa)**:
  - Definiowana w `addSessionSchema`:
    - `studyPlanId`: `z.string().uuid("Please select a valid study plan")`.
    - `reviewDate`: `z.date` z komunikatami `required_error` i `invalid_type_error`.
    - `exerciseType`: `z.enum(["template", "custom"])`.
    - `exerciseTemplateId`: `z.string().uuid().optional()`.
    - `customExerciseLabel`: `z.string().optional()`.
    - `taxonomyLevel`: `z.enum(["remember", "understand", "apply", "analyze", "evaluate", "create"])`.
    - `questionsText`: `z.string().min(1, "At least one question is required")`.
    - `answersText`: `z.string().min(1, "At least one answer is required")`.
    - `notes`: `z.string().max(1000).optional()`.
    - Refine 1 (custom label):
      - jeśli `exerciseType === "custom"`, `customExerciseLabel` musi istnieć, mieć min. 3 i max. 200 znaków.
    - Refine 2 (template id):
      - jeśli `exerciseType === "template"`, `exerciseTemplateId` musi być ustawione.
    - Refine 3 (zakres daty):
      - `reviewDate` musi być w przedziale `[today - 1 rok, today + 5 lat]`.
    - Refine 4 (maksymalna liczba pytań):
      - `questionsText` → split po `\n`, filtr trim, max. 50 wierszy.
    - Refine 5 (dopasowanie liczby odpowiedzi):
      - liczba odpowiedzi po split i trim musi równać się liczbie pytań.

- **Typy (DTO i ViewModel)**:
  - `AddSessionFormData` (ViewModel formularza – pochodna `addSessionSchema`):

    ```ts
    type AddSessionFormData = {
      studyPlanId: string;
      reviewDate: Date;
      exerciseType: "template" | "custom";
      exerciseTemplateId?: string;
      customExerciseLabel?: string;
      taxonomyLevel: "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create";
      questionsText: string;
      answersText: string;
      notes?: string;
    };
    ```

  - `StudyPlanListItemDto` – lista planów do selecta.

- **Propsy**:

  ```ts
  interface AddSessionFormProps {
    studyPlans: StudyPlanListItemDto[];
    onSubmit: (data: AddSessionFormData) => Promise<void>;
    onCancel: () => void;
    defaultDate?: Date;
  }
  ```

### 4.4. Hook `useCreateSession`

- **Opis**  
  Custom hook oparty na React Query `useMutation`, odpowiedzialny za wykonanie `POST /api/review-sessions` z payloadem `CreateReviewSessionCommand` oraz za obsługę efektów ubocznych (toasty, invalidacja cache).

- **Obsługiwane interakcje**:
  - `mutateAsync(command: CreateReviewSessionCommand)` – wywoływane z `AddSessionModal` po przemapowaniu danych formularza.

- **Walidacja / warunki**:
  - Sprawdza `response.ok`:
    - na sukces: parsuje `ReviewSessionDto`, pokazuje toast „Session created!”, invaliduje:
      - `["review-sessions"]`
      - `["ai-review-sessions"]`
      - `["study-plans"]`
    - na błąd: próbuje odczytać `error.message` z JSON i rzuca `Error`.

- **Typy**:
  - `CreateReviewSessionCommand`
  - `ReviewSessionDto`

### 4.5. Hook `useExerciseTemplates`

- **Opis**  
  Hook oparty na React Query `useQuery`, pobiera stronowaną listę `ExerciseTemplateDto` z endpointu `/api/exercise-templates` z opcjonalnymi filtrami (`isActive`, `taxonomyLevel`, `search`, `page`, `pageSize`).

- **Zastosowanie w widoku**:
  - W `AddSessionModal` (lub bezpośrednio w `AddSessionForm`): źródło danych dla pola „Exercise Template”.

- **Typy**:
  - `Paginated<ExerciseTemplateDto>`
  - `TaxonomyLevel` (jeśli filtrujemy po poziomie Blooma).

## 5. Typy

### 5.1. Typy DTO z backendu (z `src/types.ts`)

- **`CreateReviewSessionCommand`**:
  - `studyPlanId: string` – UUID planu, do którego należy sesja.
  - `exerciseTemplateId?: string | null` – UUID wybranego szablonu; `null/undefined` oznacza custom exercise.
  - `exerciseLabel: string` – etykieta ćwiczenia widoczna w kalendarzu i sesji.
  - `reviewDate: string` – data powtórki, w formacie `YYYY-MM-DD`.
  - `taxonomyLevel: TaxonomyLevel` – poziom Blooma (`"remember" | ... | "create"`).
  - `content: ReviewSessionContentDto` – struktura zawierająca pytania/odpowiedzi/hinty.
  - `notes?: string | null` – dodatkowe notatki użytkownika.

- **`ReviewSessionContentDto`**:
  - `questions: string[]` – lista pytań (min. 1).
  - `answers: string[]` – lista odpowiedzi (min. 1, dopasowana do `questions`).
  - `hints?: string[]` – opcjonalne podpowiedzi (na tym etapie zwykle pusta tablica).

- **`StudyPlanListItemDto`**:
  - `id: string`
  - `title: string`
  - `sourceMaterial: string`
  - `wordCount: number`
  - `status: string` (enum statusu planu)
  - `createdAt: string`
  - `updatedAt: string`

- **`ExerciseTemplateDto`**:
  - `id: string`
  - `name: string`
  - `description: string`
  - `defaultTaxonomyLevel: TaxonomyLevel`
  - `metadata: unknown`
  - `isActive: boolean`
  - `createdAt: string`
  - `updatedAt: string`

### 5.2. Typy ViewModel dla widoku

- **`AddSessionFormData`** (ViewModel formularza) – patrz sekcja 4.3.

- **`CalendarView` state**:

  ```ts
  interface CalendarViewState {
    selectedDate?: Date;
    isAddModalOpen: boolean;
  }
  ```

- **Ewentualne typy pomocnicze** (jeśli nie istnieją w `calendar.types.ts`):

  ```ts
  interface CalendarDaySessions {
    date: Date;
    sessions: {
      id: string;
      studyPlanTitle: string;
      exerciseLabel: string;
      status: string;
    }[];
  }
  ```

  (ten typ służy głównie do renderowania siatki kalendarza i nie jest bezpośrednio częścią widoku dodawania, ale może być używany przez `CalendarGrid`).

## 6. Zarządzanie stanem

- **Poziom widoku (`CalendarView`)**:
  - `useState` do kontroli:
    - `isAddModalOpen` – otwarcie/zamknięcie modala.
    - `selectedDate` – domyślna data dla nowej powtórki.
  - Stan jest modyfikowany w reakcjach na:
    - kliknięcia w `CalendarDayCell`,
    - kliknięcie FAB,
    - zamknięcie modala (`onOpenChange(false)`).

- **Poziom formularza (`AddSessionForm`)**:
  - `useForm<AddSessionFormData>` z `zodResolver(addSessionSchema)`:
    - `defaultValues`:
      - `studyPlanId`: pierwszy plan z listy (jeśli istnieje),
      - `reviewDate`: `defaultDate` lub `new Date()`,
      - `exerciseType`: `"custom"`,
      - `taxonomyLevel`: `"remember"`,
      - puste `questionsText`, `answersText`, `notes`.
    - `form.watch("exerciseType")` – do dynamicznego przełączania szablon/custom.
    - `formState.isSubmitting` – do blokowania przycisków podczas wysyłki.

- **Hooki danych (React Query)**:
  - `useExerciseTemplates()` – zarządza stanem ładowania (`isLoading`), błędu (`isError`) i danymi (`templatesPage`).
  - `useCreateSession()` – stan mutacji (`isPending`, `error`), obsługa sukcesu/błędu, invalidacja cache.
  - `useStudyPlans()` i `useCalendarSessions()` – zapewniają dane dla listy planów i kalendarza.

- **Custom hook**:
  - Obecny kod nie wymaga dodatkowego custom hooka dla stanu modala; jednak można w przyszłości wyodrębnić np. `useAddSessionModalState` jeśli logika się rozrośnie.

## 7. Integracja API

- **Endpoint**: `POST /api/review-sessions`

- **Żądanie**:
  - Typ: `CreateReviewSessionCommand`.
  - Tworzone w `AddSessionModal` na podstawie `AddSessionFormData`:

    ```ts
    const command: CreateReviewSessionCommand = {
      studyPlanId: formData.studyPlanId,
      exerciseLabel, // wyliczone z custom label lub template name
      exerciseTemplateId: formData.exerciseType === "template" ? formData.exerciseTemplateId : undefined,
      reviewDate: format(formData.reviewDate, "yyyy-MM-dd"),
      taxonomyLevel: formData.taxonomyLevel,
      content: {
        questions: formData.questionsText.split("\n").filter((q) => q.trim()),
        answers: formData.answersText.split("\n").filter((a) => a.trim()),
      },
      notes: formData.notes || undefined,
    };
    ```

- **Odpowiedź**:
  - Typ: `ReviewSessionDto` (kompletny obiekt sesji).
  - `useCreateSession` po sukcesie:
    - wyświetla toast sukcesu,
    - invaliduje query:
      - `["review-sessions"]` (widok kalendarza),
      - `["ai-review-sessions"]` (jeśli używane),
      - `["study-plans"]` (dla zliczeń sesji na plan).

- **Obsługa błędów API**:
  - `useCreateSession`:
    - przy `!response.ok` próbuje odczytać `error.message` z JSON i rzuca `Error`.
    - w `onError` pokazuje toast z nagłówkiem „Failed to create session” i opisem `error.message || "Please check your input and try again."`.
  - Modal pozostaje otwarty, użytkownik może poprawić dane w formularzu i spróbować ponownie.

- **GET `/api/exercise-templates`**:
  - Typ odpowiedzi: `Paginated<ExerciseTemplateDto>`.
  - Używany do wypełnienia selecta „Exercise Template”.

## 8. Interakcje użytkownika

- **Kliknięcie dnia w kalendarzu**:
  - Użytkownik klika w komórkę dnia (`CalendarDayCell`).
  - `CalendarView`:
    - ustawia `selectedDate = clickedDate`,
    - ustawia `isAddModalOpen = true`.
  - `AddSessionModal` otwiera się z `defaultDate = selectedDate`.

- **Kliknięcie FAB (mobilne)**:
  - Użytkownik klika `FloatingActionButton`.
  - `CalendarView`:
    - ustawia `selectedDate = today` (lub ostatnio podświetlana data),
    - ustawia `isAddModalOpen = true`.

- **Wypełnianie formularza**:
  - Wybór planu:
    - z rozwijanej listy `studyPlans` użytkownik wybiera plan.
  - Ustawienie daty:
    - użytkownik otwiera `Popover`, wybiera datę w `Calendar`; walidacja wymusza, aby była w dozwolonym przedziale.
  - Wybór typu ćwiczenia:
    - RadioGroup: `"Custom Exercise"` lub `"Use Template"`.
  - W przypadku `"Use Template"`:
    - użytkownik wybiera template z selecta.
  - W przypadku `"Custom Exercise"`:
    - użytkownik wpisuje własną etykietę w `Input` (min. 3 znaki).
  - Wybór poziomu Blooma:
    - select z 6 poziomami.
  - Wpisanie pytań i odpowiedzi:
    - każde w osobnym wierszu w `Textarea`.
    - liczba odpowiedzi musi odpowiadać liczbie pytań.
  - Notatki (opcjonalne):
    - dodatkowe komentarze do sesji.

- **Anulowanie (Cancel)**:
  - Użytkownik klika przycisk „Cancel”.
  - `AddSessionForm` wywołuje `onCancel()` → `AddSessionModal` zamyka dialog przez `onOpenChange(false)`.

- **Zatwierdzenie (Create Session)**:
  - Użytkownik klika „Create Session”.
  - Jeśli walidacja frontowa (Zod) przechodzi:
    - wywoływany jest `useCreateSession.mutateAsync(command)`.
  - Na sukces:
    - pojawia się toast „Session created!”,
    - modal zamyka się,
    - kalendarz odświeża się (nowa sesja widoczna w odpowiednim dniu).
  - Na błąd:
    - wyświetlany jest toast z informacją o błędzie,
    - modal pozostaje otwarty, użytkownik może poprawić dane.

## 9. Warunki i walidacja

- **Zgodność z wymaganiami API**:
  - `studyPlanId`:
    - UI wymusza wybór z istniejących planów (ważny UUID).
  - `reviewDate`:
    - musi być ustawiona,
    - walidacja: `z.date` + refine (1 rok wstecz, 5 lat do przodu),
    - formatowanie przed wysłaniem: `YYYY-MM-DD`.
  - `exerciseType`:
    - wyłącznie `"template"` lub `"custom"`.
  - `exerciseTemplateId`:
    - wymagane, gdy `exerciseType === "template"`,
    - walidowane przez Zod refine.
  - `customExerciseLabel`:
    - wymagane, gdy `exerciseType === "custom"`,
    - min. 3, max. 200 znaków.
  - `taxonomyLevel`:
    - jedna z wartości Blooma,
    - wybierana z kontrolowanego selecta.
  - `content.questions` / `content.answers`:
    - front pilnuje:
      - min. 1 pytanie i 1 odpowiedź (min w Zod),
      - max. 50 pytań (refine),
      - liczba odpowiedzi == liczbie pytań (refine).
  - `notes`:
    - max. 1000 znaków (Zod).

- **Wpływ walidacji na UI**:
  - Błędy walidacji Zod wyświetlane są przy polach jako `FormMessage`.
  - Przy niepoprawnych danych przycisk „Create Session” nie wysyła requestu (RHF zatrzymuje submit).
  - Przy błędach API (np. `400` z backendu) użytkownik otrzymuje toast z informacją, ale pola pozostają wprowadzone (może je poprawić).

## 10. Obsługa błędów

- **Błędy walidacji po stronie klienta**:
  - Puste pola wymagane, niepoprawny format daty, zbyt długa etykieta, zbyt wiele pytań, niezgodna liczba odpowiedzi:
    - natychmiastowe komunikaty pod polami.

- **Błędy API (serwer)**:
  - `400` (validation error), `404` (plan/template not found), `409` (ownership mismatch), inne 5xx:
    - obsługa w `useCreateSession.onError`,
    - toast z nagłówkiem „Failed to create session” oraz szczegółem z `error.message`, jeśli dostępny.

- **Błędy sieciowe**:
  - Problemy z połączeniem lub niedostępność serwera:
    - ujęte w tym samym bloku `onError`,
    - zalecany generczny komunikat „Please check your input and try again.” (lub w przyszłości spolszczony).

- **Błędy ładowania szablonów**:
  - `useExerciseTemplates` może zwrócić błąd:
    - w minimalnej wersji: nie renderujemy listy (pusta) i pozwalamy użytkownikowi użyć custom exercise,
    - opcjonalnie: wyświetlamy komunikat tekstowy „Failed to load templates” w opisie pola.

## 11. Kroki implementacji

1. **Przygotowanie typów**  
   - Zweryfikuj, że `CreateReviewSessionCommand`, `ReviewSessionContentDto`, `StudyPlanListItemDto`, `ExerciseTemplateDto` oraz `TaxonomyLevel` są poprawnie zdefiniowane w `src/types.ts` i eksportowane.  
   - Zadbaj, by typ `AddSessionFormData` (z `addSessionSchema`) był eksportowany i używany jako ViewModel formularza.

2. **Implementacja / weryfikacja hooków danych**  
   - Upewnij się, że `useExerciseTemplates` zwraca listę szablonów w formie `Paginated<ExerciseTemplateDto>`.  
   - Zweryfikuj, że `useCreateSession` wysyła `POST /api/review-sessions` zgodnie z `CreateReviewSessionCommand` i obsługuje toasty oraz invalidację cache.

3. **Implementacja `AddSessionForm`**  
   - Zaimplementuj formularz z użyciem React Hook Form + Zod (`addSessionSchema`), zgodnie z polami opisanymi w sekcji 4.3.  
   - Skonfiguruj walidację (schemat + refine’y) tak, by pokrywała wszystkie warunki PRD i planu API.  
   - W renderze:
     - dodaj pola Select, DatePicker, RadioGroup, Textarea, Input, Textarea dla notatek oraz przyciski akcji.  

4. **Implementacja `AddSessionModal`**  
   - Utwórz komponent `AddSessionModal` z propsami `open`, `onOpenChange`, `studyPlans`, `defaultDate`.  
   - Wewnątrz:
     - użyj hooka `useCreateSession()`,  
     - pobierz szablony przez `useExerciseTemplates()`,  
     - zaimplementuj `handleSubmit(formData: AddSessionFormData)`:
       - przemapuj dane do `CreateReviewSessionCommand`,  
       - wywołaj `createSessionMutation.mutateAsync(command)`,  
       - na sukces zamknij modal (`onOpenChange(false)`),  
       - na błąd nie zamykaj modala (log + rely on toast).  
   - Owiń `AddSessionForm` w `DialogContent` wraz z nagłówkiem i opisem.

5. **Integracja modala z `CalendarView`**  
   - W `CalendarView` dodaj stan:
     - `const [isAddModalOpen, setIsAddModalOpen] = useState(false);`
     - `const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);`
   - Podłącz eventy:
     - `onDayClick(date)` → `setSelectedDate(date)`, `setIsAddModalOpen(true)`.  
     - FAB onClick → `setSelectedDate(today)`, `setIsAddModalOpen(true)`.  
   - Renderuj `AddSessionModal` z propsami:
     - `open={isAddModalOpen}`,
     - `onOpenChange={setIsAddModalOpen}`,
     - `studyPlans={plans}`,
     - `defaultDate={selectedDate}`.

6. **Odświeżanie kalendarza po utworzeniu sesji**  
   - Upewnij się, że hook `useCalendarSessions` używa klucza query `["review-sessions", ...]` zgodnego z invalidacją w `useCreateSession`.  
   - Zweryfikuj, że po sukcesie mutacji kalendarz automatycznie rerenderuje się ze zaktualizowanymi danymi.

7. **Walidacja UX / testy ręczne**  
   - Sprawdź scenariusze:
     - dodanie sesji z custom exercise,  
     - dodanie sesji z template,  
     - brak wypełnienia wymaganych pól,  
     - różna liczba pytań i odpowiedzi,  
     - data spoza dozwolonego zakresu.  
   - Upewnij się, że komunikaty o błędach są jasne i przypisane do odpowiednich pól.

8. **Obsługa błędów sieci i API**  
   - Przetestuj zachowanie przy sztucznie wywołanym błędzie API (np. tymczasowe wyłączenie endpointu lub wymuszenie `throw`).  
   - Zweryfikuj, że toasty z błędami pojawiają się poprawnie i formularz pozostaje edytowalny.

9. **Dopracowanie dostępności i responsywności**  
   - Sprawdź, czy modal ma poprawne atrybuty ARIA (dostarczane przez shadcn/ui `Dialog`).  
   - Upewnij się, że formularz jest czytelny na małych ekranach (Tailwind klasy szerokości, max height, scroll wewnątrz modala).  
   - Zweryfikuj focus management (po otwarciu modala focus na pierwszym polu formularza).

10. **Porządki i dokumentacja**  
   - Zadbaj o spójność nazewnictwa (np. label vs exerciseLabel) i komentarze w kodzie (krótkie JSDoc przy kluczowych funkcjach/mapowaniach).  
   - Uaktualnij ewentualne README lub dokumentację komponentów, aby odnotować nowy flow manualnego dodawania powtórek (US-010).



