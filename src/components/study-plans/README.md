# Study Plans Components

Komponenty do tworzenia i zarządzania planami nauki.

## Struktura

```
study-plans/
├── CreatePlanWrapper.tsx      # Wrapper z React Query context
├── CreatePlanLayout.tsx       # Layout z max-width i centrowanием
├── PlanForm.tsx              # Główny formularz z React Hook Form
├── TitleInput.tsx            # Pole tytułu z licznikiem znaków
├── SourceMaterialTextarea.tsx # Textarea dla materiału źródłowego
├── WordCountIndicator.tsx    # Wskaźnik liczby słów z kolorami
├── FormActions.tsx           # Przyciski Submit i Cancel
├── planFormSchema.ts         # Zod validation schema
└── index.ts                  # Eksporty publiczne
```

## Użycie

### W stronie Astro

```astro
---
import AppLayout from "@/layouts/AppLayout.astro";
import { CreatePlanWrapper } from "@/components/study-plans/CreatePlanWrapper";
---

<AppLayout title="Nowy plan nauki">
  <CreatePlanWrapper client:only="react" />
</AppLayout>
```

### Standalone (z React Query)

```tsx
import { CreatePlanLayout, PlanForm } from "@/components/study-plans";

function MyPage() {
  return (
    <CreatePlanLayout>
      <PlanForm 
        onSuccess={(plan) => console.log("Created:", plan)}
        onCancel={() => window.history.back()}
      />
    </CreatePlanLayout>
  );
}
```

## Funkcjonalności

### Auto-save Draft
Formularz automatycznie zapisuje draft do localStorage co 5 sekund:
- Klucz: `study-plan-draft`
- Expiry: 24 godziny
- Dialog przywracania przy ponownym wejściu

### Walidacja

**Title:**
- Wymagane
- Max 200 znaków
- Real-time validation

**Source Material:**
- Wymagane
- Min 200 słów, max 5000 słów
- Debounced word count (200ms)

### Word Count Indicator

Pokazuje status z kolorami:
- **< 200 słów**: Red - "Za mało słów"
- **200-500 słów**: Yellow - "X słów"
- **500-4500 słów**: Green - "X słów" (optimal)
- **> 5000 słów**: Red - "Za dużo słów"

### Error Handling

1. **DUPLICATE_TITLE (409)** - Error na polu title
2. **VALIDATION_ERROR (400)** - Inline errors + toast
3. **UNAUTHORIZED (401)** - Redirect do login z returnUrl
4. **NETWORK_ERROR** - Toast z przyciskiem retry
5. **INTERNAL_SERVER_ERROR (500)** - Toast error
6. **Unexpected** - Generic toast + console.error

## Accessibility

- ✅ ARIA labels i live regions
- ✅ Keyboard navigation (Tab, Enter, Escape)
- ✅ Screen reader support
- ✅ Focus management
- ✅ Error announcements

## Dependencies

- react-hook-form - Form state management
- @hookform/resolvers/zod - Validation
- zod - Schema validation
- sonner - Toast notifications
- @tanstack/react-query - Data fetching (w wrapper)
- lucide-react - Icons

## Custom Hooks

- `useWordCount(text, delay)` - Debounced word counting
- `useAutoSaveDraft(formData, isDirty, interval)` - Auto-save to localStorage
- `useUnsavedChangesWarning(isDirty)` - Beforeunload warning
- `useDebounce(value, delay)` - Generic debounce

## API Integration

```typescript
// POST /api/study-plans
const command: CreateStudyPlanCommand = {
  title: string,
  sourceMaterial: string,
};

const response: StudyPlanDetailsDto = await createStudyPlan(command);
```

## Testing

```bash
# Build check
npm run build

# Linting
npm run lint
```

## TODO

- [ ] Add unit tests
- [ ] Add E2E tests
- [ ] Add Storybook stories
- [ ] Implement keyboard shortcuts (Ctrl+Enter, Escape)

