# Plan implementacji widoku Create Study Plan

## 1. Przegląd

Widok Create Study Plan umożliwia użytkownikom tworzenie nowego planu nauki poprzez wklejenie materiału tekstowego. Głównym celem widoku jest zebranie tytułu i treści materiału źródłowego, walidacja długości tekstu (200-5000 słów) oraz zapisanie planu w bazie danych. Widok zapewnia użytkownikowi natychmiastową wizualną informację zwrotną o statusie walidacji poprzez kolorowy wskaźnik liczby słów i blokuje przycisk wysyłki do momentu spełnienia wszystkich warunków.

## 2. Routing widoku

**Ścieżka**: `/app/plans/new`  
**Typ**: Chroniony (wymaga uwierzytelnienia)  
**Typ strony**: Astro SSR (Server-Side Rendered) z komponentami React dla formularza

**Przekierowania**:

- Jeśli użytkownik nie jest zalogowany: przekierowanie do `/login` z parametrem `returnUrl=/app/plans/new`
- Po udanym utworzeniu planu: przekierowanie do `/app/plans` z toastem sukcesu

## 3. Struktura komponentów

```
CreateStudyPlanPage (Astro)
├── Layout (Astro)
│   ├── Header/Navigation
│   └── Main Content Area
│       └── CreatePlanLayout (React)
│           └── PlanForm (React)
│               ├── FormHeader
│               ├── TitleInput (shadcn Input)
│               │   └── CharacterCounter
│               ├── SourceMaterialTextarea (shadcn Textarea)
│               │   └── WordCountIndicator (React)
│               │       ├── ProgressBar
│               │       ├── StatusBadge
│               │       └── StatusMessage
│               └── FormActions
│                   ├── CancelButton (shadcn Button)
│                   └── SubmitButton (shadcn Button)
```

## 4. Szczegóły komponentów

### CreatePlanLayout

**Opis komponentu**: Komponent layoutu, który centruje formularz i ogranicza jego maksymalną szerokość dla optymalnej czytelności.

**Główne elementy**:

- `<div>` z `max-width: 700px` (desktop), `max-width: 600px` (tablet), pełna szerokość z paddingiem (mobile)
- Centrowanie przez `margin: 0 auto`
- Padding: `2rem` (desktop/tablet), `1rem` (mobile)

**Obsługiwane interakcje**: Brak (komponent strukturalny)

**Obsługiwana walidacja**: Brak

**Typy**:

- Props: `{ children: React.ReactNode }`

**Propsy**:

```typescript
interface CreatePlanLayoutProps {
  children: React.ReactNode;
}
```

### PlanForm

**Opis komponentu**: Główny komponent formularza zarządzający stanem, walidacją i submisją danych. Wykorzystuje React Hook Form + Zod do walidacji i obsługi formularza. Implementuje auto-save draftu do localStorage oraz ostrzeżenie przed opuszczeniem strony z niezapisanymi zmianami.

**Główne elementy**:

- `<form>` z `onSubmit` handlerem
- `FormHeader` z tytułem "Stwórz nowy plan nauki"
- `TitleInput` - pole tekstowe dla tytułu
- `SourceMaterialTextarea` - duże pole tekstowe dla materiału
- `WordCountIndicator` - wskaźnik liczby słów
- `FormActions` - przyciski akcji

**Obsługiwane interakcje**:

- Submit formularza (Enter lub kliknięcie przycisku)
- Auto-save do localStorage co 5 sekund (debounced)
- Ostrzeżenie beforeunload przy niezapisanych zmianach
- Resetowanie formularza po anulowaniu

**Obsługiwana walidacja**:

- **Tytuł**:
  - Wymagane pole (nie może być puste)
  - Maksymalnie 200 znaków
  - Trim białych znaków
- **Materiał źródłowy**:
  - Wymagane pole (nie może być puste)
  - Minimum 200 słów
  - Maksimum 5000 słów
  - Trim białych znaków
- **Całościowa walidacja formularza**: Submit disabled dopóki wszystkie warunki nie są spełnione

**Typy**:

- `CreateStudyPlanFormData` (local form state)
- `CreateStudyPlanCommand` (API request)
- `StudyPlanDetailsDto` (API response)

**Propsy**:

```typescript
interface PlanFormProps {
  onSuccess?: (plan: StudyPlanDetailsDto) => void;
  onCancel?: () => void;
}
```

### TitleInput

**Opis komponentu**: Pole tekstowe dla tytułu planu z licznikiem znaków i walidacją w czasie rzeczywistym. Wykorzystuje komponent `Input` z shadcn/ui.

**Główne elementy**:

- `<Label>` z tekstem "Tytuł planu"
- `<Input>` (shadcn) z `type="text"`
- `CharacterCounter` pokazujący "X/200"
- Komunikat błędu (jeśli walidacja nie przeszła)

**Obsługiwane interakcje**:

- Auto-focus przy montowaniu komponentu
- Real-time walidacja podczas pisania
- Tab do następnego pola (textarea)

**Obsługiwana walidacja**:

- Maksymalnie 200 znaków (enforced przez `maxLength`)
- Wymagane pole
- Komunikaty błędów:
  - "Tytuł jest wymagany" (jeśli puste)
  - "Tytuł może mieć maksymalnie 200 znaków" (jeśli przekroczono)

**Typy**:

- Props dziedziczone z React Hook Form `Controller`
- `UseFormRegister`, `FieldError`

**Propsy**:

```typescript
interface TitleInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: FieldError;
  autoFocus?: boolean;
}
```

### SourceMaterialTextarea

**Opis komponentu**: Duże pole tekstowe do wklejania materiału źródłowego z możliwością rozszerzania i automatycznym liczeniem słów. Wykorzystuje komponent `Textarea` z shadcn/ui.

**Główne elementy**:

- `<Label>` z tekstem "Materiał źródłowy"
- `<Textarea>` (shadcn) z `min-height: 300px`, resizable
- Helper text: "Wklej tutaj materiał do nauki (min. 200 słów, max. 5000 słów)"
- Komunikat błędu (jeśli walidacja nie przeszła)

**Obsługiwane interakcje**:

- Paste z clipboard
- Manual typing
- Resize (vertical)
- Word count update (debounced 200ms)

**Obsługiwana walidacja**:

- Minimum 200 słów
- Maksimum 5000 słów
- Wymagane pole
- Komunikaty błędów:
  - "Materiał źródłowy jest wymagany" (jeśli pusty)
  - "Materiał musi zawierać co najmniej 200 słów" (jeśli za krótki)
  - "Materiał może zawierać maksymalnie 5000 słów" (jeśli za długi)

**Typy**:

- Props dziedziczone z React Hook Form `Controller`
- `UseFormRegister`, `FieldError`

**Propsy**:

```typescript
interface SourceMaterialTextareaProps {
  value: string;
  onChange: (value: string) => void;
  error?: FieldError;
  wordCount: number;
}
```

### WordCountIndicator

**Opis komponentu**: Wizualny wskaźnik liczby słów z kolorową informacją zwrotną o statusie walidacji. Składa się z paska postępu, odznaki statusu i tekstowej wiadomości. Zapewnia dostępność poprzez użycie nie tylko koloru, ale także ikon i tekstu.

**Główne elementy**:

- `ProgressBar` - pasek pokazujący wypełnienie względem limitu
- `StatusBadge` - kolorowa odznaka z liczbą słów
- `StatusMessage` - tekstowa wiadomość o statusie
- `Icon` - ikona statusu (CheckCircle, AlertCircle, XCircle)

**Obsługiwane interakcje**: Brak (komponent informacyjny)

**Obsługiwana walidacja**:
Komponenty wizualne dla 4 stanów:

1. **< 200 słów (Too Short)**:
   - Kolor: Red (text-red-600, bg-red-100, border-red-600)
   - Ikona: XCircle
   - Tekst: "Za mało słów (wymagane minimum 200)"
   - Progress: Red bar

2. **200-500 słów (Acceptable)**:
   - Kolor: Yellow (text-yellow-600, bg-yellow-100, border-yellow-600)
   - Ikona: AlertCircle
   - Tekst: "{count} słów"
   - Progress: Yellow bar

3. **500-4500 słów (Optimal)**:
   - Kolor: Green (text-green-600, bg-green-100, border-green-600)
   - Ikona: CheckCircle
   - Tekst: "{count} słów"
   - Progress: Green bar

4. **> 5000 słów (Too Long)**:
   - Kolor: Red (text-red-600, bg-red-100, border-red-600)
   - Ikona: XCircle
   - Tekst: "Za dużo słów (maksimum 5000)"
   - Progress: Red bar (overflow)

**Typy**:

- `WordCountStatus` enum
- `WordCountIndicatorProps`

**Propsy**:

```typescript
type WordCountStatus = "too-short" | "acceptable" | "optimal" | "too-long";

interface WordCountIndicatorProps {
  count: number;
  min: number; // 200
  max: number; // 5000
}
```

### FormActions

**Opis komponentu**: Kontener dla przycisków akcji formularza (Submit i Cancel) z responsywnym układem.

**Główne elementy**:

- `<div>` z flex layout (row na desktop, column na mobile)
- `CancelButton` (secondary)
- `SubmitButton` (primary)

**Obsługiwane interakcje**:

- Cancel: Pokazuje dialog potwierdzenia jeśli są niezapisane zmiany
- Submit: Walidacja i wysyłka danych

**Obsługiwana walidacja**: Brak (delegowana do parent)

**Typy**: Brak specyficznych

**Propsy**:

```typescript
interface FormActionsProps {
  onCancel: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  isValid: boolean;
}
```

### CancelButton

**Opis komponentu**: Przycisk anulowania oparty na shadcn Button z wariantem secondary.

**Główne elementy**:

- `<Button variant="secondary">`
- Tekst: "Anuluj"

**Obsługiwane interakcje**:

- Click: wywołuje `onCancel` callback
- Keyboard: Enter/Space

**Obsługiwana walidacja**: Brak

**Typy**: `ButtonProps` z shadcn

**Propsy**:

```typescript
interface CancelButtonProps {
  onClick: () => void;
  disabled?: boolean;
}
```

### SubmitButton

**Opis komponentu**: Przycisk wysyłki formularza z loading state i tooltip wyjaśniającym dlaczego jest wyłączony.

**Główne elementy**:

- `<Button variant="primary">` (lub default)
- Loading spinner (jeśli `isSubmitting`)
- Tekst: "Utwórz plan" (lub "Tworzenie..." jeśli loading)
- `Tooltip` (shadcn) jeśli disabled

**Obsługiwane interakcje**:

- Click: submit formularza
- Hover (gdy disabled): pokazuje tooltip z powodem

**Obsługiwana walidacja**:

- Disabled jeśli:
  - Formularz jest invalid
  - Submission w toku
  - Word count poza zakresem 200-5000

**Typy**: `ButtonProps` z shadcn

**Propsy**:

```typescript
interface SubmitButtonProps {
  onClick: () => void;
  disabled: boolean;
  isLoading: boolean;
  disabledReason?: string;
}
```

## 5. Typy

### DTOs (Data Transfer Objects)

```typescript
// API Request - używany przy POST /api/study-plans
interface CreateStudyPlanCommand {
  title: string; // Non-nullable, 1-200 znaków
  sourceMaterial: string; // Non-nullable, 200-5000 słów
}

// API Response - zwracany po pomyślnym utworzeniu
interface StudyPlanDetailsDto {
  id: string; // UUID
  title: string;
  sourceMaterial: string;
  wordCount: number;
  status: "active" | "archived"; // Zawsze 'active' dla nowego planu
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  totalSessions: number; // Zawsze 0 dla nowego planu
  completedSessions: number; // Zawsze 0 dla nowego planu
  pendingAiGeneration: boolean; // Zawsze false dla nowego planu
}
```

### ViewModels (Frontend State)

```typescript
// Lokalny stan formularza (przed wysłaniem)
interface CreateStudyPlanFormData {
  title: string;
  sourceMaterial: string;
}

// Wartości początkowe formularza
const INITIAL_FORM_VALUES: CreateStudyPlanFormData = {
  title: "",
  sourceMaterial: "",
};

// Draft zapisywany w localStorage
interface StudyPlanDraft extends CreateStudyPlanFormData {
  lastSaved: string; // ISO timestamp
}

// Stan wskaźnika liczby słów
type WordCountStatus = "too-short" | "acceptable" | "optimal" | "too-long";

interface WordCountState {
  count: number;
  status: WordCountStatus;
  message: string;
  isValid: boolean;
}

// Stan submisji formularza
interface FormSubmissionState {
  isSubmitting: boolean;
  error: string | null;
  isDirty: boolean; // Czy formularz został zmieniony od ostatniego save
}
```

### Validation Schema (Zod)

```typescript
import { z } from "zod";

// Schemat walidacji dla formularza
const CreateStudyPlanFormSchema = z.object({
  title: z.string().trim().min(1, "Tytuł jest wymagany").max(200, "Tytuł może mieć maksymalnie 200 znaków"),
  sourceMaterial: z
    .string()
    .trim()
    .min(1, "Materiał źródłowy jest wymagany")
    .refine(
      (val) => {
        const wordCount = countWords(val);
        return wordCount >= 200;
      },
      { message: "Materiał musi zawierać co najmniej 200 słów" }
    )
    .refine(
      (val) => {
        const wordCount = countWords(val);
        return wordCount <= 5000;
      },
      { message: "Materiał może zawierać maksymalnie 5000 słów" }
    ),
});

type CreateStudyPlanFormData = z.infer<typeof CreateStudyPlanFormSchema>;
```

### Props Interfaces

```typescript
// CreatePlanLayout Props
interface CreatePlanLayoutProps {
  children: React.ReactNode;
}

// PlanForm Props
interface PlanFormProps {
  onSuccess?: (plan: StudyPlanDetailsDto) => void;
  onCancel?: () => void;
  initialDraft?: StudyPlanDraft; // Draft z localStorage jeśli istnieje
}

// WordCountIndicator Props
interface WordCountIndicatorProps {
  count: number;
  min: number; // 200
  max: number; // 5000
}

// FormActions Props
interface FormActionsProps {
  onCancel: () => void;
  isSubmitting: boolean;
  isValid: boolean;
}
```

## 6. Zarządzanie stanem

### Local Component State (React Hook Form)

**Główny stan formularza** zarządzany przez **React Hook Form**:

```typescript
const {
  register,
  handleSubmit,
  watch,
  formState: { errors, isSubmitting, isDirty, isValid },
  reset,
} = useForm<CreateStudyPlanFormData>({
  resolver: zodResolver(CreateStudyPlanFormSchema),
  defaultValues: INITIAL_FORM_VALUES,
  mode: "onChange", // Walidacja podczas pisania
});
```

### Custom Hook: useWordCount

**Cel**: Obliczanie liczby słów z debounce dla optymalizacji wydajności.

```typescript
function useWordCount(text: string, delay: number = 200): number {
  const [wordCount, setWordCount] = useState(0);
  const debouncedText = useDebounce(text, delay);

  useEffect(() => {
    const count = countWords(debouncedText);
    setWordCount(count);
  }, [debouncedText]);

  return wordCount;
}
```

**Użycie**:

```typescript
const sourceMaterial = watch("sourceMaterial");
const wordCount = useWordCount(sourceMaterial);
```

### Custom Hook: useAutoSaveDraft

**Cel**: Automatyczne zapisywanie draftu do localStorage co 5 sekund.

```typescript
function useAutoSaveDraft(formData: CreateStudyPlanFormData, isDirty: boolean, interval: number = 5000): void {
  useEffect(() => {
    if (!isDirty) return;

    const timeoutId = setTimeout(() => {
      const draft: StudyPlanDraft = {
        ...formData,
        lastSaved: new Date().toISOString(),
      };
      localStorage.setItem("study-plan-draft", JSON.stringify(draft));
    }, interval);

    return () => clearTimeout(timeoutId);
  }, [formData, isDirty, interval]);
}
```

**Użycie**:

```typescript
const formData = watch();
useAutoSaveDraft(formData, isDirty);
```

### Custom Hook: useUnsavedChangesWarning

**Cel**: Ostrzeżenie przed opuszczeniem strony z niezapisanymi zmianami.

```typescript
function useUnsavedChangesWarning(isDirty: boolean): void {
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);
}
```

**Użycie**:

```typescript
useUnsavedChangesWarning(isDirty);
```

### localStorage Management

**Klucze localStorage**:

- `study-plan-draft` - draft formularza

**Operacje**:

1. **Zapisywanie draftu** (auto-save):

```typescript
const saveDraft = (data: CreateStudyPlanFormData) => {
  const draft: StudyPlanDraft = {
    ...data,
    lastSaved: new Date().toISOString(),
  };
  localStorage.setItem("study-plan-draft", JSON.stringify(draft));
};
```

2. **Wczytywanie draftu** (przy montowaniu):

```typescript
const loadDraft = (): StudyPlanDraft | null => {
  const draftJson = localStorage.getItem("study-plan-draft");
  if (!draftJson) return null;

  try {
    return JSON.parse(draftJson);
  } catch {
    return null;
  }
};
```

3. **Czyszczenie draftu** (po sukcesie lub cancel):

```typescript
const clearDraft = () => {
  localStorage.removeItem("study-plan-draft");
};
```

### State Flow

1. **Montowanie komponentu**:
   - Wczytaj draft z localStorage (jeśli istnieje)
   - Jeśli draft istnieje i jest świeży (< 24h), zapytaj użytkownika czy chce go przywrócić
   - Zainicjuj React Hook Form z wartościami (draft lub puste)

2. **Interakcja użytkownika**:
   - User wpisuje tytuł → onChange → walidacja real-time → update error state
   - User wkleja materiał → onChange → debounced word count → update WordCountIndicator
   - Co 5 sekund (jeśli isDirty) → auto-save do localStorage

3. **Submisja formularza**:
   - User klika "Utwórz plan" → walidacja całego formularza
   - Jeśli valid → isSubmitting = true → POST do API
   - Success → clear draft → redirect do /app/plans → toast sukcesu
   - Error → isSubmitting = false → pokazanie błędu → formularz pozostaje

4. **Anulowanie**:
   - User klika "Anuluj"
   - Jeśli isDirty → pokazanie confirm dialogu
   - Po potwierdzeniu → clear draft → redirect do /app/plans (lub poprzednia strona)

## 7. Integracja API

### Endpoint

**POST** `/api/study-plans`

**Request Headers**:

```
Content-Type: application/json
Authorization: Bearer <jwt-token>  // Automatycznie przez Supabase client
```

**Request Body**:

```typescript
{
  title: string; // 1-200 znaków, trimmed
  sourceMaterial: string; // 200-5000 słów, trimmed
}
```

**Response** (Success - 201 Created):

```typescript
{
  id: string;
  title: string;
  sourceMaterial: string;
  wordCount: number;
  status: "active";
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  totalSessions: 0;
  completedSessions: 0;
  pendingAiGeneration: false;
}
```

**Response** (Error - 400 Bad Request):

```typescript
{
  error: {
    code: "VALIDATION_ERROR";
    message: string;
    details?: Array<{
      path: string[];
      message: string;
    }>;
  }
}
```

**Response** (Error - 409 Conflict - duplicate title):

```typescript
{
  error: {
    code: "DUPLICATE_TITLE";
    message: "Plan o tym tytule już istnieje";
  }
}
```

**Response** (Error - 401 Unauthorized):

```typescript
{
  error: {
    code: "UNAUTHORIZED";
    message: "Wymagane uwierzytelnienie";
  }
}
```

### API Client Function

```typescript
// src/lib/api/study-plans.ts
export async function createStudyPlan(command: CreateStudyPlanCommand): Promise<StudyPlanDetailsDto> {
  const response = await fetch("/api/study-plans", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new APIError(error.error.code, error.error.message, error.error.details);
  }

  return response.json();
}
```

### Form Submission Handler

```typescript
const onSubmit = async (data: CreateStudyPlanFormData) => {
  try {
    // Przygotowanie komendy API
    const command: CreateStudyPlanCommand = {
      title: data.title.trim(),
      sourceMaterial: data.sourceMaterial.trim(),
    };

    // Wywołanie API
    const createdPlan = await createStudyPlan(command);

    // Sukces
    clearDraft(); // Usuń draft z localStorage

    // Toast sukcesu (React Hot Toast lub shadcn Sonner)
    toast.success("Plan utworzony pomyślnie");

    // Redirect do listy planów
    window.location.href = "/app/plans";

    // Opcjonalnie: wywołaj callback
    onSuccess?.(createdPlan);
  } catch (error) {
    // Obsługa błędów
    if (error instanceof APIError) {
      if (error.code === "DUPLICATE_TITLE") {
        // Ustaw błąd na polu title
        setError("title", {
          type: "manual",
          message: "Plan o tym tytule już istnieje",
        });
      } else if (error.code === "VALIDATION_ERROR") {
        // Pokaż błędy walidacji
        toast.error("Sprawdź poprawność wypełnionych pól");
      } else {
        // Ogólny błąd
        toast.error("Nie udało się utworzyć planu. Spróbuj ponownie.");
      }
    } else {
      // Nieoczekiwany błąd
      toast.error("Wystąpił nieoczekiwany błąd");
      console.error("Unexpected error:", error);
    }
  }
};
```

### Typy Request i Response

**Request Type**:

```typescript
interface CreateStudyPlanCommand {
  title: string; // Frontend wysyła tytuł (trimmed, 1-200 chars)
  sourceMaterial: string; // Frontend wysyła materiał (trimmed, 200-5000 words)
  // wordCount NIE jest wysyłany - backend oblicza go automatycznie
}
```

**Response Type**:

```typescript
interface StudyPlanDetailsDto {
  id: string;
  title: string;
  sourceMaterial: string;
  wordCount: number; // Backend zwraca obliczony wordCount
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
  totalSessions: number; // Zawsze 0 dla nowo utworzonego
  completedSessions: number; // Zawsze 0 dla nowo utworzonego
  pendingAiGeneration: boolean; // Zawsze false dla nowo utworzonego
}
```

**Note**: Frontend oblicza `wordCount` lokalnie tylko do celów walidacji i wizualizacji. Backend oblicza i zapisuje własną wartość `wordCount`, która jest źródłem prawdy.

## 8. Interakcje użytkownika

### 1. Wejście na stronę

**Akcja**: User nawiguje do `/app/plans/new`

**Flow**:

1. System sprawdza uwierzytelnienie
   - Jeśli nie zalogowany → redirect do `/login?returnUrl=/app/plans/new`
   - Jeśli zalogowany → kontynuuj
2. System sprawdza localStorage dla draftu
   - Jeśli draft istnieje i jest świeży (< 24h) → pokazanie dialogu "Znaleziono niezapisany draft. Czy chcesz go przywrócić?"
   - Jeśli użytkownik wybierze "Tak" → załaduj draft do formularza
   - Jeśli użytkownik wybierze "Nie" lub draft nie istnieje → formularz z pustymi polami
3. Auto-focus na pole "Tytuł"

### 2. Wpisywanie tytułu

**Akcja**: User wpisuje tytuł w polu tekstowym

**Flow**:

1. Przy każdej zmianie (onChange):
   - Real-time walidacja długości (max 200 znaków)
   - Update licznika znaków "X/200"
   - Jeśli przekroczono limit → pokazanie błędu "Tytuł może mieć maksymalnie 200 znaków"
   - Jeśli puste → pokazanie błędu "Tytuł jest wymagany"
2. Znacznik isDirty ustawiony na true
3. Rozpoczęcie timera auto-save (5s)

### 3. Wklejanie materiału źródłowego

**Akcja**: User wkleja (Ctrl+V) lub wpisuje tekst w textarea

**Flow**:

1. Przy każdej zmianie (onChange):
   - Rozpoczęcie debounced word count (200ms)
   - Po zakończeniu debounce:
     - Obliczenie liczby słów
     - Update WordCountIndicator
     - Zmiana koloru i statusu wskaźnika zgodnie z zasadami:
       - < 200 → Red, "Za mało słów (wymagane minimum 200)"
       - 200-500 → Yellow, "X słów"
       - 500-4500 → Green, "X słów"
       - > 5000 → Red, "Za dużo słów (maksimum 5000)"
     - Update ARIA live region dla screen readers
2. Znacznik isDirty ustawiony na true
3. Rozpoczęcie timera auto-save (5s)

### 4. Auto-save draftu

**Trigger**: 5 sekund od ostatniej zmiany w formularzu (jeśli isDirty = true)

**Flow**:

1. System zapisuje aktualny stan formularza do localStorage
2. Draft zawiera: title, sourceMaterial, lastSaved (timestamp)
3. Brak wizualnej informacji zwrotnej (ciche zapisywanie)
4. Draft nadpisuje poprzedni draft

### 5. Próba wysyłki formularza (przycisk disabled)

**Akcja**: User próbuje kliknąć "Utwórz plan" gdy formularz jest invalid

**Flow**:

1. Przycisk jest disabled i nie reaguje na klik
2. Hover na przycisku pokazuje Tooltip z powodem:
   - Jeśli brak tytułu: "Wprowadź tytuł planu"
   - Jeśli tytuł za długi: "Tytuł może mieć maksymalnie 200 znaków"
   - Jeśli brak materiału: "Wklej materiał źródłowy"
   - Jeśli < 200 słów: "Materiał musi zawierać co najmniej 200 słów"
   - Jeśli > 5000 słów: "Materiał może zawierać maksymalnie 5000 słów"

### 6. Wysyłka formularza (valid)

**Akcja**: User klika "Utwórz plan" gdy formularz jest valid

**Flow**:

1. Walidacja całego formularza (React Hook Form + Zod)
2. Jeśli valid:
   - isSubmitting = true
   - Przycisk zmienia tekst na "Tworzenie..." + spinner
   - Przycisk disabled
   - POST do `/api/study-plans`
3. Oczekiwanie na response:
   - Loading state widoczny (przycisk + opcjonalnie global loader)
4. Success (201):
   - Clear draft z localStorage
   - Toast sukcesu: "Plan utworzony pomyślnie"
   - Redirect do `/app/plans`
   - Nowy plan widoczny na liście (fresh fetch lub optimistic update)
5. Error:
   - isSubmitting = false
   - Przycisk powraca do stanu "Utwórz plan"
   - Obsługa błędów (patrz sekcja 10)

### 7. Anulowanie (bez zmian)

**Akcja**: User klika "Anuluj" gdy formularz jest czysty (isDirty = false)

**Flow**:

1. Natychmiastowy redirect do `/app/plans` (lub poprzednia strona z history)
2. Brak dialogu potwierdzenia
3. Draft NIE jest zapisywany

### 8. Anulowanie (z niezapisanymi zmianami)

**Akcja**: User klika "Anuluj" gdy formularz został zmieniony (isDirty = true)

**Flow**:

1. Pokazanie confirm dialogu (shadcn AlertDialog):
   - Tytuł: "Masz niezapisane zmiany"
   - Treść: "Czy na pewno chcesz opuścić tę stronę? Twoje zmiany zostaną zapisane jako draft."
   - Przyciski: "Anuluj" (zostań), "Opuść" (opuść stronę)
2. Jeśli user wybierze "Anuluj" → zamknięcie dialogu, pozostanie na stronie
3. Jeśli user wybierze "Opuść":
   - Draft jest już zapisany (auto-save)
   - Redirect do `/app/plans`

### 9. Próba opuszczenia strony przez browser navigation

**Akcja**: User próbuje zamknąć tab, wpisać nowy URL lub użyć back button (gdy isDirty = true)

**Flow**:

1. Browser native beforeunload event trigger
2. Browser pokazuje standardowy dialog: "Opuścić stronę? Wprowadzone zmiany mogą zostać utracone."
3. Jeśli user wybierze "Zostań" → pozostanie na stronie
4. Jeśli user wybierze "Opuść" → opuszczenie strony (draft zapisany przez auto-save)

### 10. Keyboard Navigation

**Dostępne skróty**:

- **Tab**: Przejście do następnego pola (title → textarea → cancel → submit)
- **Shift+Tab**: Przejście do poprzedniego pola
- **Enter w polu title**: Przejście focus do textarea
- **Ctrl+Enter lub Cmd+Enter w textarea**: Wysyłka formularza (jeśli valid)
- **Escape**: Anulowanie (równoważne kliknięciu "Anuluj")

## 9. Warunki i walidacja

### Walidacja pola "Tytuł"

**Komponent**: `TitleInput`

**Warunki weryfikowane na froncie**:

1. **Wymagane pole**:
   - Warunek: `title.trim().length > 0`
   - Kiedy sprawdzane: onBlur, onChange (real-time)
   - Komunikat błędu: "Tytuł jest wymagany"
   - Wpływ: Submit button disabled

2. **Maksymalna długość**:
   - Warunek: `title.length <= 200`
   - Kiedy sprawdzane: onChange (real-time)
   - Komunikat błędu: "Tytuł może mieć maksymalnie 200 znaków"
   - Wpływ: Submit button disabled, licznik znaków na czerwono

**Zachowanie UI**:

- Błąd pokazywany inline pod polem
- Pole ma czerwoną ramkę (border-red-600) jeśli błąd
- Licznik znaków na czerwono jeśli przekroczono limit

### Walidacja pola "Materiał źródłowy"

**Komponent**: `SourceMaterialTextarea` + `WordCountIndicator`

**Warunki weryfikowane na froncie**:

1. **Wymagane pole**:
   - Warunek: `sourceMaterial.trim().length > 0`
   - Kiedy sprawdzane: onBlur
   - Komunikat błędu: "Materiał źródłowy jest wymagany"
   - Wpływ: Submit button disabled

2. **Minimalna liczba słów**:
   - Warunek: `wordCount >= 200`
   - Kiedy sprawdzane: onChange (debounced 200ms)
   - Komunikat: WordCountIndicator pokazuje "Za mało słów (wymagane minimum 200)" w kolorze czerwonym
   - Wpływ: Submit button disabled, WordCountIndicator czerwony

3. **Maksymalna liczba słów**:
   - Warunek: `wordCount <= 5000`
   - Kiedy sprawdzane: onChange (debounced 200ms)
   - Komunikat: WordCountIndicator pokazuje "Za dużo słów (maksimum 5000)" w kolorze czerwonym
   - Wpływ: Submit button disabled, WordCountIndicator czerwony

**Zachowanie UI - WordCountIndicator**:

| Liczba słów | Kolor                                                            | Ikona       | Komunikat                             | isValid |
| ----------- | ---------------------------------------------------------------- | ----------- | ------------------------------------- | ------- |
| < 200       | Red (`text-red-600`, `bg-red-100`, `border-red-600`)             | XCircle     | "Za mało słów (wymagane minimum 200)" | false   |
| 200-500     | Yellow (`text-yellow-600`, `bg-yellow-100`, `border-yellow-600`) | AlertCircle | "{count} słów"                        | true    |
| 500-4500    | Green (`text-green-600`, `bg-green-100`, `border-green-600`)     | CheckCircle | "{count} słów"                        | true    |
| > 5000      | Red (`text-red-600`, `bg-red-100`, `border-red-600`)             | XCircle     | "Za dużo słów (maksimum 5000)"        | false   |

### Walidacja całego formularza

**Komponent**: `PlanForm`

**Warunki włączenia przycisku Submit**:

```typescript
const isFormValid =
  title.trim().length > 0 && // Tytuł niepusty
  title.length <= 200 && // Tytuł w limicie
  sourceMaterial.trim().length > 0 && // Materiał niepusty
  wordCount >= 200 && // Min 200 słów
  wordCount <= 5000 && // Max 5000 słów
  !isSubmitting; // Nie w trakcie submisji
```

**Przycisk Submit**:

- Disabled: `!isFormValid`
- Tooltip (gdy disabled): Powód z pierwszej niespełnionej walidacji
- Loading state (gdy isSubmitting): Spinner + tekst "Tworzenie..."

### Walidacja po stronie API

**Backend dodatkowo waliduje** (POST `/api/study-plans`):

1. **Uwierzytelnienie** (401 Unauthorized):
   - Sprawdzenie JWT token
   - Weryfikacja czy użytkownik istnieje

2. **Format JSON** (400 Bad Request):
   - Body musi być valid JSON
   - Komunikat: "Invalid JSON body"

3. **Wymagane pola** (400 Bad Request):
   - `title` i `sourceMaterial` muszą być obecne
   - Komunikat: "Invalid input" + szczegóły w `details`

4. **Długość tytułu** (400 Bad Request):
   - 1-200 znaków (po trim)
   - Komunikat: szczegóły w Zod error

5. **Liczba słów** (400 Bad Request):
   - Backend sam liczy słowa z `sourceMaterial`
   - Warunek: 200-5000 słów
   - Komunikat: szczegóły w Zod error

6. **Unikalność tytułu** (409 Conflict):
   - Sprawdzenie czy użytkownik ma już plan o tym tytule (case-insensitive)
   - Komunikat: "Plan o tym tytule już istnieje"

**Obsługa błędów API w UI**:

- 400 → Pokazanie szczegółów błędów (inline pod polami lub toast)
- 409 → Ustawienie błędu na polu `title` + komunikat
- 401 → Redirect do login
- 500 → Toast "Wystąpił błąd serwera. Spróbuj ponownie później."

### ARIA i Accessibility

**ARIA live regions** dla screen readers:

1. **WordCountIndicator**:

```tsx
<div role="status" aria-live="polite" aria-atomic="true">
  {message} {/* np. "234 słów" lub "Za mało słów" */}
</div>
```

2. **Form errors**:

```tsx
<span id="title-error" role="alert" aria-live="assertive">
  {errors.title?.message}
</span>

<input
  aria-invalid={!!errors.title}
  aria-describedby="title-error"
  {...register('title')}
/>
```

3. **Submit button tooltip**:

```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <Button disabled={!isValid} aria-label={!isValid ? disabledReason : "Utwórz plan nauki"}>
      Utwórz plan
    </Button>
  </TooltipTrigger>
  <TooltipContent>{disabledReason}</TooltipContent>
</Tooltip>
```

## 10. Obsługa błędów

### 1. Błędy walidacji (Client-side)

**Scenariusz**: User wypełnia formularz niepoprawnie

**Obsługa**:

- Inline error messages pod każdym polem (pokazywane real-time)
- Submit button disabled + tooltip z powodem
- WordCountIndicator z kolorowym feedbackiem
- ARIA live regions dla screen readers

**Przykłady**:

- Tytuł pusty → "Tytuł jest wymagany" (pod polem)
- Tytuł > 200 znaków → "Tytuł może mieć maksymalnie 200 znaków" (pod polem)
- Materiał < 200 słów → WordCountIndicator czerwony z tekstem

### 2. Błąd walidacji (Server-side - 400)

**Scenariusz**: Backend wykryje błąd walidacji, którego frontend nie złapał

**Response**:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      {
        "path": ["sourceMaterial"],
        "message": "Materiał musi zawierać co najmniej 200 słów"
      }
    ]
  }
}
```

**Obsługa**:

1. Parse error response
2. Dla każdego błędu w `details`:
   - Ustawić błąd na odpowiednim polu przez `setError()`
   - Błąd pojawi się inline pod polem
3. Dodatkowo pokazać toast: "Sprawdź poprawność wypełnionych pól"
4. Focus na pierwsze pole z błędem

### 3. Błąd duplikacji tytułu (409 Conflict)

**Scenariusz**: User próbuje utworzyć plan o tytule, który już istnieje (case-insensitive)

**Response**:

```json
{
  "error": {
    "code": "DUPLICATE_TITLE",
    "message": "Plan o tym tytule już istnieje"
  }
}
```

**Obsługa**:

1. Ustawić błąd na polu `title`:

```typescript
setError("title", {
  type: "manual",
  message: "Plan o tym tytule już istnieje. Wybierz inny tytuł.",
});
```

2. Błąd pojawi się pod polem title (czerwona ramka + tekst)
3. Focus na pole title
4. User może zmienić tytuł i spróbować ponownie

### 4. Błąd uwierzytelnienia (401 Unauthorized)

**Scenariusz**: Token wygasł lub jest nieprawidłowy

**Response**:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Wymagane uwierzytelnienie"
  }
}
```

**Obsługa**:

1. Zapisać aktualny draft do localStorage (już zapisany przez auto-save)
2. Toast error: "Sesja wygasła. Zaloguj się ponownie."
3. Redirect do `/login?returnUrl=/app/plans/new`
4. Po ponownym zalogowaniu user wróci do formularza
5. Draft zostanie załadowany z localStorage (dialog "Przywrócić draft?")

### 5. Błąd sieciowy (Network Error)

**Scenariusz**: Brak połączenia z internetem lub timeout

**Error**: `fetch()` rzuca network error

**Obsługa**:

1. Catch w try-catch
2. Draft pozostaje zapisany w localStorage (auto-save)
3. Toast error: "Brak połączenia. Sprawdź internet i spróbuj ponownie."
4. isSubmitting = false (przycisk wraca do stanu "Utwórz plan")
5. Pokazanie przycisku "Spróbuj ponownie" w toaście
6. User może naprawić połączenie i kliknąć ponownie Submit

**Implementacja**:

```typescript
try {
  const createdPlan = await createStudyPlan(command);
  // success
} catch (error) {
  if (error instanceof TypeError && error.message.includes("fetch")) {
    // Network error
    toast.error("Brak połączenia. Sprawdź internet i spróbuj ponownie.", {
      action: {
        label: "Spróbuj ponownie",
        onClick: () => handleSubmit(onSubmit)(),
      },
    });
  }
}
```

### 6. Błąd serwera (500 Internal Server Error)

**Scenariusz**: Nieoczekiwany błąd po stronie serwera

**Response**:

```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Wystąpił błąd serwera"
  }
}
```

**Obsługa**:

1. Draft pozostaje zapisany w localStorage
2. Toast error: "Wystąpił błąd serwera. Spróbuj ponownie później."
3. isSubmitting = false
4. Log błędu (console.error) + opcjonalnie wysłanie do error tracking (Sentry)
5. User może spróbować ponownie za chwilę

### 7. Nieoczekiwany błąd (Unexpected)

**Scenariusz**: Błąd JavaScript, błąd parsowania JSON itp.

**Obsługa**:

1. Catch w try-catch
2. Toast error: "Wystąpił nieoczekiwany błąd"
3. isSubmitting = false
4. Log błędu do console + error tracking:

```typescript
console.error("Unexpected error during plan creation:", error);
// Jeśli Sentry skonfigurowane:
// Sentry.captureException(error);
```

5. Pokazanie przycisku "Zgłoś problem" w toaście (link do support)

### 8. Timeout (Request > 30s)

**Scenariusz**: API nie odpowiedziało w rozsądnym czasie

**Obsługa**:

1. Implementacja timeout w fetch:

```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s

try {
  const response = await fetch("/api/study-plans", {
    signal: controller.signal,
    // ...
  });
  clearTimeout(timeoutId);
} catch (error) {
  clearTimeout(timeoutId);
  if (error.name === "AbortError") {
    // Timeout
    toast.error("Operacja trwa zbyt długo. Spróbuj ponownie.");
  }
}
```

2. Draft pozostaje zapisany
3. isSubmitting = false
4. User może spróbować ponownie

### 9. Limit rozmiaru payload (413 Payload Too Large)

**Scenariusz**: sourceMaterial przekracza limit rozmiaru (200KB)

**Response**: 413 lub 400 z odpowiednim komunikatem

**Obsługa**:

1. Frontend nie powinien do tego dopuścić (maxLength enforcement)
2. Jeśli jednak się zdarzy:
   - Toast error: "Materiał jest zbyt duży. Maksymalny rozmiar to 200KB."
   - Sugerowanie podzielenia materiału na mniejsze części
3. User musi skrócić tekst

### Centralized Error Handler

```typescript
// src/lib/utils/error-handler.ts

export class APIError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "APIError";
  }
}

export function handleAPIError(error: unknown): never {
  if (error instanceof APIError) {
    // Structured API error
    throw error;
  }

  if (error instanceof TypeError && error.message.includes("fetch")) {
    // Network error
    throw new APIError("NETWORK_ERROR", "Nie można połączyć się z serwerem. Sprawdź połączenie internetowe.");
  }

  // Unexpected error
  console.error("Unexpected error:", error);
  throw new APIError("UNEXPECTED_ERROR", "Wystąpił nieoczekiwany błąd");
}
```

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury plików

**Cel**: Utworzenie wszystkich potrzebnych plików i folderów.

**Akcje**:

1. Utworzyć stronę Astro: `src/pages/app/plans/new.astro`
2. Utworzyć folder komponentów: `src/components/study-plans/`
3. Utworzyć pliki komponentów React:
   - `src/components/study-plans/CreatePlanLayout.tsx`
   - `src/components/study-plans/PlanForm.tsx`
   - `src/components/study-plans/WordCountIndicator.tsx`
4. Utworzyć custom hooks:
   - `src/lib/hooks/useWordCount.ts`
   - `src/lib/hooks/useDebounce.ts`
   - `src/lib/hooks/useAutoSaveDraft.ts`
   - `src/lib/hooks/useUnsavedChangesWarning.ts`
5. Utworzyć utility functions:
   - `src/lib/utils/word-count.ts` (już istnieje)
   - `src/lib/utils/local-storage.ts`
6. Utworzyć API client:
   - `src/lib/api/study-plans.ts`

**Weryfikacja**: Wszystkie pliki utworzone, importy działają bez błędów TypeScript.

### Krok 2: Implementacja utility functions i custom hooks

**Cel**: Zaimplementować funkcje pomocnicze i hooki wielokrotnego użytku.

**Akcje**:

1. **word-count.ts** (sprawdzić czy już istnieje i działa poprawnie):

```typescript
export function countWords(text: string): number {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}
```

2. **useDebounce.ts**:

```typescript
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

3. **useWordCount.ts**:

```typescript
export function useWordCount(text: string, delay: number = 200): number {
  const [wordCount, setWordCount] = useState(0);
  const debouncedText = useDebounce(text, delay);

  useEffect(() => {
    const count = countWords(debouncedText);
    setWordCount(count);
  }, [debouncedText]);

  return wordCount;
}
```

4. **local-storage.ts**:

```typescript
export function loadDraft(): StudyPlanDraft | null {
  // implementacja
}

export function saveDraft(draft: StudyPlanDraft): void {
  // implementacja
}

export function clearDraft(): void {
  // implementacja
}
```

5. **useAutoSaveDraft.ts** - implementacja zgodnie z sekcją 6
6. **useUnsavedChangesWarning.ts** - implementacja zgodnie z sekcją 6

**Weryfikacja**: Unit testy dla każdego hooka i utility function przechodzą.

### Krok 3: Implementacja WordCountIndicator

**Cel**: Stworzyć komponent wskaźnika liczby słów z kolorową informacją zwrotną.

**Akcje**:

1. Zaimplementować logikę określania statusu (too-short, acceptable, optimal, too-long)
2. Zaimplementować renderowanie z odpowiednim kolorem, ikoną i tekstem
3. Dodać ARIA live region dla accessibility
4. Stylowanie zgodnie z Tailwind color scheme

**Kod szkieletowy**:

```typescript
export function WordCountIndicator({ count, min, max }: WordCountIndicatorProps) {
  const status = getWordCountStatus(count, min, max);
  const { color, icon, message } = getStatusDisplay(status, count);

  return (
    <div className="word-count-indicator">
      {/* Progress bar */}
      {/* Status badge with icon */}
      {/* Status message */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {message}
      </div>
    </div>
  );
}
```

**Weryfikacja**:

- Komponent renderuje się poprawnie dla wszystkich 4 stanów
- Kolory zgodne z design system
- ARIA announcements działają w screen reader

### Krok 4: Implementacja TitleInput

**Cel**: Stworzyć pole tekstowe dla tytułu z licznikiem znaków.

**Akcje**:

1. Użyć shadcn `Input` jako base
2. Dodać `Label` z ARIA associations
3. Dodać licznik znaków "X/200"
4. Integracja z React Hook Form (`Controller`)
5. Pokazywanie błędów inline

**Kod szkieletowy**:

```typescript
export function TitleInput({ value, onChange, error, autoFocus }: TitleInputProps) {
  return (
    <div>
      <Label htmlFor="title">Tytuł planu</Label>
      <Input
        id="title"
        value={value}
        onChange={onChange}
        maxLength={200}
        autoFocus={autoFocus}
        aria-invalid={!!error}
        aria-describedby={error ? 'title-error' : undefined}
      />
      <div className="flex justify-between">
        <span id="title-error" role="alert">{error?.message}</span>
        <span className="text-sm text-muted-foreground">
          {value.length}/200
        </span>
      </div>
    </div>
  );
}
```

**Weryfikacja**:

- Auto-focus działa
- Licznik znaków działa
- Błędy pokazują się poprawnie
- ARIA attributes są poprawne

### Krok 5: Implementacja SourceMaterialTextarea

**Cel**: Stworzyć textarea dla materiału źródłowego.

**Akcje**:

1. Użyć shadcn `Textarea` jako base
2. Dodać `Label` z helper text
3. Ustawić min-height: 300px, resizable: vertical
4. Integracja z React Hook Form
5. Pokazywanie błędów inline

**Kod szkieletowy**:

```typescript
export function SourceMaterialTextarea({ value, onChange, error, wordCount }: Props) {
  return (
    <div>
      <Label htmlFor="sourceMaterial">Materiał źródłowy</Label>
      <p className="text-sm text-muted-foreground">
        Wklej tutaj materiał do nauki (min. 200 słów, max. 5000 słów)
      </p>
      <Textarea
        id="sourceMaterial"
        value={value}
        onChange={onChange}
        className="min-h-[300px] resize-y"
        aria-invalid={!!error}
        aria-describedby={error ? 'source-error' : undefined}
      />
      {error && (
        <span id="source-error" role="alert" className="text-sm text-destructive">
          {error.message}
        </span>
      )}
    </div>
  );
}
```

**Weryfikacja**:

- Textarea jest wystarczająco duża
- Resize działa poprawnie
- Błędy pokazują się poprawnie

### Krok 6: Implementacja FormActions (przyciski)

**Cel**: Stworzyć kontener z przyciskami Submit i Cancel.

**Akcje**:

1. Layout flex (row na desktop, column na mobile)
2. CancelButton z wariantem secondary
3. SubmitButton z wariantem primary + loading state + tooltip
4. Responsive spacing

**Kod szkieletowy**:

```typescript
export function FormActions({ onCancel, isSubmitting, isValid }: Props) {
  return (
    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
      <Button type="button" variant="secondary" onClick={onCancel}>
        Anuluj
      </Button>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="submit"
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Spinner className="mr-2" />
                Tworzenie...
              </>
            ) : (
              'Utwórz plan'
            )}
          </Button>
        </TooltipTrigger>
        {!isValid && (
          <TooltipContent>
            {/* Powód dlaczego disabled */}
          </TooltipContent>
        )}
      </Tooltip>
    </div>
  );
}
```

**Weryfikacja**:

- Przyciski renderują się poprawnie
- Loading state działa
- Tooltip pokazuje poprawny powód
- Responsive layout działa

### Krok 7: Implementacja PlanForm (główny formularz)

**Cel**: Połączyć wszystkie komponenty w funkcjonalny formularz z React Hook Form.

**Akcje**:

1. Setup React Hook Form z Zod schema
2. Integracja wszystkich sub-komponentów (TitleInput, SourceMaterialTextarea, WordCountIndicator)
3. Implementacja useWordCount dla real-time word counting
4. Implementacja useAutoSaveDraft
5. Implementacja useUnsavedChangesWarning
6. Implementacja onSubmit handler
7. Obsługa błędów (try-catch)
8. Loading draft z localStorage przy montowaniu

**Kod szkieletowy**:

```typescript
export function PlanForm({ onSuccess, onCancel }: PlanFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isDirty, isValid },
    setError,
  } = useForm<CreateStudyPlanFormData>({
    resolver: zodResolver(CreateStudyPlanFormSchema),
    defaultValues: loadDraftOrInitial(),
    mode: 'onChange',
  });

  const sourceMaterial = watch('sourceMaterial');
  const wordCount = useWordCount(sourceMaterial);
  const formData = watch();

  useAutoSaveDraft(formData, isDirty);
  useUnsavedChangesWarning(isDirty);

  const onSubmit = async (data: CreateStudyPlanFormData) => {
    // Implementacja z sekcji 7
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Komponenty */}
    </form>
  );
}
```

**Weryfikacja**:

- Formularz działa end-to-end
- Walidacja real-time działa
- Auto-save działa
- Draft loading działa
- Submit działa (z mock API)

### Krok 8: Implementacja CreatePlanLayout

**Cel**: Stworzyć layout wrapper dla formularza.

**Akcje**:

1. Centered layout z max-width
2. Responsive padding
3. Optional header z breadcrumbs (np. "Plany nauki / Nowy plan")

**Kod szkieletowy**:

```typescript
export function CreatePlanLayout({ children }: CreatePlanLayoutProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-[700px] mx-auto">
        <h1 className="text-3xl font-bold mb-6">Stwórz nowy plan nauki</h1>
        {children}
      </div>
    </div>
  );
}
```

**Weryfikacja**: Layout wygląda dobrze na desktop, tablet i mobile.

### Krok 9: Implementacja API client

**Cel**: Stworzyć funkcję do wywołania POST /api/study-plans.

**Akcje**:

1. Implementacja `createStudyPlan()` function
2. Error handling i parsing API responses
3. Type safety (TypeScript)

**Kod**:

```typescript
// src/lib/api/study-plans.ts
export async function createStudyPlan(command: CreateStudyPlanCommand): Promise<StudyPlanDetailsDto> {
  const response = await fetch("/api/study-plans", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new APIError(error.error.code, error.error.message, error.error.details);
  }

  return response.json();
}
```

**Weryfikacja**:

- API call działa z prawdziwym endpointem
- Errors są prawidłowo parsowane i rzucane

### Krok 10: Implementacja strony Astro

**Cel**: Stworzyć stronę `/app/plans/new` w Astro z React komponentami.

**Akcje**:

1. Utworzyć `src/pages/app/plans/new.astro`
2. Zaimplementować route protection (middleware check)
3. Zaimportować i wyrenderować CreatePlanLayout + PlanForm
4. Dodać client directive dla React komponentów

**Kod**:

```astro
---
// src/pages/app/plans/new.astro
import Layout from "@/layouts/Layout.astro";
import CreatePlanLayout from "@/components/study-plans/CreatePlanLayout";
import PlanForm from "@/components/study-plans/PlanForm";

// Route protection przez middleware (zaimplementowane globalnie)
---

<Layout title="Nowy plan nauki">
  <CreatePlanLayout client:load>
    <PlanForm
      client:load
      onSuccess={(plan) => {
        // Redirect do /app/plans
        window.location.href = "/app/plans";
      }}
      onCancel={() => {
        // Redirect do /app/plans
        window.location.href = "/app/plans";
      }}
    />
  </CreatePlanLayout>
</Layout>
```

**Weryfikacja**:

- Strona renderuje się poprawnie
- React komponenty są hydrated
- Route protection działa (redirect gdy niezalogowany)

### Krok 11: Implementacja obsługi błędów API

**Cel**: Dodać pełną obsługę wszystkich scenariuszy błędów API.

**Akcje**:

1. Rozszerzyć `onSubmit` handler o wszystkie case'y błędów (zgodnie z sekcją 10)
2. Zaimplementować toast notifications (użyć shadcn Sonner)
3. Dodać error boundary dla nieoczekiwanych błędów React
4. Dodać retry logic dla network errors

**Weryfikacja**:

- Wszystkie scenariusze błędów obsługiwane poprawnie
- Toast notifications pokazują się
- User otrzymuje jasny feedback

### Krok 12: Implementacja localStorage draft management

**Cel**: Dodać funkcjonalność auto-save i recovery draftu.

**Akcje**:

1. Zaimplementować funkcje: `saveDraft()`, `loadDraft()`, `clearDraft()`
2. Dodać dialog przy montowaniu komponentu: "Znaleziono niezapisany draft. Przywrócić?"
3. Implementacja expire logic (draft starszy niż 24h jest ignorowany)
4. Clear draft po sukcesie lub na żądanie user

**Weryfikacja**:

- Draft jest zapisywany co 5s
- Draft jest ładowany przy powrocie na stronę
- Dialog działa poprawnie
- Draft jest czyszczony po sukcesie

### Krok 13: Accessibility improvements

**Cel**: Upewnić się że wszystkie komponenty są dostępne.

**Akcje**:

1. Dodać ARIA labels do wszystkich interaktywnych elementów
2. Zaimplementować ARIA live regions
3. Dodać focus management (auto-focus, focus trap w dialogach)
4. Test keyboard navigation (Tab, Enter, Escape)
5. Test z screen reader (NVDA lub JAWS)

**Weryfikacja**:

- axe DevTools nie pokazuje żadnych błędów
- Keyboard navigation działa płynnie
- Screen reader ogłasza wszystkie zmiany i błędy

### Krok 14: Responsive design

**Cel**: Upewnić się że widok działa na wszystkich rozmiarach ekranu.

**Akcje**:

1. Test na desktop (>1024px)
2. Test na tablet (768-1023px)
3. Test na mobile (<768px)
4. Dostosować layout FormActions (column na mobile)
5. Dostosować padding i spacing

**Weryfikacja**:

- Layout wygląda dobrze na wszystkich breakpointach
- Wszystkie elementy są klikalne (min 44x44px touch targets)
- Formularz jest użyteczny na małych ekranach

### Krok 15: Performance optimization

**Cel**: Zoptymalizować wydajność widoku.

**Akcje**:

1. Memoizacja komponentów (`React.memo()`)
2. Debounce word count calculation
3. Lazy load nieużywanych komponentów
4. Optymalizacja bundle size (check czy wszystkie importy są tree-shakeable)

**Weryfikacja**:

- Lighthouse score > 90
- No unnecessary re-renders (React DevTools Profiler)
- Bundle size < 50KB (gzipped) dla page

### Krok 16: Dokumentacja

**Cel**: Dodać dokumentację dla developerów.

**Akcje**:

1. Dodać JSDoc comments do wszystkich komponentów i funkcji
2. Utworzyć README.md w folderze `src/components/study-plans/` z opisem architektury
3. Dodać przykłady użycia
4. Dodać troubleshooting guide

**Weryfikacja**: Inny developer może zrozumieć kod bez pomocy.

### Krok 17: Code review i refactoring

**Cel**: Przegląd kodu i cleanup.

**Akcje**:

1. Przegląd kodu pod kątem:
   - Zgodności z workspace rules
   - DRY principle
   - Error handling completeness
   - TypeScript strict mode compliance
2. Refactoring duplikacji
3. Poprawa naming conventions
4. Dodanie missing error cases

**Weryfikacja**:

- Linter nie pokazuje błędów
- TypeScript kompiluje bez errors/warnings
- Code review approval

### Krok 18: Final QA

**Cel**: Końcowe testy przed wdrożeniem.

**Akcje**:

1. Manual testing całego flow
2. Test na różnych przeglądarkach (Chrome, Firefox, Safari, Edge)
3. Test na prawdziwych urządzeniach (mobile, tablet)
4. Test z wolnym internetem (throttling)
5. Test corner cases:
   - Bardzo długi tytuł
   - Bardzo długi tekst (5000+ słów)
   - Special characters w tekście
   - Emoji w tekście
   - Multiple spaces i newlines

**Weryfikacja**: Wszystkie scenariusze działają poprawnie.

### Krok 19: Deployment

**Cel**: Wdrożenie widoku na produkcję.

**Akcje**:

1. Merge do main branch
2. CI/CD pipeline build i test
3. Deploy na staging
4. Final smoke test na staging
5. Deploy na production
6. Monitoring błędów (Sentry)
7. Monitoring performance (Vercel Analytics)

**Weryfikacja**:

- Widok działa na produkcji
- Brak błędów w Sentry
- Performance metrics OK

---

## Podsumowanie

Ten plan implementacji zapewnia systematyczne podejście do stworzenia widoku Create Study Plan w 19 krokach. Każdy krok jest jasno zdefiniowany z konkretnymi akcjami i kryteriami weryfikacji. Implementacja powinna postępować sekwencyjnie, zaczynając od fundamentów (utility functions, hooks) i budując w górę do pełnego, zintegrowanego widoku. Szczególny nacisk jest położony na:

- **Dostępność**: ARIA, keyboard navigation, screen reader support
- **UX**: Real-time validation, auto-save, clear feedback
- **Error handling**: Comprehensive error scenarios
- **Performance**: Debouncing, memoization, lazy loading
- **Dokumentacja**: Jasna dokumentacja dla przyszłych developerów

Widok jest zgodny z wszystkimi wymaganiami PRD, user stories, API plan i tech stack projektu.
