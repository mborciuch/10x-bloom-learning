# Architektura UI dla Bloom Learning

## 1. Przegląd struktury UI

Bloom Learning to aplikacja webowa składająca się z dwóch głównych obszarów:

1. **Strefa publiczna**: Landing page, login, rejestracja
2. **Aplikacja chroniona**: Kalendarz, zarządzanie planami nauki, sesje powtórkowe, generowanie AI

**Główne założenia architektoniczne**:

- **Kalendarz jako główny widok**: Centralne miejsce dostępu do wszystkich aktywności nauki
- **AI-first z kontrolą użytkownika**: Automatyczne generowanie z pełną możliwością edycji i akceptacji
- **Responsywna architektura**: Dedykowane układy dla desktop, tablet, mobile
- **Progressive enhancement**: Podstawowa funkcjonalność bez JavaScript, pełne doświadczenie z JS

**Tech Stack**:

- Framework: Astro 5 (SSR/SSG) + React 19 (komponenty dynamiczne)
- Styling: Tailwind 4 + shadcn/ui
- State Management: React Context (auth, theme) + React Query (API state)
- Forms: React Hook Form + Zod
- Routing: Astro file-based routing

## 2. Lista widoków

### 2.1. Landing Page

**Ścieżka**: `/`  
**Typ**: Publiczny, statyczny (SSG)

**Główny cel**: Przedstawienie wartości produktu i zachęcenie do rejestracji.

**Kluczowe informacje**:

- Value proposition (nagłówek główny)
- Kluczowe funkcje (3-4 sekcje)
- Proces nauki (3 kroki)
- Call to action (Sign Up, Login)

**Kluczowe komponenty**:

- `HeroSection`: Nagłówek, podtytuł, CTA buttons
- `FeaturesGrid`: 4 karty z ikonami i opisami
- `HowItWorks`: 3-step process z ilustracjami
- `Footer`: Linki, copyright

**UX/Accessibility/Security**:

- Semantyczny HTML (header, main, section, footer)
- Heading hierarchy (h1 → h2 → h3)
- Alt text dla wszystkich obrazów
- High contrast CTAs
- Keyboard navigation
- HTTPS enforced

---

### 2.2. Login Page

**Ścieżka**: `/login`  
**Typ**: Publiczny

**Główny cel**: Uwierzytelnienie użytkownika.

**Kluczowe informacje**:

- Email input
- Password input (z opcją show/hide)
- "Remember me" checkbox
- Link do register i forgot password

**Kluczowe komponenty**:

- `AuthLayout`: Wrapper z centrowaniem i branded background
- `LoginForm`: React Hook Form + Zod validation
- `Input` (shadcn): Email, password
- `Button` (shadcn): Submit, social login (future)
- `Alert` (shadcn): Error messages

**UX/Accessibility/Security**:

- Auto-focus na email input
- Enter key submits form
- Inline validation (email format, required fields)
- Clear error messages (generic: "Invalid credentials" bez szczegółów)
- Label associations (for/id)
- ARIA error announcements (aria-describedby, aria-invalid)
- Password masking z toggle visibility
- Rate limiting feedback (po 5 próbach)
- HTTPS only, JWT token storage (httpOnly cookies via Supabase)

---

### 2.3. Register Page

**Ścieżka**: `/register`  
**Typ**: Publiczny

**Główny cel**: Rejestracja nowego użytkownika.

**Kluczowe informacje**:

- Email input
- Password input (min. 8 znaków)
- Confirm password input
- Password strength indicator
- Terms & conditions checkbox
- Link do login

**Kluczowe komponenty**:

- `AuthLayout`
- `RegisterForm`: React Hook Form + Zod
- `PasswordStrengthMeter`: Wizualizacja siły hasła
- `Input`, `Button`, `Checkbox`, `Alert` (shadcn)

**UX/Accessibility/Security**:

- Real-time password matching validation
- Password strength indicator (weak/medium/strong)
- Disabled submit until all validations pass
- Live region dla validation feedback (aria-live="polite")
- Terms link opens in new tab
- Email uniqueness validation (server-side, client feedback)
- Input sanitization
- CAPTCHA considerations (future, jeśli spam problem)

---

### 2.4. Calendar View (Main)

**Ścieżka**: `/app/calendar`  
**Typ**: Chroniony (wymaga auth)  
**Domyślny widok po zalogowaniu**

**Główny cel**: Przegląd zaplanowanych sesji powtórkowych, szybki dostęp do sesji, dodawanie nowych sesji.

**Kluczowe informacje**:

- Miesięczny kalendarz z sesjami
- Dla każdego dnia: lista sesji (plan title + exercise label)
- Status sesji (pending/completed) - wizualne rozróżnienie
- Dzisiejsza data (highlighted)
- Liczba sesji na dzień (badge)

**Kluczowe komponenty**:

- `CalendarHeader`: Nawigacja miesiąc/rok (prev/next), "Today" button, filter dropdown (by plan)
- `CalendarGrid` (Desktop/Tablet): 7x5-6 grid (dni tygodnia x tygodnie)
- `CalendarDayCell`: Data, lista `SessionCard` mini
- `SessionCardMini`: Plan title, exercise label, status badge, quick actions (hover)
- `SessionPopover` (shadcn Popover): Hover/click na sesję → quick complete, view details, edit, delete
- `FloatingActionButton` (FAB, mobile): "+" button → modal dodawania sesji
- `EmptyStateCard`: Conditional render gdy brak planów (onboarding)

**Desktop/Tablet Layout**:

- Grid 7 kolumn (poniedziałek-niedziela)
- Każda komórka: min-height, scrollable jeśli >3 sesje
- Hover na sesję: popover z quick actions

**Mobile Layout** (<768px):

- Lista dni (scrollable)
- Current week domyślnie expanded
- Każdy dzień: Expandable card z datą i listą sesji
- FAB w prawym dolnym rogu

**UX/Accessibility/Security**:

- Keyboard navigation: Arrow keys (lewo/prawo/góra/dół) między dniami
- Enter na dzień: Expand day (mobile) lub open first session (desktop)
- Tab navigation: Przez sesje w dniu
- Escape: Close popover/modal
- ARIA labels: "Calendar", "Monday, June 5, 2025, 2 sessions"
- ARIA current: "date" dla dzisiejszego dnia
- Screen reader announcements: "Navigated to [date]"
- Focus indicators: Wyraźny outline na aktywny dzień
- Quick complete: Optimistic update, rollback on error
- RLS filtering: Tylko sesje aktualnego użytkownika
- Empty state dla nowych użytkowników: "Welcome! Create your first study plan" CTA

---

### 2.5. Study Plans List

**Ścieżka**: `/app/plans`  
**Typ**: Chroniony

**Główny cel**: Zarządzanie planami nauki (tworzenie, edycja, usuwanie, generowanie AI).

**Kluczowe informacje**:

- Lista wszystkich planów użytkownika
- Dla każdego planu: title, word count, created date, status (active/archived), pending AI indicator
- Actions: Generate AI, View Sessions (→ Calendar filtered), Edit, Archive, Delete

**Kluczowe komponenty**:

- `PlansHeader`: Search bar, filter dropdown (Status: All/Active/Archived), "Create New Plan" button
- `PlansGrid`: Responsive grid (3 → 2 → 1 kolumny)
- `PlanCard`:
  - Title (bold, 20px)
  - Word count badge
  - Status badge (Active/Archived)
  - Created date (relative: "2 days ago")
  - Pending AI indicator (spinner + text "AI generating...")
  - Actions dropdown menu (shadcn DropdownMenu)
- `EmptyState`: "No study plans yet" z CTA "Create Your First Plan"

**UX/Accessibility/Security**:

- Search: Debounce 300ms, client-side filtering (lub server jeśli >100 planów)
- Filter: Instant update, maintain scroll position
- Card hover: Subtle elevation
- Actions dropdown: Keyboard accessible (Tab → Enter/Space → Arrow keys → Enter)
- Delete confirmation: Modal z ostrzeżeniem "This will delete X sessions"
- ARIA labels: "Study plan card", "Actions menu"
- Focus management: Po delete, focus na następny card
- Ownership validation: Tylko własne plany widoczne (RLS)
- Optimistic updates: Archive/Unarchive natychmiast, rollback on error

---

### 2.6. Create Study Plan

**Ścieżka**: `/app/plans/new`  
**Typ**: Chroniony

**Główny cel**: Utworzenie nowego planu nauki.

**Kluczowe informacje**:

- Title input (max 200 chars)
- Source material textarea (large)
- Live word count indicator (200-5000 słów)
- Validation status

**Kluczowe komponenty**:

- `CreatePlanLayout`: Centered form (max-width 700px)
- `PlanForm`: React Hook Form + Zod schema
- `Input` (title): Character counter, real-time validation
- `Textarea` (sourceMaterial): Resizable, large (min-height 300px)
- `WordCountIndicator`: Color-coded bar/badge
  - <200: Red + "Too short (minimum 200 words)"
  - 200-500: Yellow + "X words"
  - 500-4500: Green + "X words"
  - > 5000: Red + "Too long (maximum 5000 words)"
- `Button`: Submit (disabled until valid), Cancel

**UX/Accessibility/Security**:

- Auto-focus na title
- Tab to textarea
- Word count: Real-time calculation (on input debounce 200ms)
- Color-coded feedback (color + icon + text - nie tylko color)
- Submit disabled + tooltip gdy invalid
- Auto-save draft do localStorage co 5s (recovery on return)
- Unsaved changes warning (beforeunload event)
- Label associations, clear error messages
- ARIA live region: "Word count: 1234 words, valid"
- Input sanitization (trim, escape HTML)
- Max length enforced (title 200, source material ~200KB)
- Success: Redirect to /app/plans + toast "Plan created successfully"

---

### 2.7. Edit Study Plan

**Ścieżka**: `/app/plans/{planId}/edit`  
**Typ**: Chroniony

**Główny cel**: Edycja istniejącego planu nauki.

**Kluczowe informacje**:

- Pre-filled title i source material
- Created date (read-only)
- Last modified (read-only)
- Existing session count (read-only)

**Kluczowe komponenty**:

- Identyczne jak Create Plan
- Dodatkowo: Warning alert: "Editing source material may affect existing AI sessions"
- Info section: Created date, last modified, session count

**UX/Accessibility/Security**:

- Wszystkie z Create Plan
- Dodatkowo:
  - Unsaved changes prompt bardziej wyraźny (modal, nie tylko browser alert)
  - Save keyboard shortcut (Ctrl/Cmd + S)
  - Ownership validation (404 jeśli nie own)
  - Optimistic update z rollback

---

### 2.8. AI Generation Form

**Ścieżka**: `/app/plans/{planId}/generate` (modal lub dedykowana strona)  
**Typ**: Modal over current page  
**Chroniony**

**Główny cel**: Inicjacja generowania sesji przez AI z parametrami.

**Kluczowe informacje**:

- Plan title (reference, read-only)
- Number of sessions (1-50)
- Bloom taxonomy levels (checkbox group)
- Estimated generation time

**Kluczowe komponenty**:

- `Dialog` (shadcn): Modal overlay
- `AIGenerationForm`: React Hook Form
- `Input` type="number": Liczba sesji, stepper buttons (+/-)
- `CheckboxGroup`: 6 checkboxów (Remember, Understand, Apply, Analyze, Evaluate, Create)
  - Każdy z tooltip (shadcn Tooltip): Opis poziomu + przykład
  - Default checked: Understand, Apply, Analyze
- `InfoAlert`: "Generation typically takes 30-60 seconds"
- `Button`: Generate (primary), Cancel (secondary)

**UX/Accessibility/Security**:

- Number input: Default 10, min 1, max 50, stepper buttons
- Tooltips: Hover lub focus (keyboard accessible)
- Default selections: Sensible starting point
- "Select All" / "Clear All" links (convenience)
- Validation: At least one level required
- Submit enabled tylko gdy valid
- Fieldset/legend dla checkbox group
- ARIA describedby dla tooltips
- Keyboard: Tab przez checkboxy, Space to toggle, Enter to submit
- Rate limiting check: Jeśli hit limit → disabled button + tooltip "You've reached 5 generations/hour. Try again in X min"
- Duplicate check: Jeśli pending generation exists → disabled + tooltip "Generation in progress, view status"

---

### 2.9. AI Generation Progress

**Ścieżka**: Modal overlay on current page  
**Typ**: Modal (non-dismissable except background option)  
**Chroniony**

**Główny cel**: Monitoring postępu generowania AI, feedback dla użytkownika.

**Kluczowe informacje**:

- Status message
- Progress indicator
- Generation ID (for support/debugging)
- Option to background

**Kluczowe komponenty**:

- `Dialog` (shadcn): Centered modal, no close X
- `ProgressSpinner`: Animated spinner
- `StatusMessage`: "Generating sessions... This may take 30-60 seconds"
- `GenerationIdDisplay`: Small text, "Generation ID: abc-123"
- `Button`: "Continue in Background"
- `NotificationBar` (jeśli backgrounded): Sticky top bar, "AI generation in progress", click to re-open modal, auto-dismiss on complete

**Polling Logic**:

- Poll GET /api/ai-generations/{genId} co 3 sekundy
- Check state: pending → in_progress → succeeded/failed
- On success: Close modal, toast "Generation complete! Review sessions", link to review page
- On failure: Show error in modal, "Retry" button, "Contact support" link

**UX/Accessibility/Security**:

- Focus trap w modalu
- ARIA live region: aria-live="polite" dla status updates
- Screen reader announcements: "Generating sessions, please wait"
- Background option: Store generation ID w localStorage, polling continues, notification bar visible
- Click notification bar: Re-open full modal
- On success: Auto-close modal after 2s (z countdown) OR immediate with toast
- On failure: Remain in modal z error message i actions
- Cleanup: Cancel polling on unmount (useEffect cleanup)
- Timeout handling: If >2min, show "Taking longer than expected" message

---

### 2.10. AI Generation Review

**Ścieżka**: `/app/ai-review/{genId}`  
**Typ**: Dedykowana strona, chroniona

**Główny cel**: Przegląd, edycja i akceptacja wygenerowanych sesji przed zapisem do kalendarza.

**Kluczowe informacje**:

- Plan title (reference)
- Liczba wygenerowanych sesji
- Lista sesji z pełnymi szczegółami (date, exercise, taxonomy, questions, answers)
- Status każdej sesji (proposed)

**Kluczowe komponenty**:

- `ReviewHeader`:
  - Plan title (breadcrumb-style link)
  - Session count: "X sessions generated"
  - Sticky Action Bar: "Accept All" (primary), "Reject All" (secondary/danger)
- `SessionTimeline`: Lista sesji pogrupowanych po datach
  - Date group header: "Monday, June 5" (wszystkie sesje tego dnia)
- `SessionReviewCard` (expandable):
  - **Collapsed state**:
    - Review date
    - Exercise label
    - Taxonomy level badge
    - Expand/Collapse icon
  - **Expanded state**:
    - Review Date: Datepicker (shadcn Calendar)
    - Exercise Template: Dropdown (read-only reference, shadcn Select)
    - Taxonomy Level: Select (editable, shadcn Select)
    - Questions: Numbered list, inline editable textarea (1 per question)
    - Answers: Numbered list, inline editable textarea (1 per answer)
    - Actions: "Save Changes" (if edited), "Remove Session" (danger)

**UX/Accessibility/Security**:

- Initial state: All cards collapsed (performance)
- Expand on click: Smooth animation, scroll to card
- Inline editing: Click to edit, auto-save on blur OR explicit "Save" button
- Edited indicator: Visual badge "Edited" na card
- Remove session: Optimistic removal, undo toast (5s), permanent after timeout
- Accept All: Confirmation if any edited, then POST /api/ai-generations/{genId}/accept
- Reject All: Confirmation modal, then DELETE all sessions
- Partial accept: Future enhancement (select checkboxes)
- Keyboard: Tab to card, Enter/Space to expand, Tab through fields, Escape to collapse
- ARIA expanded: aria-expanded="true/false"
- Focus management: On expand, focus first editable field
- Ownership validation: 404 jeśli genId nie należy do user
- Optimistic updates: Save changes lokalne, flush on accept
- Success: Redirect to /app/calendar with highlighted accepted sessions

---

### 2.11. Review Session Detail

**Ścieżka**: `/app/review-sessions/{sessionId}`  
**Typ**: Dedykowana strona, chroniona

**Główny cel**: Przeprowadzenie sesji powtórkowej (focus mode nauki).

**Kluczowe informacje**:

- Plan title (context)
- Exercise label (główny nagłówek)
- Review date
- Lista pytań (questions)
- Odpowiedzi (answers) - ukryte domyślnie
- Hints (optional)
- Completion status

**Kluczowe komponenty**:

- `SessionHeader`:
  - Back button (→ Calendar)
  - Breadcrumb: Plan title (link) → Session
  - Exercise label (h1)
  - Review date (formatted)
- `QuestionList`: Scrollable vertical list
- `QuestionCard`:
  - Question number i text (large, readable)
  - "Show Answer" button (or collapsed section)
  - Answer section (initially hidden):
    - Answer text
    - Hints (if any, subtle styling)
- `SessionFooter` (sticky on mobile):
  - Notes textarea (collapsible, optional): "Add notes about this session..."
  - "Mark as Completed" button (large, primary)
- `FeedbackModal`: Triggered on completion
  - Star rating (1-5, interactive)
  - Comment textarea (optional)
  - "Skip" button, "Submit Feedback" button

**UX/Accessibility/Security**:

- Question cards: One at a time visible (scroll) OR all in list (decided: all in list dla flexibility)
- "Show Answer": Smooth slide-down animation, button → "Hide Answer"
- Keyboard shortcuts:
  - Space: Toggle answer na focused card
  - C: Mark complete
  - N: Focus notes textarea
- Focus mode: Minimal distractions, no sidebar (tylko back button)
- Completion flow:
  1. Click "Mark as Completed"
  2. POST /api/review-sessions/{sessionId}/complete
  3. Feedback modal opens (optional, can skip)
  4. If feedback submitted: POST /api/review-sessions/{sessionId}/feedback
  5. Toast "Session completed!" + redirect to calendar
- Notes: Auto-save on blur (optional persistence)
- ARIA: Each question as article, answers in details/summary (or div with aria-expanded)
- Screen reader: "Question 1 of 5", "Answer revealed"
- Ownership: 404 jeśli session nie należy do user
- Deep-linking: URL shareable (dla power users multi-device)
- Already completed: Show "Completed on [date]" badge, allow re-review

---

### 2.12. Settings / Profile

**Ścieżka**: `/app/settings`  
**Typ**: Chroniony

**Główny cel**: Zarządzanie kontem i preferencjami użytkownika.

**Kluczowe informacje**:

- User profile data (display name, email, timezone)
- Account security (change password)
- Preferences (theme, notifications)
- Danger zone (delete account)

**Kluczowe komponenty**:

- `SettingsTabs` (shadcn Tabs): Profile, Account, Preferences
- **Profile Tab**:
  - Display Name: Input (editable)
  - Email: Input (read-only, from Supabase auth)
  - Timezone: Select (IANA timezones, auto-detected default)
  - "Save Changes" button
- **Account Tab**:
  - Change Password form:
    - Old password input
    - New password input
    - Confirm new password input
    - "Update Password" button
  - Delete Account section (danger zone):
    - Warning text
    - "Delete My Account" button (danger)
- **Preferences Tab**:
  - Theme: Radio group or Toggle (Light / Dark / System)
  - Language: Select (future, dla MVP tylko EN/PL)
  - Notifications: Checkboxes (future: email, push)
  - "Save Preferences" button

**UX/Accessibility/Security**:

- Tabs: Keyboard navigation (arrow keys), URL hash persistence (#profile, #account, #preferences)
- Profile:
  - Timezone: Auto-detect z Intl.DateTimeFormat().resolvedOptions().timeZone
  - Save: Optimistic update, Supabase updateUser (user_metadata)
- Account:
  - Change password: Requires old password (security)
  - Validation: Min 8 chars, match confirmation
  - Success toast + force re-login (optional, dla extra security)
  - Delete account:
    - Confirmation modal z warning: "This action cannot be undone. All your data will be permanently deleted."
    - Requires re-authentication (Supabase reauthenticate)
    - On confirm: DELETE user + cascade all data
- Preferences:
  - Theme: Immediate visual change on select, save to localStorage + user_metadata
  - Respect prefers-color-scheme jako default
- ARIA: Tab panel associations, label associations
- Form validation: Inline errors, disabled submit until valid
- Security: Password change requires old password, delete requires re-auth, HTTPS only

---

### 2.13. Empty State (Onboarding)

**Ścieżka**: Conditional render w `/app/calendar`  
**Typ**: Component overlay

**Główny cel**: Onboarding nowych użytkowników, guidance do pierwszej akcji.

**Kluczowe informacje**:

- Welcome message
- Explanation of first step
- Clear CTA

**Kluczowe komponenty**:

- `EmptyStateCard` (shadcn Card): Centered w viewport
- Illustration/icon (learning-themed, welcoming)
- Headline: "Welcome to Bloom Learning!"
- Subheadline: "Create your first study plan to start organizing your learning journey with AI-powered repetitions."
- `Button`: "Create Your First Study Plan" (large, primary)
- Optional: "Watch Tutorial" link (future)

**Logika wyświetlania**:

- Trigger: user.onboardingCompletedAt === null && studyPlansCount === 0
- On CTA click: Redirect to /app/plans/new
- On first plan creation: Set user_metadata.onboardingCompletedAt = now()
- Future: Dismissable tips, tooltips dla key features

**UX/Accessibility/Security**:

- Non-blocking: Jeśli user utworzy plan inną drogą (np. direct URL), auto-dismiss
- Large CTA: Easy to find, high contrast
- Friendly tone: Nie intimidating, encouraging
- Semantic: section with h2 heading
- ARIA: aria-labelledby dla card
- Focus: Auto-focus na CTA button (dla keyboard users)

---

## 3. Mapa podróży użytkownika

### 3.1. Nowy Użytkownik (Happy Path)

```
1. Landing Page
   ↓ [Click "Sign Up"]

2. Register Page
   ↓ [Fill form, submit]

3. Auto-login & Redirect → /app/calendar
   ↓ [Detect: no plans, show Empty State]

4. Empty State (in Calendar)
   ↓ [Click "Create Your First Study Plan"]

5. Create Study Plan (/app/plans/new)
   ↓ [Enter title, paste material, submit]

6. Redirect → /app/plans
   ↓ [Success toast, see new plan card]

7. Plan Card
   ↓ [Click "Generate AI Sessions"]

8. AI Generation Form (modal)
   ↓ [Select count: 10, levels: Understand+Apply+Analyze, submit]

9. AI Generation Progress (modal)
   ↓ [Polling 30-60s... → Success]

10. Toast: "Generation complete!" + link
    ↓ [Click "Review Sessions"]

11. AI Generation Review (/app/ai-review/{genId})
    ↓ [Browse sessions, maybe edit 1-2, click "Accept All"]

12. Redirect → /app/calendar
    ↓ [Sessions now visible, today's session highlighted]

13. Calendar View
    ↓ [Click on today's session]

14. Review Session Detail (/app/review-sessions/{sessionId})
    ↓ [Read question, click "Show Answer", read, repeat for all]

15. Mark as Completed
    ↓ [Feedback modal opens]

16. Feedback Modal
    ↓ [Rate 4 stars, add comment, submit OR skip]

17. Toast: "Session completed!" + Redirect → /app/calendar
    ↓ [Session now marked completed (visual change)]

18. Calendar View (returning state)
    ✓ First cycle complete, user familiar z flow
```

### 3.2. Powracający Użytkownik (Daily Routine)

```
1. Login (/login)
   ↓ [Enter credentials, submit]

2. Redirect → /app/calendar
   ↓ [See today's pending sessions]

3. Calendar View
   ↓ [Click on first session for today]

4. Review Session Detail
   ↓ [Complete session, feedback]

5. Back to Calendar
   ↓ [Complete remaining sessions OR browse other days]

6. [Optional] Navigate to /app/plans
   ↓ [Create new plan OR generate more sessions]

7. Logout (or close tab)
```

### 3.3. Power User - Manual Session Management

```
1. Calendar View
   ↓ [Click on empty day OR FAB (mobile)]

2. Add Session Modal/Form
   ↓ [Select plan, choose template OR custom exercise, set date]

3. Submit
   ↓ [Session added to calendar]

4. Calendar View
   ↓ [Hover on session → Quick actions popover]

5. Popover
   ↓ [Click "Edit" OR "Mark Complete" OR "Delete"]

6. [If Edit] → Edit Session Form
   ↓ [Modify date/content, save]

7. Back to Calendar
   ↓ [Changes reflected]
```

### 3.4. AI Generation Retry Flow (Error Handling)

```
1. AI Generation Form
   ↓ [Submit]

2. AI Generation Progress
   ↓ [Polling... → Timeout OR API Error]

3. Error State in Modal
   ↓ [Message: "Generation failed. Please try again."]

4. User Actions:
   ↓ [Click "Retry" → Back to step 1]
   ↓ OR [Click "Cancel" → Back to /app/plans]
   ↓ OR [Click "Contact Support" → Email/Help]
```

### 3.5. Editing Plan with Existing Sessions

```
1. /app/plans
   ↓ [Click plan card actions → "Edit"]

2. Edit Study Plan (/app/plans/{planId}/edit)
   ↓ [See warning: "Editing may affect existing sessions"]

3. Modify source material
   ↓ [Save]

4. Redirect → /app/plans
   ↓ [Toast: "Plan updated. Existing sessions unchanged."]

Note: Editing plan nie modyfikuje existing sessions (decoupled)
```

---

## 4. Układ i struktura nawigacji

### 4.1. Desktop Layout (≥1024px)

```
┌─────────────────────────────────────────────────────┐
│  [Sidebar]                    [Main Content]        │
│  ┌──────────┐  ┌──────────────────────────────────┐ │
│  │ Logo     │  │                                  │ │
│  │          │  │                                  │ │
│  │ Calendar │  │      Current View Content        │ │
│  │ Plans    │  │                                  │ │
│  │ Settings │  │                                  │ │
│  │          │  │                                  │ │
│  │ [Toggle] │  │                                  │ │
│  │ Logout   │  │                                  │ │
│  └──────────┘  └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Sidebar (Vertical, Left)**:

- Width: 240px (expanded), 64px (collapsed)
- Components:
  - Logo/Brand (top)
  - Navigation items:
    - Calendar (icon: CalendarIcon, label: "Calendar")
    - Study Plans (icon: BookIcon, label: "Study Plans")
    - Settings (icon: SettingsIcon, label: "Settings")
  - Spacer (flex-grow)
  - Toggle collapse/expand button (bottom)
  - Logout button (bottom)
- Active state: Highlighted background + bold text
- Collapsed state: Icons only, labels in tooltips
- Hover: Expand tooltip dla collapsed state

**Main Content**:

- Width: calc(100vw - 240px) (expanded sidebar), calc(100vw - 64px) (collapsed)
- Padding: 2rem
- Responsive: Full width gdy sidebar collapsed

### 4.2. Tablet Layout (768-1023px)

```
┌─────────────────────────────────────────────────────┐
│  [Collapsed Sidebar]         [Main Content]         │
│  ┌────┐  ┌────────────────────────────────────────┐ │
│  │ L  │  │                                        │ │
│  │ C  │  │                                        │ │
│  │ P  │  │      Current View Content              │ │
│  │ S  │  │                                        │ │
│  │ Lo │  │                                        │ │
│  └────┘  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Collapsed Sidebar (default)**:

- Width: 64px
- Icons only, tooltips on hover
- Can temporarily expand on hover/click (overlay mode)

### 4.3. Mobile Layout (<768px)

```
┌───────────────────────────────────┐
│  [Top Bar]                        │
│  [Logo]              [Hamburger]  │
├───────────────────────────────────┤
│                                   │
│                                   │
│       Current View Content        │
│                                   │
│                                   │
├───────────────────────────────────┤
│  [Bottom Navigation Bar]          │
│  [Calendar] [Plans] [+] [Settings]│
└───────────────────────────────────┘
```

**Top Bar**:

- Logo (left)
- Hamburger menu (right): User profile, logout

**Bottom Navigation Bar** (Fixed):

- 4 items + FAB:
  - Calendar (icon)
  - Study Plans (icon)
  - **FAB** (center, elevated): "+" add session
  - Settings (icon)
- Active state: Icon fill + label color change
- Badge indicators: Dot na Calendar jeśli pending sessions today

**Hamburger Menu** (Sheet):

- Slide from right
- User profile info (name, email)
- Logout button
- Optional: Theme toggle, help link

### 4.4. Routing Structure

```
Public Routes:
├── / (Landing Page)
├── /login
└── /register

Protected Routes (/app):
├── /app/calendar (default after login)
├── /app/plans
│   ├── /app/plans/new
│   └── /app/plans/{planId}/edit
├── /app/ai-review/{genId}
├── /app/review-sessions/{sessionId}
└── /app/settings
```

**Route Protection**:

- Middleware: Check Supabase auth token
- If not authenticated: Redirect to /login with returnUrl param
- After login: Redirect to returnUrl OR /app/calendar

**Active Route Indication**:

- Sidebar/Bottom nav: Highlight active page
- aria-current="page" dla screen readers

---

## 5. Kluczowe komponenty

### 5.1. Komponenty Layoutu

#### `AppLayout`

**Cel**: Wrapper dla wszystkich chronionych stron z nawigacją.  
**Props**: `children`  
**Zawiera**: `Sidebar` (desktop/tablet), `BottomNav` (mobile), `main` content area  
**Odpowiedzialność**: Responsywny layout, navigation rendering

#### `AuthLayout`

**Cel**: Wrapper dla stron auth (login, register).  
**Props**: `children`  
**Zawiera**: Centered card, branded background  
**Odpowiedzialność**: Spójny auth UI

#### `Sidebar`

**Cel**: Nawigacja boczna (desktop/tablet).  
**Props**: `collapsed` (boolean), `onToggle` (function)  
**Zawiera**: Logo, nav items, logout  
**Odpowiedzialność**: Navigation state, active route highlighting

#### `BottomNav`

**Cel**: Nawigacja dolna (mobile).  
**Props**: None  
**Zawiera**: 4 nav icons + FAB  
**Odpowiedzialność**: Mobile navigation, badge indicators

---

### 5.2. Komponenty Kalendarza

#### `CalendarGrid`

**Cel**: Miesięczny widok kalendarza (desktop/tablet).  
**Props**: `sessions` (array), `currentMonth` (Date), `onDateClick` (function), `onSessionClick` (function)  
**Zawiera**: Grid dni, `CalendarDayCell` dla każdego dnia  
**Odpowiedzialność**: Layout grid, date calculations, keyboard navigation

#### `CalendarDayCell`

**Cel**: Pojedyncza komórka dnia w kalendarzu.  
**Props**: `date` (Date), `sessions` (array), `isToday` (boolean), `onClick` (function)  
**Zawiera**: Data, lista `SessionCardMini`  
**Odpowiedzialność**: Display sessions for day, highlight today

#### `SessionCardMini`

**Cel**: Miniaturowa karta sesji w kalendarzu.  
**Props**: `session` (object), `onHover` (function), `onClick` (function)  
**Zawiera**: Plan title, exercise label, status badge  
**Odpowiedzialność**: Display session summary, trigger popover

#### `SessionPopover`

**Cel**: Quick actions popover dla sesji (hover/click).  
**Props**: `session` (object), `onComplete` (function), `onEdit` (function), `onDelete` (function)  
**Zawiera**: Actions buttons (shadcn Popover)  
**Odpowiedzialność**: Quick actions bez full page navigation

#### `CalendarDayList` (Mobile)

**Cel**: Lista dni (mobile alternative do grid).  
**Props**: `sessions` (array), `currentWeek` (Date), `onSessionClick` (function)  
**Zawiera**: Expandable `DayCard`  
**Odpowiedzialność**: Mobile-optimized day display

---

### 5.3. Komponenty Study Plans

#### `PlansGrid`

**Cel**: Responsywny grid kart planów.  
**Props**: `plans` (array), `onPlanClick` (function)  
**Zawiera**: `PlanCard` dla każdego planu  
**Odpowiedzialność**: Responsive layout (3→2→1 cols)

#### `PlanCard`

**Cel**: Karta pojedynczego planu.  
**Props**: `plan` (object), `onGenerateAI` (function), `onEdit` (function), `onDelete` (function)  
**Zawiera**: Title, word count badge, status badge, actions dropdown  
**Odpowiedzialność**: Display plan summary, action triggers

#### `PlanForm`

**Cel**: Formularz tworzenia/edycji planu.  
**Props**: `initialValues` (object), `onSubmit` (function), `isEdit` (boolean)  
**Zawiera**: Title input, source material textarea, word count indicator  
**Odpowiedzialność**: Form validation (React Hook Form + Zod), auto-save draft, submit

#### `WordCountIndicator`

**Cel**: Wizualizacja word count z walidacją.  
**Props**: `count` (number), `min` (200), `max` (5000)  
**Zawiera**: Color-coded badge/bar, text status  
**Odpowiedzialność**: Real-time validation feedback

---

### 5.4. Komponenty AI Generation

#### `AIGenerationForm`

**Cel**: Formularz inicjacji generowania AI.  
**Props**: `planId` (string), `onSubmit` (function)  
**Zawiera**: Session count input, taxonomy level checkboxes, submit button  
**Odpowiedzialność**: Form validation, parameter collection

#### `AIGenerationProgress`

**Cel**: Modal monitoringu postępu generowania.  
**Props**: `generationId` (string), `onComplete` (function), `onBackground` (function)  
**Zawiera**: Progress spinner, status message, background button  
**Odpowiedzialność**: Polling logic (3s interval), status display, completion handling

#### `SessionReviewCard`

**Cel**: Expandable card pojedynczej sesji w review.  
**Props**: `session` (object), `onSave` (function), `onRemove` (function), `isExpanded` (boolean), `onToggle` (function)  
**Zawiera**: Collapsed summary, expanded editor (date, template, taxonomy, content)  
**Odpowiedzialność**: Inline editing, optimistic updates, expand/collapse

#### `NotificationBar`

**Cel**: Persistent notification (AI generation w tle).  
**Props**: `message` (string), `onClick` (function), `onDismiss` (function)  
**Zawiera**: Sticky bar top, message, click to expand  
**Odpowiedzialność**: Background process notification

---

### 5.5. Komponenty Review Sessions

#### `QuestionCard`

**Cel**: Karta pojedynczego pytania w sesji.  
**Props**: `question` (string), `answer` (string), `hints` (array), `number` (number), `total` (number)  
**Zawiera**: Question text, "Show Answer" button, collapsible answer section  
**Odpowiedzialność**: Answer reveal/hide, keyboard shortcuts

#### `FeedbackModal`

**Cel**: Modal zbierania feedback po completion.  
**Props**: `sessionId` (string), `onSubmit` (function), `onSkip` (function)  
**Zawiera**: Star rating (1-5), comment textarea, skip/submit buttons  
**Odpowiedzialność**: Optional feedback collection, rating validation

---

### 5.6. Komponenty Utility

#### `AuthProvider`

**Cel**: Context provider dla auth state.  
**Props**: `children`  
**State**: `user`, `session`, `loading`  
**Methods**: `signIn`, `signOut`, `signUp`, `updateProfile`  
**Odpowiedzialność**: Supabase auth integration, token management, auto-refresh

#### `ThemeProvider`

**Cel**: Context provider dla theme.  
**Props**: `children`  
**State**: `theme` (light/dark/system)  
**Methods**: `setTheme`, `toggleTheme`  
**Odpowiedzialność**: Theme persistence (localStorage + user_metadata), CSS variables application

#### `ErrorBoundary`

**Cel**: Catch React errors, graceful fallback.  
**Props**: `children`, `fallback` (component)  
**Odpowiedzialność**: Error logging, user-friendly error display

#### `LoadingSpinner`

**Cel**: Reusable loading indicator.  
**Props**: `size` (sm/md/lg), `label` (string)  
**Zawiera**: Animated spinner, optional label  
**Odpowiedzialność**: Consistent loading UI

#### `EmptyState`

**Cel**: Reusable empty state component.  
**Props**: `title`, `description`, `action` (button config), `icon`  
**Zawiera**: Centered card, icon, text, CTA  
**Odpowiedzialność**: Consistent empty states

#### `ConfirmDialog`

**Cel**: Reusable confirmation modal.  
**Props**: `title`, `description`, `confirmText`, `onConfirm`, `onCancel`, `variant` (default/danger)  
**Zawiera**: Modal, message, confirm/cancel buttons  
**Odpowiedzialność**: User confirmation dla destructive actions

---

### 5.7. Hooks (Custom)

#### `useAuth`

**Cel**: Access auth context.  
**Returns**: `{ user, session, signIn, signOut, ... }`  
**Usage**: `const { user } = useAuth()`

#### `useStudyPlans`

**Cel**: Fetch study plans (React Query).  
**Returns**: `{ data, isLoading, error, refetch }`  
**Usage**: `const { data: plans } = useStudyPlans()`

#### `useReviewSessions`

**Cel**: Fetch review sessions (React Query).  
**Params**: `filters` (date range, plan, status)  
**Returns**: `{ data, isLoading, error }`

#### `useAIGeneration`

**Cel**: Poll AI generation status.  
**Params**: `generationId`  
**Returns**: `{ data, isLoading, isSuccess, isError }`  
**Logic**: Polling every 3s, auto-stop on completion

#### `useCreatePlan` / `useUpdatePlan` / `useDeletePlan`

**Cel**: Mutations dla study plans (React Query).  
**Returns**: `{ mutate, isLoading, error }`  
**Logic**: Optimistic updates, cache invalidation

#### `useCompleteSession`

**Cel**: Mutation dla completing session.  
**Returns**: `{ mutate, isLoading, error }`  
**Logic**: Optimistic update, calendar cache invalidation

#### `useWordCount`

**Cel**: Calculate word count from text.  
**Params**: `text` (string)  
**Returns**: `count` (number)  
**Logic**: Split by whitespace, trim, count

#### `useDebounce`

**Cel**: Debounce value (search, word count).  
**Params**: `value`, `delay` (ms)  
**Returns**: `debouncedValue`

---

## 6. State Management Strategy

### 6.1. React Context (Global App State)

**AuthContext**:

- State: `user`, `session`, `loading`
- Methods: `signIn`, `signOut`, `signUp`, `updateProfile`
- Persistence: Supabase SDK (automatic)
- Scope: Cała aplikacja (wrap w App root)

**ThemeContext**:

- State: `theme` (light/dark/system)
- Methods: `setTheme`, `toggleTheme`
- Persistence: localStorage + user_metadata (optional sync)
- Scope: Cała aplikacja

### 6.2. React Query (Server State)

**Query Keys**:

```typescript
['study-plans'] → all plans
['study-plans', { status: 'active' }] → filtered plans
['study-plan', planId] → single plan
['review-sessions', { dateFrom, dateTo, planId }] → sessions with filters
['review-session', sessionId] → single session
['exercise-templates'] → all templates
['ai-generation', genId] → generation status
['metrics', 'ai-usage'] → AI usage metrics
```

**Cache Configuration**:

- Study Plans: 5min stale time
- Review Sessions: 1min stale time
- Exercise Templates: 1 hour stale time
- AI Generation: No cache (always fresh, polling)
- Metrics: 10min stale time

**Optimistic Updates**:

- Complete session: Immediate UI update
- Delete session: Remove from list, undo toast
- Edit session: Inline update
- Create plan: Append to list

### 6.3. Local Component State

**useState dla**:

- Form inputs (controlled components)
- UI state (modal open/close, expanded/collapsed)
- Selected date in calendar
- Current month in calendar
- Search/filter values (pre-debounce)

**useReducer dla**:

- Complex form state (jeśli React Hook Form insufficient)
- Multi-step wizards (future)

---

## 7. Responsywność i Accessibility

### 7.1. Breakpoints

```css
/* Tailwind 4 default */
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px

/* Custom breakpoints (jeśli potrzebne) */
mobile: <768px
tablet: 768-1023px
desktop: ≥1024px
```

### 7.2. Layout Adaptations

| Component       | Desktop             | Tablet              | Mobile                |
| --------------- | ------------------- | ------------------- | --------------------- |
| Navigation      | Vertical sidebar    | Collapsed sidebar   | Bottom nav bar        |
| Calendar        | 7x5-6 grid          | 7x5-6 grid          | Day list (scrollable) |
| Plans Grid      | 3 columns           | 2 columns           | 1 column              |
| Forms           | Max-width 700px     | Max-width 600px     | Full width (padding)  |
| Modals          | Centered, max-width | Centered, max-width | Full screen           |
| Session Detail  | Max-width 900px     | Max-width 700px     | Full width            |
| Tables (future) | Full table          | Horizontal scroll   | Card list             |

### 7.3. Touch Targets (Mobile)

- Minimum 44x44px (WCAG AAA)
- Spacing between clickable elements: 8px+
- FAB: 56x56px (Material Design standard)
- Bottom nav items: 48x48px min

### 7.4. Keyboard Navigation

| Context         | Keys        | Action                           |
| --------------- | ----------- | -------------------------------- |
| Calendar Grid   | Arrow keys  | Navigate days                    |
|                 | Enter       | Open day/first session           |
|                 | Space       | Select day                       |
|                 | Escape      | Close popover/modal              |
| Session Detail  | Space       | Toggle answer                    |
|                 | C           | Mark complete                    |
|                 | N           | Focus notes                      |
| Modals          | Tab         | Cycle through focusable elements |
|                 | Escape      | Close modal                      |
| Forms           | Tab         | Next field                       |
|                 | Shift+Tab   | Previous field                   |
|                 | Enter       | Submit                           |
| Dropdowns/Menus | Arrow keys  | Navigate options                 |
|                 | Enter/Space | Select option                    |
|                 | Escape      | Close menu                       |
| Tabs            | Arrow keys  | Switch tabs                      |
|                 | Home/End    | First/last tab                   |

### 7.5. Screen Reader Support

**Semantic HTML**:

```html
<header>
  → Top bar, page headers
  <nav>
    → Sidebar, bottom nav
    <main>
      → Primary content
      <section>
        → Grouped content
        <article>
          → Independent content (cards, sessions)
          <aside>
            → Supplementary content (future)
            <footer>→ Page footer (future)</footer>
          </aside>
        </article>
      </section>
    </main>
  </nav>
</header>
```

**ARIA Labels**:

- Navigation: `<nav aria-label="Main navigation">`
- Buttons (icon-only): `<button aria-label="Close modal">`
- Inputs: `aria-label` jeśli brak visible label
- Status updates: `<div aria-live="polite" aria-atomic="true">`
- Current page: `<a aria-current="page">`
- Expanded state: `<button aria-expanded="true">`
- Required fields: `<input aria-required="true">`
- Invalid fields: `<input aria-invalid="true" aria-describedby="error-id">`

**Live Regions**:

- Toast notifications: `aria-live="polite"`
- Form errors: `aria-live="assertive"`
- Loading states: `aria-live="polite"` + "Loading..."
- Success messages: `aria-live="polite"`

**Focus Management**:

- Trap focus w modals (react-focus-trap lub manual)
- Return focus on modal close (store previous activeElement)
- Skip links: "Skip to main content" (hidden, visible on focus)
- Focus visible: Wyraźny outline (nie usuwać outline!)

### 7.6. Color Contrast (WCAG AA)

- Normal text: 4.5:1 minimum
- Large text (18pt/24px+): 3:1 minimum
- UI components: 3:1 minimum
- Test tools: axe DevTools, WAVE, Lighthouse

### 7.7. Motion & Animation

**Prefers-reduced-motion**:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Animations to reduce/disable**:

- Slide-in/out transitions
- Fade transitions
- Spinner rotations (replace with static)
- Scroll-triggered animations

---

## 8. Security Considerations

### 8.1. Authentication & Authorization

**Protected Routes**:

- Middleware: Check Supabase session before rendering
- No session: Redirect to /login with returnUrl
- Client-side: `useAuth()` hook, conditional rendering
- Server-side: Astro middleware validates token

**Token Management**:

- JWT stored w httpOnly cookies (Supabase default jeśli SSR)
- Automatic refresh przez Supabase SDK
- Never expose token w URL, console.log (production)

**Session Monitoring**:

- `onAuthStateChange` listener w AuthProvider
- On session expiry: Auto-logout + toast "Your session expired, please login again"
- On concurrent login elsewhere: Optional invalidate other sessions

**Re-authentication**:

- Sensitive actions (delete account): Require password confirm
- Implemented via Supabase `reauthenticate()` method

### 8.2. Input Security

**XSS Prevention**:

- React auto-escaping (dangerouslySetInnerHTML avoided)
- Sanitize HTML jeśli rich text implemented (DOMPurify)
- Validate input na client i server

**Injection Prevention**:

- Parameterized queries (Supabase SDK handles)
- No raw SQL w frontend
- API validates all inputs

**Length Validation**:

- Client-side: maxLength on inputs
- Server-side: Enforce limits (title 200, sourceMaterial 200KB)

**Sanitization**:

- Trim whitespace
- Remove control characters
- Escape special chars jeśli needed

### 8.3. Network Security

**HTTPS**:

- All API calls over HTTPS
- Redirect HTTP → HTTPS (server config)
- Supabase URL always https://

**CORS**:

- Supabase: Whitelist frontend domain
- API: Strict origin policy

**Rate Limiting**:

- Client-side: Disable button after submit (prevent double-click)
- Server-side: API rate limits (enforced przez Astro middleware)
- AI generation: 5 per hour limit, feedback w UI
- Login attempts: 5 per 15min, then lockout

**Sensitive Data**:

- Never log passwords, tokens, PII
- Scrub errors przed user display
- API errors: Generic messages ("Something went wrong")

### 8.4. Data Privacy

**RLS (Row Level Security)**:

- Enforced at database level (Supabase)
- All queries automatically filtered by auth.uid()
- Frontend nie może access innych users' data

**LocalStorage**:

- Store tylko non-sensitive data:
  - Theme preference
  - Draft content (study plan being created)
  - UI state (collapsed sidebar)
- Clear on logout
- Never store tokens (handled by Supabase SDK in httpOnly cookies)

**Logging**:

- Production: No console.log with sensitive data
- Error tracking: Scrub PII przed send to service (Sentry, etc.)
- AI generation logs: Store parameters i response, ale scrub sourceMaterial jeśli PII

---

## 9. Edge Cases i Error Handling

### 9.1. Authentication Errors

| Scenario                   | UI Response                                                            |
| -------------------------- | ---------------------------------------------------------------------- |
| Wrong credentials          | Inline error: "Invalid email or password"                              |
| Email already exists       | Inline error: "Account with this email already exists" + link to login |
| Network error during login | Toast: "Connection error. Please check your internet and try again."   |
| Session expired            | Toast: "Your session expired. Please login again." + redirect to login |
| Token refresh failure      | Auto-logout + toast                                                    |
| Rate limit hit (login)     | Inline error: "Too many attempts. Try again in 15 minutes."            |

### 9.2. Study Plan Errors

| Scenario                | UI Response                                                                     |
| ----------------------- | ------------------------------------------------------------------------------- |
| Word count < 200        | Disabled submit + red indicator + "Minimum 200 words required"                  |
| Word count > 5000       | Disabled submit + red indicator + "Maximum 5000 words exceeded"                 |
| Duplicate title         | Toast error: "A plan with this title already exists. Choose a different title." |
| Network error on save   | Toast error + "Retry" button + draft saved to localStorage                      |
| Delete with sessions    | Confirmation modal: "This will delete X sessions. Continue?"                    |
| Delete plan (API error) | Toast error: "Failed to delete plan. Please try again."                         |

### 9.3. AI Generation Errors

| Scenario                     | UI Response                                                                       |
| ---------------------------- | --------------------------------------------------------------------------------- |
| Pending generation exists    | Disabled button + tooltip: "Generation in progress. View status."                 |
| No taxonomy levels selected  | Disabled submit + error: "Select at least one taxonomy level"                     |
| Count out of range (1-50)    | Inline error: "Enter a number between 1 and 50"                                   |
| API timeout (>2min)          | Modal error: "Generation taking longer than expected. Continue waiting?"          |
| API error (4xx/5xx)          | Modal error: "Generation failed. Try again or contact support."                   |
| Rate limit hit (5/hour)      | Disabled button + tooltip: "Limit reached. Try again in X minutes."               |
| Partial success              | Review page warning: "Some sessions failed to generate. Accept partial or retry?" |
| Network error during polling | Retry polling (exponential backoff), show "Connection issues" after 3 fails       |

### 9.4. Review Session Errors

| Scenario                  | UI Response                                                                |
| ------------------------- | -------------------------------------------------------------------------- |
| Session deleted (404)     | Toast: "This session no longer exists." + redirect to calendar             |
| Network error on complete | Optimistic UI (mark complete), retry in background, sync indicator if fail |
| Concurrent edit conflict  | Last-write-wins (MVP), optional: Warning "Another device may have edited"  |
| Already completed         | Show "Completed on [date]" badge, allow re-review                          |
| Feedback submit error     | Toast error + "Retry" button, feedback not lost (keep in form state)       |

### 9.5. Calendar Errors

| Scenario                    | UI Response                                                      |
| --------------------------- | ---------------------------------------------------------------- |
| No sessions for month       | Empty state in calendar: "No sessions scheduled this month"      |
| Loading large session count | Skeleton screens, progressive loading (load current month first) |
| Date in past (manual add)   | Warning: "This date is in the past. Continue?" + confirm         |
| Network error on load       | Error state: "Failed to load sessions" + "Retry" button          |

### 9.6. General Errors

| Scenario                   | UI Response                                                                  |
| -------------------------- | ---------------------------------------------------------------------------- |
| Network offline            | Global offline indicator (top bar), queue actions for sync (future PWA)      |
| Slow API response (>3s)    | Show loading state (spinner), minimum 200ms before show to avoid flash       |
| Unexpected React error     | Error Boundary: "Something went wrong" + "Reload page" button + error logged |
| API 500 error              | Toast: "Server error. Please try again later."                               |
| Unsaved changes (navigate) | Browser confirm: "You have unsaved changes. Leave page?"                     |

---

## 10. Mapowanie User Stories do Architektury UI

### US-001: Rejestracja nowego użytkownika

**Widoki**: Register Page (`/register`)  
**Komponenty**: `AuthLayout`, `RegisterForm`, `Input`, `Button`, `PasswordStrengthMeter`  
**Flow**:

1. User fill email + password + confirm
2. Real-time validation (format, length, match)
3. Submit → POST to Supabase Auth
4. Success: Auto-login + redirect to /app/calendar (empty state)
5. Error: Inline message (email exists, etc.)

**Kryteria akceptacji**: ✅ All covered

---

### US-002: Logowanie do systemu

**Widoki**: Login Page (`/login`)  
**Komponenty**: `AuthLayout`, `LoginForm`, `Input`, `Button`, `Alert`  
**Flow**:

1. User enter email + password
2. Submit → Supabase Auth signIn
3. Success: Redirect to /app/calendar
4. Error: Generic message "Invalid credentials"

**Kryteria akceptacji**: ✅ All covered

---

### US-003: Zmiana hasła

**Widoki**: Settings Page (`/app/settings`, Account tab)  
**Komponenty**: `SettingsTabs`, Change Password form, `Input`, `Button`  
**Flow**:

1. Navigate to Settings → Account tab
2. Fill old password, new password, confirm new
3. Validation (old correct, new match, min 8 chars)
4. Submit → Supabase updateUser
5. Success toast + optional re-login

**Kryteria akceptacji**: ✅ All covered

---

### US-004: Tworzenie nowego "Planu Nauki"

**Widoki**: Create Study Plan (`/app/plans/new`)  
**Komponenty**: `PlanForm`, `Input`, `Textarea`, `WordCountIndicator`, `Button`  
**Flow**:

1. Click "Create Plan" → /app/plans/new
2. Fill title + paste source material
3. Live word count (200-5000)
4. Color-coded indicator (red/yellow/green/red)
5. Submit enabled only when valid
6. POST /api/study-plans
7. Success: Redirect to /app/plans + toast

**Kryteria akceptacji**: ✅ All covered

---

### US-005: Usuwanie "Planu Nauki"

**Widoki**: Study Plans List (`/app/plans`)  
**Komponenty**: `PlanCard`, `ConfirmDialog`, `DropdownMenu`  
**Flow**:

1. Plan card → Actions dropdown → Delete
2. Confirmation modal: "This will delete X sessions. Continue?"
3. Confirm → DELETE /api/study-plans/{planId}
4. Optimistic removal from list
5. Success toast

**Kryteria akceptacji**: ✅ All covered (cascade deletion)

---

### US-006: Inicjowanie generowania planu AI

**Widoki**: Study Plans List + AI Generation Form (modal)  
**Komponenty**: `PlanCard`, `AIGenerationForm`, `Dialog`, `Input`, `CheckboxGroup`, `Button`  
**Flow**:

1. Plan card → "Generate AI Sessions"
2. Modal opens with form
3. Select count (1-50, default 10) + taxonomy levels (checkboxes with tooltips)
4. Submit → POST /api/study-plans/{planId}/ai-generations
5. Modal switches to progress state (polling)

**Kryteria akceptacji**: ✅ All covered

---

### US-007: Przeglądanie i edycja wygenerowanego planu

**Widoki**: AI Generation Review (`/app/ai-review/{genId}`)  
**Komponenty**: `ReviewHeader`, `SessionTimeline`, `SessionReviewCard`, `Button`  
**Flow**:

1. After generation success → "Review Sessions" link
2. Navigate to /app/ai-review/{genId}
3. See all proposed sessions grouped by date
4. Expand cards, inline edit (date, taxonomy, questions, answers)
5. Remove individual sessions (undo toast)
6. Changes saved locally (optimistic)

**Kryteria akceptacji**: ✅ All covered (edit, delete individual)

---

### US-008: Akceptacja planu AI

**Widoki**: AI Generation Review (`/app/ai-review/{genId}`)  
**Komponenty**: `ReviewHeader` (action bar), `Button`  
**Flow**:

1. In review page, click "Accept All"
2. Optional confirmation if edited
3. POST /api/ai-generations/{genId}/accept
4. Sessions status: proposed → accepted
5. Redirect to /app/calendar
6. Sessions visible in calendar (highlighted)

**Kryteria akceptacji**: ✅ All covered

---

### US-009: Obsługa błędu generowania planu

**Widoki**: AI Generation Progress (modal)  
**Komponenty**: `AIGenerationProgress`, `Dialog`, `Alert`, `Button`  
**Flow**:

1. During polling, API returns error OR timeout
2. Modal shows error message: "Generation failed. Please try again."
3. Actions: "Retry" (back to form with same params), "Cancel", "Contact Support"
4. Log preserved for debugging

**Kryteria akceptacji**: ✅ All covered

---

### US-010: Manualne dodawanie powtórki

**Widoki**: Calendar View + Add Session Modal/Form  
**Komponenty**: `CalendarGrid`, `AddSessionModal`, `Select`, `Input`, `Textarea`, `Button`  
**Flow**:

1. Calendar → Click on day OR FAB (mobile)
2. Modal: Select plan, select template OR custom exercise, set date
3. Template dropdown: Predefined options (GET /api/exercise-templates)
4. Custom: Text input for exercise label + questions/answers
5. Submit → POST /api/review-sessions (status: accepted, isAiGenerated: false)
6. Session appears in calendar

**Kryteria akceptacji**: ✅ All covered (predefined + custom)

---

### US-011: Przeglądanie zaplanowanych zadań w kalendarzu

**Widoki**: Calendar View (`/app/calendar`)  
**Komponenty**: `CalendarGrid`, `CalendarDayCell`, `SessionCardMini`, `Badge`  
**Flow**:

1. Login → Default view /app/calendar
2. Miesięczny grid z wszystkimi sesjami
3. Each day cell: Plan title + exercise label dla każdej sesji
4. Today highlighted
5. Visual distinction: pending vs completed (color, icon)

**Kryteria akceptacji**: ✅ All covered

---

### US-012: Przeprowadzanie sesji powtórkowej

**Widoki**: Review Session Detail (`/app/review-sessions/{sessionId}`)  
**Komponenty**: `SessionHeader`, `QuestionList`, `QuestionCard`, `Button`, `FeedbackModal`  
**Flow**:

1. Calendar → Click session → Navigate to detail page
2. See plan title, exercise label, date
3. List of questions (scrollable)
4. Click "Show Answer" → Answer slides down (+ hints if any)
5. After reading all, click "Mark as Completed"
6. POST /api/review-sessions/{sessionId}/complete
7. Feedback modal: Optional rating 1-5 + comment
8. Submit feedback OR skip
9. Toast "Session completed!" + redirect to calendar
10. Session marked complete (visual change)

**Kryteria akceptacji**: ✅ All covered

---

## 11. Problem-Solution Mapping

### Problem: Czasochłonne ręczne planowanie powtórek

**UI Solutions**:

- **AI Generation Flow**: One-click inicjacja (US-006)
- **Sensible Defaults**: Pre-selected taxonomy levels (Understand, Apply, Analyze)
- **Bulk Operations**: "Accept All" button dla efektywności
- **Quick Review**: Możliwość akceptacji bez edycji

**Komponenty**: `AIGenerationForm`, `AIGenerationProgress`, `SessionReviewCard`

---

### Problem: Brak strategii utrwalania wiedzy

**UI Solutions**:

- **Calendar Visualization**: Miesięczny widok pokazuje rozkład powtórek (spaced repetition visible)
- **Taxonomy Indicators**: Badges pokazują różnorodność poziomów poznawczych
- **Progress Tracking**: Completed vs pending sessions (visual feedback)

**Komponenty**: `CalendarGrid`, `SessionCardMini`, `Badge`

---

### Problem: Niska motywacja do powtórek

**UI Solutions**:

- **Gamification Elements** (future): Streaks, badges (not in MVP but space for)
- **Easy Completion**: Quick mark complete z popover (bez full page)
- **Positive Feedback**: Success toasts, completed visual state
- **Optional Reflection**: Feedback modal (nie forced)

**Komponenty**: `SessionPopover`, `FeedbackModal`, Toast notifications

---

### Problem: Trudność w tworzeniu efektywnych ćwiczeń

**UI Solutions**:

- **Predefined Templates**: Dropdown z curated templates (expert-designed)
- **Tooltips z Przykładami**: Bloom level tooltips z examples
- **AI-Generated Content**: Questions i answers provided (not blank slate)
- **Edit Capability**: User może refine jeśli needed

**Komponenty**: `AIGenerationForm` (tooltips), `SessionReviewCard` (inline editor), Template dropdown

---

### Problem: Brak czasu na naukę

**UI Solutions**:

- **Quick Sessions**: Focused detail view (no distractions)
- **Mobile-Optimized**: Learn anywhere (responsive, touch-friendly)
- **Flexible Scheduling**: Easy to reschedule (edit session date)
- **Short Format**: Questions/answers (nie długie teksty)

**Komponenty**: `ReviewSessionDetail` (focus mode), Mobile layouts, `CalendarDayList`

---

### Problem: Profesjonaliści potrzebują rozwiązania technicznego (code-friendly)

**UI Solutions** (future enhancements):

- **Markdown Support**: Code snippets w questions/answers (react-markdown)
- **Syntax Highlighting**: For code examples (future)
- **Import from GitHub**: Direct paste from docs/README (future)

**Komponenty** (MVP basic, future enhanced): `Textarea` → `MarkdownEditor`

---

## 12. Performance Considerations

### 12.1. Loading Strategies

**Critical Path (above fold)**:

- `client:load`: Auth components, Calendar grid, Navigation
- Inline critical CSS (Tailwind base + components)
- Preload fonts, key assets

**Below Fold**:

- `client:visible`: Session cards poniżej 3rd row, footer content
- Lazy load images (jeśli ilustracje added)

**Non-Critical**:

- `client:idle`: Settings components, help modals, analytics scripts

### 12.2. Code Splitting

**Route-based**:

- Każda Astro page = separate bundle
- Shared components bundled (React, shadcn)

**Component-based**:

- Dynamic imports dla ciężkich komponentów:
  - Calendar library (react-big-calendar)
  - Rich text editor (jeśli implemented)
  - Chart libraries (future metrics dashboard)

**Example**:

```typescript
const Calendar = lazy(() => import("./components/Calendar"));
```

### 12.3. Data Loading

**Pagination**:

- Study Plans: 20 per page (default)
- Review Sessions: 50 per page
- Load more on scroll (infinite scroll) OR pagination controls

**Windowing**:

- Calendar: Load current month ± 1 month (3 months total)
- Navigate to different month: Fetch on demand, cache
- Long lists (>100 items): Virtualization (react-window)

**Prefetching**:

- Hover on plan card: Prefetch sessions (React Query)
- Navigate between months: Prefetch adjacent months
- Link hover: Prefetch next page (Astro built-in)

### 12.4. Caching

**React Query**:

- Study Plans: 5min stale time, background refetch
- Review Sessions: 1min stale time
- Templates: 1 hour stale time (rarely change)

**Browser Cache**:

- Static assets: Long cache (1 year, hash-based filenames)
- API responses: Respect Cache-Control headers
- Service Worker (future PWA): Cache static assets, API responses

### 12.5. Optimizations

**Memoization**:

```typescript
const sortedPlans = useMemo(() => plans.sort((a, b) => b.updatedAt - a.updatedAt), [plans]);

const MemoizedCard = memo(PlanCard);
```

**Debouncing**:

- Search: 300ms debounce
- Word count: 200ms debounce
- Auto-save: 5s debounce

**Throttling**:

- Scroll handlers: 100ms throttle
- Resize handlers: 200ms throttle

**Image Optimization** (jeśli images added):

- Astro Image component: Automatic resizing, format conversion (WebP)
- Lazy loading: `loading="lazy"`
- Responsive images: srcset, sizes

---

## 13. Testing Strategy (Overview)

### 13.1. Unit Tests

- Custom hooks (useAuth, useWordCount, useDebounce)
- Utility functions (date formatting, word count calculation)
- Form validation (Zod schemas)

### 13.2. Component Tests

- UI components (Button, Input, Card state changes)
- Form components (validation, submission)
- Interaction (click, type, keyboard navigation)

### 13.3. Integration Tests

- User flows (create plan → generate AI → accept → complete session)
- API integration (mocked API responses)
- State management (Context, React Query)

### 13.4. E2E Tests

- Critical paths (registration → first plan → first session complete)
- AI generation flow (full happy path)
- Mobile responsiveness (viewport testing)

### 13.5. Accessibility Tests

- Automated (axe-core, jest-axe)
- Manual (keyboard navigation, screen reader)
- Color contrast (automated tools)

### 13.6. Performance Tests

- Lighthouse scores (target: >90 all categories)
- Core Web Vitals (LCP <2.5s, FID <100ms, CLS <0.1)
- Bundle size monitoring (<200KB initial JS)

---

## 14. Deployment & DevOps (Brief)

### 14.1. Build Process

- Astro build: SSR dla protected routes, SSG dla public
- TypeScript compilation: Strict mode
- Tailwind: Purge unused CSS
- Asset optimization: Minification, compression

### 14.2. Hosting

- Recommended: Vercel, Netlify, Cloudflare Pages (Astro support)
- SSR compatible
- Edge functions dla API routes (optional)

### 14.3. Environment Variables

```
PUBLIC_SUPABASE_URL=...
PUBLIC_SUPABASE_ANON_KEY=...
OPENROUTER_API_KEY=... (backend only)
```

### 14.4. Monitoring

- Error tracking: Sentry (React Error Boundary integration)
- Analytics: Plausible, PostHog (privacy-friendly)
- Performance: Vercel Analytics, Lighthouse CI

---

## 15. Future Enhancements (Post-MVP)

### 15.1. Advanced Features

- **Spaced Repetition Algorithm**: Custom scheduling oparty na performance
- **Rich Text Support**: Markdown rendering, code syntax highlighting
- **Collaborative Plans**: Share plans between users
- **Import/Export**: JSON, CSV export planów i sesji
- **Mobile App**: React Native (kod share z web)

### 15.2. UX Improvements

- **Drag-and-Drop**: Reschedule sessions w kalendarzu
- **Bulk Actions**: Multi-select sessions → bulk complete/delete/reschedule
- **Advanced Filters**: Multi-select plans, taxonomy levels, date ranges
- **Search**: Full-text search przez sessions, plans
- **Notifications**: Email reminders, push notifications (PWA)

### 15.3. Analytics Dashboard

- **Metrics Visualization**: Charts (AI usage, edit rate, completion rate)
- **Progress Tracking**: Study streaks, weekly goals
- **Insights**: "You learn best on weekday mornings" (ML analysis)

### 15.4. Accessibility Enhancements

- **Voice Input**: Speak answers (Web Speech API)
- **High Contrast Mode**: Explicit toggle
- **Font Size Control**: User preference
- **Translation**: i18n support (react-i18next)

### 15.5. Performance

- **PWA**: Service worker, offline mode, install prompt
- **Optimistic Sync**: Queue offline actions, sync on reconnect
- **Real-time**: WebSockets dla AI generation updates (replace polling)

---

## Podsumowanie

Architektura UI dla Bloom Learning została zaprojektowana z myślą o:

1. **Efektywności**: Kalendarz jako hub, quick actions, AI automation
2. **Kontroli**: Pełna edycja AI outputs, manual overrides
3. **Dostępności**: WCAG AA compliance, keyboard navigation, screen reader support
4. **Responsywności**: Dedykowane layouty mobile/tablet/desktop
5. **Bezpieczeństwie**: Protected routes, RLS, input validation, HTTPS
6. **Skalowalności**: Modular components, React Query caching, code splitting
7. **UX**: Clear flows, feedback, error handling, empty states

**Kluczowe decyzje architektoniczne**:

- **Astro 5** dla SSR/SSG + React 19 dla interaktywności
- **React Context** dla app state + **React Query** dla API state
- **shadcn/ui** + **Tailwind 4** dla spójnego, dostępnego UI
- **Kalendarz jako main view** (daily learning hub)
- **Dedykowany AI Review flow** (quality control przed acceptance)
- **Mobile-first responsive design** z bottom navigation
- **Comprehensive error handling** (graceful degradation)

Architektura spełnia wszystkie wymagania z PRD, mapuje do wszystkich 12 User Stories, integruje się z planned API endpoints, i rozwiązuje core problem użytkownika (czasochłonne ręczne planowanie) poprzez intuitive, AI-powered interface.
