# Podróżówka · AI Marketing OS (`podrozowka.pl`)

System operacyjny marketingu dla marki **Podróżówka** („odwrócona pocztówka” kupowana przed wyjazdem z Polski, wręczana Obdarowanym na świecie jako podziękowanie w ich języku z kodem QR do rejestracji na `podrozowka.pl`).

## Główne moduły aplikacji

1. **Plan Marketingowy (16 zadań + 3 Bramki Walidacji 0 → 1 + KPI):** harmonogram wdrożenia z oceną ICE, eksportem `.md`, możliwością dopisywania własnych zadań oraz trzema bramkami (`Pierwsza sprzedaż`, `Pierwsza relacja przez QR`, `Pierwsze opinie klientów`).
2. **Mózg Marki (Dokument Kontekstowy):** źródło prawdy wstrzykiwane do wszystkich agentów, z instrukcją operatora, kartą głosu, segmentami, CEP, przewagami, twardymi zakazami, katalogiem zdjęć z Polski oraz skanerem strony na żywo.
3. **Studio 8 Agentów AI:** Badacz Rynku (Google Search Grounding), Strateg Tematów & Wzrostu, Copywriter Głosu & Nagłówków, Architekt Social & Rolek, Audytor SEO & Widoczności LLM (GEO), Strateg Kampanii & Kreacji, Analityk Konwersji GA4 & Triangulacja oraz Prompt Director AI Gen.
4. **Linter Antywzorców + Humanizer:** walidacja 12 reguł produktowych (`lintPodrozowkaCopy`) oraz filtr stylu usuwający nawyki AI (grupy A–F).
5. **Generator Social Media & Publikacja Meta:** posty PAS/BAB, karuzela 7 slajdów (ze Slajdem 6 poświęconym planowanej na koniec stycznia 2027 wyprawie samochodowej po Europie i Afryce), scenariusze rolek 9:16 oraz publikacja przez Meta Graph API z UTM.
6. **Audyt Live SEO/GEO, GA4 & Google Ads:** weryfikacja surowego HTML `/sklep` bez JS wraz z ostrzeżeniami zakazów marki, raporty GA4 z bankiem eksperymentów GROWS oraz podgląd Google Ads API v26 z kontrolą budżetu przez człowieka.
7. **Projekt Zaliczeniowy (10 slajdów):** interaktywny generator prezentacji do wydruku / eksportu HTML → PDF.

## Uruchomienie lokalne

1. Zainstaluj zależności:
   ```bash
   npm install
   ```
2. Skopiuj plik `.env.example` do `.env.local` i uzupełnij zmienne środowiskowe:
   ```bash
   cp .env.example .env.local
   ```
   Wymagane i opcjonalne klucze znajdziesz w `.env.example` (`GEMINI_API_KEY`, `APP_URL`, `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, `GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_ADS_LOGIN_CUSTOMER_ID`). Konfiguracja Firebase / Google OAuth znajduje się w `firebase-applet-config.json` i warstwie `lib/google-auth.ts`.
3. Uruchom środowisko deweloperskie na porcie 3000:
   ```bash
   npm run dev
   ```
4. Sprawdź typy, linter i build produkcyjny:
   ```bash
   npx tsc --noEmit
   npm run lint
   npm run build
   ```

## Higiena repozytorium (GitHub)

- Katalog `public/assets/aistudio/` (ciężkie załączniki robocze PDF/MD/zrzuty z sesji) jest wykluczony w `.gitignore`.
- Lekki obraz rewersu pocztówki wykorzystywany w aplikacji znajduje się w `public/images/rewers-podrozowka.png`.
- Pliki `.env` i `.env.local` są ignorowane przez Git; w repozytorium pozostaje wyłącznie szablon `.env.example`.
