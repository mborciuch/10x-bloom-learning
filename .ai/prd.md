# Dokument wymagań produktu (PRD) - Bloom Learning

## 1. Przegląd produktu

Bloom Learning to aplikacja internetowa zaprojektowana, aby zrewolucjonizować proces nauki i utrwalania wiedzy dla profesjonalistów z branż technicznych, takich jak programiści i inżynierowie. Aplikacja wykorzystuje sztuczną inteligencję do generowania spersonalizowanych planów powtórek w oparciu o taksonomię Blooma, przeplatanie i techniki aktywnego wydobywania wiedzy (retrieval). Użytkownicy dostarczają materiał do nauki w formie tekstu, a system tworzy ustrukturyzowany harmonogram ćwiczeń angażujących różne poziomy poznawcze - od zapamiętywania po analizę i tworzenie. Produkt oferuje również pełną kontrolę manualną, umożliwiając użytkownikom tworzenie i modyfikowanie własnych planów nauki. Celem jest zastąpienie czasochłonnego i często nieefektywnego, ręcznego planowania powtórek inteligentnym, zautomatyzowanym i elastycznym narzędziem, które podnosi jakość i efektywność nauki.

## 2. Problem użytkownika

Głównym problemem, który rozwiązuje Bloom Learning, jest nieefektywność i czasochłonność manualnego planowania powtórek. Profesjonaliści, zwłaszcza w szybko zmieniających się dziedzinach technicznych, muszą nieustannie przyswajać nową wiedzę. Tradycyjny proces nauki często kończy się na jednorazowym przeczytaniu materiału, bez opracowanej strategii utrwalania wiedzy. Samodzielne tworzenie planu powtórek, który byłby zróżnicowany (różne typy ćwiczeń) i skuteczny (oparty na sprawdzonych metodykach), jest trudne, wymaga dużej samodyscypliny i pochłania cenny czas. W rezultacie powtórki są często pomijane, a wiedza szybko ulatuje, co prowadzi do frustracji i konieczności uczenia się tych samych zagadnień od nowa. Brak jest narzędzia, które w prosty sposób automatyzowałoby tworzenie wysokiej jakości, spersonalizowanego planu nauki.

## 3. Wymagania funkcjonalne

### 3.1. Zarządzanie kontem użytkownika
- Użytkownik musi mieć możliwość założenia konta w systemie (rejestracja).
- Użytkownik musi mieć możliwość zalogowania się na swoje konto (logowanie).
- Zalogowany użytkownik musi mieć możliwość zmiany swojego hasła.
- Wszystkie plany i powtórki muszą być przypisane do konta konkretnego użytkownika.

### 3.2. Zarządzanie "Planem Nauki"
- Użytkownik może stworzyć "Plan Nauki" poprzez wklejenie materiału tekstowego (.txt, .md).
- System powinien walidować długość wklejonego tekstu (np. min. 200 słów, max. 5000 słów).
- Użytkownik może przeglądać listę swoich "Planów Nauki".
- Użytkownik może usunąć "Plan Nauki", co spowoduje usunięcie również wszystkich powiązanych z nim "Powtórek".

### 3.3. Generowanie "Powtórek" przez AI
- Użytkownik może zainicjować proces generowania "Powtórek" dla wybranego "Planu Nauki".
- Użytkownik musi określić liczbę "Powtórek" do wygenerowania oraz wybrać poziomy taksonomii Blooma, które mają być uwzględnione.
- System wysyła do AI jedno, złożone zapytanie zawierające materiał tekstowy, wybrane poziomy, listę predefiniowanych typów ćwiczeń i instrukcje dotyczące formatu odpowiedzi (JSON) oraz interpretacji fragmentów kodu.
- Po otrzymaniu odpowiedzi od AI, system prezentuje użytkownikowi proponowany plan "Powtórek" w widoku kalendarza.
- Użytkownik ma możliwość edycji treści i daty każdej wygenerowanej "Powtórki" oraz usuwania poszczególnych "Powtórek" z planu.
- Użytkownik musi ostatecznie zaakceptować plan za pomocą dedykowanego przycisku, co zapisuje "Powtórki" w bazie danych.
- W przypadku błędu generowania, system wyświetla stosowny komunikat i pozwala spróbować ponownie.

### 3.4. Manualne tworzenie "Powtórek"
- Użytkownik może manualnie dodać nową "Powtórkę" w widoku kalendarza.
- Podczas dodawania, użytkownik wybiera datę oraz typ ćwiczenia.
- Użytkownik może wybrać typ ćwiczenia z predefiniowanej listy (zahardkodowanej w systemie) lub stworzyć całkowicie własne polecenie tekstowe.
- System musi rozróżniać w bazie danych, czy ćwiczenie jest "predefiniowane" czy "własne".

### 3.5. Interfejs nauki
- Głównym interfejsem jest widok kalendarza, który wyświetla zaplanowane "Powtórki".
- W widoku kalendarza dla każdego dnia widoczny jest "Temat do nauki" (nazwa Planu) oraz "Typ ćwiczenia".
- Kliknięcie na "Powtórkę" w kalendarzu przenosi użytkownika do dedykowanego widoku "Sesji powtórkowej".
- Widok "Sesji powtórkowej" zawiera listę poleceń/pytań oraz przykładową odpowiedź, która domyślnie jest ukryta i można ją odsłonić.
- Użytkownik może oznaczyć "Powtórkę" jako "Zrobioną".

### 3.6. Onboarding
- Po pierwszym zalogowaniu, nowy użytkownik zobaczy "pusty stan" (empty state) z wyraźnym wezwaniem do działania (call to action), np. "Stwórz swój pierwszy plan nauki".

## 4. Granice produktu

Następujące funkcjonalności celowo NIE wchodzą w zakres MVP (Minimum Viable Product):
- Własny, zaawansowany algorytm powtórek oparty na krzywej zapominania (jak w SuperMemo, Anki).
- Import materiałów w formatach innych niż czysty tekst (np. PDF, DOCX, strony internetowe).
- Funkcje społecznościowe, takie jak współdzielenie planów nauki między użytkownikami.
- Integracje z zewnętrznymi platformami edukacyjnymi (np. Coursera, Udemy).
- Dedykowane aplikacje mobilne (iOS, Android). Produkt będzie dostępny wyłącznie jako aplikacja internetowa.

## 5. Historyjki użytkowników

### Zarządzanie kontem
- ID: US-001
- Tytuł: Rejestracja nowego użytkownika
- Opis: Jako nowy użytkownik, chcę móc założyć konto używając adresu e-mail i hasła, aby móc korzystać z aplikacji i zapisywać swoje plany nauki.
- Kryteria akceptacji:
  - Formularz rejestracji zawiera pola na adres e-mail i hasło.
  - System waliduje poprawność formatu adresu e-mail.
  - System wymaga hasła o minimalnej długości (np. 8 znaków).
  - Po pomyślnej rejestracji jestem automatycznie zalogowany i przekierowany do głównego widoku aplikacji.
  - W przypadku, gdy e-mail jest już zajęty, wyświetlany jest odpowiedni komunikat błędu.

- ID: US-002
- Tytuł: Logowanie do systemu
- Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się na moje konto, aby uzyskać dostęp do moich planów nauki.
- Kryteria akceptacji:
  - Formularz logowania zawiera pola na adres e-mail i hasło.
  - Po podaniu poprawnych danych jestem zalogowany i widzę główny interfejs aplikacji (kalendarz).
  - Po podaniu błędnych danych wyświetlany jest komunikat o niepoprawnym loginie lub haśle.

- ID: US-003
- Tytuł: Zmiana hasła
- Opis: Jako zalogowany użytkownik, chcę mieć możliwość zmiany swojego hasła, aby zabezpieczyć swoje konto.
- Kryteria akceptacji:
  - W ustawieniach konta znajduje się opcja zmiany hasła.
  - Formularz wymaga podania starego hasła, nowego hasła i powtórzenia nowego hasła.
  - System waliduje, czy stare hasło jest poprawne.
  - System waliduje, czy nowe hasła w obu polach są identyczne.
  - Po pomyślnej zmianie hasła otrzymuję potwierdzenie.

### Zarządzanie Planami Nauki
- ID: US-004
- Tytuł: Tworzenie nowego "Planu Nauki"
- Opis: Jako użytkownik, chcę móc wkleić długi tekst jako materiał do nauki i zapisać go jako "Plan Nauki", aby na jego podstawie generować powtórki.
- Kryteria akceptacji:
  - Istnieje przycisk/opcja "Stwórz nowy plan".
  - Widzę pole tekstowe do wklejenia treści oraz pole na nazwę planu.
  - System sprawdza, czy długość tekstu mieści się w zdefiniowanych limitach (200-5000 słów).
  - Jeśli tekst jest za krótki lub za długi, wyświetlany jest komunikat błędu, a plan nie jest tworzony.
  - Po poprawnym zapisaniu, nowy plan jest widoczny na mojej liście planów.

- ID: US-005
- Tytuł: Usuwanie "Planu Nauki"
- Opis: Jako użytkownik, chcę móc usunąć istniejący "Plan Nauki", aby zachować porządek na moim koncie.
- Kryteria akceptacji:
  - Na liście planów każda pozycja ma opcję "Usuń".
  - Przed usunięciem system wyświetla okno z prośbą o potwierdzenie.
  - Potwierdzenie usunięcia nieodwracalnie kasuje "Plan Nauki" oraz wszystkie powiązane z nim "Powtórki" (zarówno te z AI, jak i manualne).

### Generowanie Planu przez AI
- ID: US-006
- Tytuł: Inicjowanie generowania planu AI
- Opis: Jako użytkownik, chcę wybrać "Plan Nauki", liczbę powtórek i poziomy Blooma, aby AI wygenerowało dla mnie propozycję planu powtórek.
- Kryteria akceptacji:
  - Przy każdym "Planie Nauki" znajduje się opcja "Generuj powtórki AI".
  - Po jej kliknięciu widzę formularz, w którym mogę wpisać liczbę powtórek i zaznaczyć checkboksami pożądane poziomy taksonomii Blooma.
  - Po zatwierdzeniu formularza system rozpoczyna proces generowania, a interfejs informuje mnie o tym (np. loader).

- ID: US-007
- Tytuł: Przeglądanie i edycja wygenerowanego planu
- Opis: Jako użytkownik, chcę zobaczyć wygenerowany przez AI plan w kalendarzu i mieć możliwość jego edycji przed ostatecznym zatwierdzeniem.
- Kryteria akceptacji:
  - Wygenerowane "Powtórki" pojawiają się w kalendarzu jako propozycje (np. w innym kolorze).
  - Mogę kliknąć na każdą proponowaną "Powtórkę", aby edytować jej treść i polecenia.
  - Mogę usunąć pojedynczą, proponowaną "Powtórkę" z planu.
  - Widoczne są przyciski "Zaakceptuj plan" i "Odrzuć".

- ID: US-008
- Tytuł: Akceptacja planu AI
- Opis: Jako użytkownik, chcę móc zaakceptować wygenerowany (i ewentualnie zmodyfikowany) plan, aby powtórki zostały na stałe zapisane w moim kalendarzu.
- Kryteria akceptacji:
  - Po kliknięciu "Zaakceptuj plan", wszystkie proponowane "Powtórki" są zapisywane w bazie danych.
  - Propozycje w kalendarzu zmieniają swój wygląd na standardowy (taki jak dla powtórek manualnych).
  - Przycisk "Zaakceptuj plan" znika.

- ID: US-009
- Tytuł: Obsługa błędu generowania planu
- Opis: Jako użytkownik, w przypadku problemu z generowaniem planu przez AI, chcę otrzymać jasny komunikat i możliwość ponowienia próby.
- Kryteria akceptacji:
  - Jeśli API AI zwróci błąd lub proces przekroczy limit czasu, loader znika.
  - W interfejsie pojawia się komunikat, np. "Wystąpił błąd podczas generowania planu. Spróbuj ponownie.".
  - Użytkownik może ponownie uruchomić proces generowania.

### Manualne Zarządzanie Powtórkami
- ID: US-010
- Tytuł: Manualne dodawanie powtórki
- Opis: Jako użytkownik, chcę móc ręcznie dodać powtórkę w kalendarzu, aby mieć pełną kontrolę nad swoim harmonogramem nauki.
- Kryteria akceptacji:
  - W widoku kalendarza istnieje opcja "Dodaj powtórkę" dla wybranego dnia.
  - W formularzu dodawania mogę wybrać, którego "Planu Nauki" dotyczy powtórka.
  - Mogę wybrać typ ćwiczenia z predefiniowanej listy (np. "Co to jest X?", "Wyjaśnij Y").
  - Mogę zignorować listę i wpisać własne, niestandardowe polecenie w polu tekstowym.
  - Po zapisaniu, nowa powtórka pojawia się w kalendarzu.

### Nauka
- ID: US-011
- Tytuł: Przeglądanie zaplanowanych zadań w kalendarzu
- Opis: Jako użytkownik, chcę po otwarciu aplikacji zobaczyć w kalendarzu wszystkie zaplanowane na dany dzień powtórki, aby szybko zorientować się, co mam do zrobienia.
- Kryteria akceptacji:
  - Kalendarz jest domyślnym widokiem po zalogowaniu.
  - Każdy dzień z zaplanowanymi zadaniami jest wyraźnie oznaczony.
  - W komórce dnia widoczna jest nazwa "Planu Nauki" i "Typ ćwiczenia" dla każdej powtórki.

- ID: US-012
- Tytuł: Przeprowadzanie sesji powtórkowej
- Opis: Jako użytkownik, chcę móc kliknąć na zadanie w kalendarzu, aby przejść do sesji nauki, gdzie mogę odpowiedzieć na pytania i sprawdzić poprawność odpowiedzi.
- Kryteria akceptacji:
  - Kliknięcie na "Powtórkę" w kalendarzu otwiera nowy widok "Sesji powtórkowej".
  - W widoku sesji widoczna jest lista pytań/poleceń z danej "Powtórki".
  - Pod każdym pytaniem znajduje się ukryta odpowiedź i przycisk "Pokaż odpowiedź".
  - Po zakończeniu sesji mogę oznaczyć ją jako "Ukończoną".

## 6. Metryki sukcesu

Kluczowe wskaźniki efektywności (KPI), które będą mierzyć sukces produktu w fazie MVP, koncentrują się na adopcji i jakości funkcji AI.

- 6.1. Wskaźnik akceptacji planów AI:
  - Metryka: Procent planów powtórek wygenerowanych przez AI, które są akceptowane przez użytkownika (poprzez kliknięcie przycisku "Zaakceptuj plan").
  - Cel: 75%
  - Uzasadnienie: Wysoki wskaźnik akceptacji będzie oznaczał, że generowane plany są wartościowe i trafne dla użytkowników, co jest kluczowe dla propozycji wartości produktu.

- 6.2. Wskaźnik wykorzystania generatora AI:
  - Metryka: Procent wszystkich "Powtórek" w systemie, które pochodzą z generatora AI w porównaniu do tych tworzonych manualnie.
  - Cel: 75%
  - Uzasadnienie: Ta metryka pokaże, czy użytkownicy preferują automatyzację i postrzegają ją jako lepszą alternatywę dla ręcznego tworzenia planu, co potwierdzi, że produkt rozwiązuje główny problem użytkownika.

- 6.3. Wskaźnik jakości generowania (metryka wewnętrzna):
  - Metryka: Stopień edycji planu AI przed jego akceptacją (mierzone jako % zmienionych/usuniętych "Powtórek" w ramach jednego planu).
  - Cel: Monitorowanie trendu (im niższy, tym lepiej).
  - Uzasadnienie: Ta "cicha metryka" pozwoli zespołowi produktowemu ocenić jakość i precyzję zapytań do AI. Znaczące edycje mogą wskazywać na potrzebę udoskonalenia szablonu zapytania lub samych predefiniowanych ćwiczeń.