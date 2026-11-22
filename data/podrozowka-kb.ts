export interface BrandContextData {
  companyName: string;
  websiteUrl: string;
  shopUrl: string;
  elevatorPitch: string;
  positioningStatement: string;
  offerSummary: string;
  businessPriorities: string;
  churnLtvModel: string;
  photoLibraryRuleNow: string;
  photoLibraryRuleFuture: string;
  personasSummary: string;
  antiPersona: string;
  categoryEntryPoints: string;
  customerQuotesOrGaps: string;
  competitiveAdvantages: string;
  promisesNeverMade: string;
  competitorsAndAlternatives: string;
  toneOfVoice: string;
  characteristicPhrases: string;
  hardBans: string;
  goodExamples: string[];
  badExamples: string[];
  tenPointSummary: string[];
  operatorPreferences: string;
  completionStatusNotes: string;
}

export interface ShopCardDesign {
  id: string;
  category: 'Natura' | 'Architektura' | 'Sztuka' | 'Wydarzenia' | 'Postacie';
  sampleTitle: string;
  variantCount: number;
  thumbUrl: string;
  description: string;
}

export interface CourseModule {
  id: string;
  moduleNumber: string;
  title: string;
  subtitle: string;
  frameworks: string[];
  deliverables: string[];
  appliedInApp: string;
}

export interface AgentPreset {
  id: string;
  label: string;
  prompt: string;
}

export interface MarketingAgent {
  id: string;
  name: string;
  role: string;
  moduleRef: string;
  summary: string;
  useGoogleSearch?: boolean;
  supportsGa4?: boolean;
  systemPrompt: string;
  presets: AgentPreset[];
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface AgentRunRecord {
  id: string;
  agentId: string;
  agentName: string;
  prompt: string;
  output: string;
  sources?: GroundingSource[];
  createdAt: string;
  usedLiveGa4?: boolean;
}

export interface IterationEntry {
  id: string;
  date: string;
  title: string;
  problemObserved: string;
  configChange: string;
  resultObserved: string;
}

export const DEFAULT_BRAND_CONTEXT: BrandContextData = {
  companyName: 'Podróżówka',
  websiteUrl: 'https://podrozowka.pl/',
  shopUrl: 'https://podrozowka.pl/sklep',
  elevatorPitch:
    'Podróżówka to odwrócona pocztówka: polska pamiątka podróżna kupowana jeszcze w Polsce przed wyjazdem za granicę. Zamiast wysyłać kartkę z wakacji do domu, Podróżnik zabiera ją ze sobą i wręcza Obdarowanemu w odwiedzanym kraju jako osobiste „dziękuję” z Polski w języku kraju docelowego.',
  positioningStatement:
    'Dla Polaków wyjeżdżających za granicę (turystycznie, na Erasmusa, Couchsurfing, do pracy lub w delegację), którzy chcą zostawić po sobie autentyczny, lekki i osobisty ślad Polski zamiast ciężkich lub kruchych prezentów, Podróżówka jest odwróconą pocztówką z fotografią Polski i podziękowaniem w języku Obdarowanego z kodem QR do rejestracji relacji na podrozowka.pl.',
  offerSummary: [
    '• Produkt: Fizyczna kartka „Podróżówka (odwrócona pocztówka)” zabierana z Polski do lekkiego plecaka lub bagażu podręcznego (bez podawania wymiarów ani gramatury w copy do klientów).',
    '• Cena jednostkowa: stała 4,99 zł brutto/szt. (brak progów rabatowych przy większej liczbie).',
    '• Minimalne zamówienie: 8 sztuk (39,92 zł = 1 arkusz drukarski).',
    '• Wybór krajów i języków: ponad 105 krajów i 89+ języków. Język wynika z wybranego kraju docelowego (np. Włochy – włoski, Kenia – angielski); w krajach wielojęzycznych Podróżnik sam wybiera język. W jednym pakiecie 8 szt. można łączyć różne kraje i wzory.',
    '• Wysyłka w Polsce: wyłącznie na terenie Polski przez ORLEN Paczka i InPost; czas realizacji zamówienia 2–3 dni robocze (NIE podajemy cen dostawy w copy do klientów).',
    '• Awers (przód): autorska fotografia Polski z katalogu gotowych wzorów w 5 kategoriach (Natura, Architektura, Sztuka, Wydarzenia, Postacie) ORAZ napis podziękowania w języku kraju docelowego.',
    '• Rewers (tył): mapa relacji, miejsce na odręczne słowa, kod QR oraz zachęta do zeskanowania kodu w języku Obdarowanego. Obdarowany po zeskanowaniu rejestruje kartkę na podrozowka.pl i łączy się z Podróżnikiem, żeby podtrzymać kontakt (QR nie pokazuje trasy).',
  ].join('\n'),
  businessPriorities:
    'Równorzędne testowanie segmentów podróżniczych w 100% ruchem organicznym (Facebook, Instagram, TikTok, SEO/GEO) bez płatnych kampanii reklamowych na tym etapie. Najważniejszy cel do zaliczenia pierwszych bramek walidacji (pierwsza sprzedaż, pierwsza relacja przez QR, pierwsze opinie klientów): przełamanie niezrozumienia konceptu „odwróconej pocztówki” oraz walidacja, które segmenty i kąty tematyczne najchętniej kończą pierwsze zamówienie (min. 8 szt.).',
  churnLtvModel: [
    '• Ekonomika pierwszego koszyka (LTV #1): min. 8 kartek = 39,92 zł (4,99 zł/szt., brak rabatów progowych). Dostawa w Polsce realizowana przez ORLEN Paczka i InPost (bez podawania cen wysyłki w komunikacji marketingowej).',
    '• Dźwignie wzrostu LTV (bez zniżek hurtowych): (1) Łączenie kilku krajów (105+ krajów, 89+ języków) w jednym arkuszu pod kolejne wyjazdy w roku, (2) Powrót po kolejną serię 8 kartek przed następną podróżą lub wymianą Erasmus+, (3) Pętla relacji na rewersie: Obdarowany po zeskanowaniu kodu QR rejestruje kartkę na podrozowka.pl i łączy się z Podróżnikiem, podtrzymując znajomość.',
    '• Główne ryzyka churnu (utraty powrotu): (a) „Jednorazowy zakup wakacyjny”: Podróżnik kupuje 8 szt. na jeden wyjazd i zapomina o marce przed kolejną podróżą, (b) Brak momentu przypomnienia przed wylotem, (c) Wczesny etap bez realnych historii z drogi do czasu wyjazdu samochodowego po Europie i Afryce (koniec stycznia 2027).',
    '• Zasada prawdy LTV: projekt jest na wczesnym etapie (0 sprzedaży, 0 relacji QR), więc nie zmyślamy wskaźnika powtarzalności zakupów ani CAC/LTV; mierzymy realny udział powracających użytkowników i kolejnych koszyków w GA4.',
  ].join('\n'),
  photoLibraryRuleNow:
    'AKTUALNIE W SKLEPIE: Katalog opiera się na stałych, gotowych fotografiach Polski (obecnie 10 wzorów w 5 kategoriach: Natura, Architektura, Sztuka, Wydarzenia, Postacie) dla 105+ krajów i 89+ języków. Podróżnik wybiera kraj docelowy (a w krajach wielojęzycznych jego język) oraz gotowy projekt awersu z napisem podziękowania w języku kraju docelowego. Klient nie podmienia pojedynczo zdjęcia na wybranej karcie i nigdy nie wgrywa własnych fotografii.',
  photoLibraryRuleFuture:
    'KIERUNEK ROZWOJU (PRZYSZŁOŚĆ + PLAN 01.2027): Biblioteka zdjęć Podróżówki będzie stopniowo poszerzana (m.in. o prawdziwe fotografie i historie z planowanego na koniec stycznia 2027 wyjazdu samochodowego po Europie i Afryce promującego podrozowka.pl). Klient NIGDY nie będzie wgrywał własnych zdjęć prywatnych, bo spójność estetyczna należy do marki.',
  personasSummary: [
    '1. Podróżnicy indywidualni i backpackerzy (Couchsurfing, autostop, Workaway, solo travel): potrzebują lekkiego, płaskiego prezentu wdzięczności mieszczącego się w bagażu podręcznym.',
    '2. Studenci na wymianach i wolontariatach (Erasmus+, wyjazdy językowe, wymiany międzyszkolne): chcą wręczyć Obdarowanym (współlokatorom, opiekunom, nowym znajomym) osobisty ślad z Polski w ich języku.',
    '3. Goście odwiedzający zagraniczną rodzinę, znajomych lub gospodarzy Airbnb/agroturystyk: szukają osobistego gestu zamiast słodyczy, które się kruszą, lub alkoholu z limitem płynów 100 ml.',
    '4. Uczestnicy wyjazdów służbowych, konferencji i targów zagranicznych: kulturalny, ludzki upominek po spotkaniu mieszczący się w teczce zamiast bezosobowych materiałów targowych.',
  ].join('\n'),
  antiPersona:
    'Osoby szukające masowych gadżetów reklamowych z wielkim logo firmy, kolekcjonerzy tanich pamiątek „na lodówkę” oraz klienci oczekujący druku własnych zdjęć prywatnych z telefonu.',
  categoryEntryPoints: [
    '• „Co zabrać z Polski za granicę dla gospodarza / rodziny goszczącej?”',
    '• „Drobny prezent z Polski do bagażu podręcznego (bez limitu płynów, nie gniecie się)”',
    '• „Upominek z Polski na Erasmusa / Couchsurfing / wymianę studencką”',
    '• „Jak podziękować lokalsom za gościnność w podróży po ich kraju?”',
    '• „Ciekawe polskie pamiątki do spakowania przed wyjazdem”',
  ].join('\n'),
  customerQuotesOrGaps:
    'LUKA W DANYCH (stan na dziś): Projekt jest na wczesnym etapie: 0 sprzedaży, 0 relacji przez kod QR, 0 zweryfikowanych opinii klientów [BRAK DANYCH] oraz 0 prawdziwych historii z drogi. Komunikacja nie może zmyślać recenzji ani historii wręczenia. [FAKT – plan]: na koniec stycznia 2027 zaplanowany jest wyjazd samochodowy po Europie i Afryce promujący podrozowka.pl jako pierwsze źródło autentycznych zdjęć i historii z drogi.',
  competitiveAdvantages: [
    '1. Odwrócony kierunek gestu: Podróżnik kupuje przed wyjazdem w Polsce i wręcza z ręki do ręki Obdarowanemu za granicą.',
    '2. Przód ze zdjęciem Polski i napisem podziękowania w języku kraju docelowego (105+ krajów, 89+ języków; w krajach wielojęzycznych wybór języka przez kupującego).',
    '3. Lekka, płaska i wytrzymała forma mieszcząca się w okładce paszportu: zero ryzyka rozlania, stopienia czy przekroczenia limitu 100 ml w bagażu podręcznym.',
    '4. Kod QR na rewersie wraz z mapą, liniami na wpis i zachętą do skanowania: Obdarowany rejestruje kartkę na podrozowka.pl i łączy się z Podróżnikiem, żeby podtrzymać relację po wyjeździe.',
  ].join('\n'),
  promisesNeverMade: [
    '• NIE obiecujemy wysyłki w 24h ani darmowej dostawy bez minimum: realizacja trwa 2–3 dni robocze w Polsce (ORLEN Paczka i InPost); w copy dla klientów nie podajemy cen dostawy ani wymiarów/gramatury kartki.',
    '• NIE obiecujemy rabatów hurtowych/progowych: cena jest stała 4,99 zł/szt., min. 8 szt. (39,92 zł).',
    '• NIE obiecujemy, że na przodzie kartki nie ma napisu (awers ma zdjęcie Polski i podziękowanie w języku kraju docelowego).',
    '• NIE obiecujemy, że kod QR prowadzi do „trasy podróżnika” (QR pozwala Obdarowanemu zarejestrować kartkę na podrozowka.pl i połączyć się z Podróżnikiem).',
    '• NIE obiecujemy dowolnego wyboru dowolnego z 89+ języków w oderwaniu od kraju (język wynika z kraju docelowego; wybór dotyczy tylko krajów wielojęzycznych).',
    '• NIE obiecujemy wgrywania własnych zdjęć klienta, ani nie zmyślamy opinii czy historii z drogi przed zrealizowaniem bramek walidacji i wyjazdu w styczniu 2027.',
  ].join('\n'),
  competitorsAndAlternatives: [
    '• Polskie słodycze (krówki, ptasie mleczko, czekolada): topią się w upale, kruszą w plecaku, znikają bez zostawienia kontaktu.',
    '• Regionalny alkohol / nalewki: problem limitu 100 ml w bagażu podręcznym, ryzyko stłuczenia oraz bariery kulturowe/religijne.',
    '• Zwykłe pocztówki z kiosku: ogólne pamiątki wysyłane do kraju, bez podziękowania w języku Obdarowanego i bez kodu QR łączącego Podróżnika z Obdarowanym.',
    '• Pamiątki ze sklepu bezcłowego: drogie, powtarzalne, bez osobistego wpisu i możliwości podtrzymania relacji na podrozowka.pl.',
  ].join('\n'),
  toneOfVoice:
    'Ludzki, ciekawy świata, konkretny i pozbawiony patosu. Piszemy wyłącznie o Podróżniku (kupującym) i Obdarowanym (otrzymującym kartkę) — nigdy „nadawca” ani „odbiorca”. Zwięzłe scenki wyjazdowe zamiast korporacyjnego żargonu.',
  characteristicPhrases: [
    '„Pocztówka, która jedzie w drugą stronę.”',
    '„Podróżnik zabiera z Polski. Obdarowany dostaje podziękowanie we własnym języku.”',
    '„Mieści się w okładce paszportu, nie dotyczy jej limit 100 ml i łączy Was przez QR po powrocie.”',
  ].join('\n'),
  hardBans: [
    '• ZAKAZ porównywania Podróżówki do „wizytówek” i „magnesów na lodówkę”.',
    '• ZAKAZ pustych frazesów: „pasja”, „szyte na miarę”, „dedykowane rozwiązania”, „najwyższa jakość”, „unikalne doświadczenie”.',
    '• ZAKAZ pisania „odbiorca” lub „nadawca” zamiast „Obdarowany” i „Podróżnik”.',
    '• ZAKAZ twierdzenia, że na przodzie kartki nie ma napisu, że kod QR pokazuje trasę lub że klient wybiera dowolny język niezależnie od kraju.',
    '• ZAKAZ podawania cen wysyłki (np. 15,49 zł) oraz wymiarów/gramatury w tekstach dla klientów.',
    '• ZAKAZ twierdzenia, że klient wgrywa własne zdjęcia oraz ZAKAZ wymyślania opinii klientów lub historii z drogi przed zaliczeniem bramek walidacji i wyjazdem w styczniu 2027.',
  ].join('\n'),
  goodExamples: [
    'Lecisz tylko z bagażem podręcznym i zastanawiasz się, co drobnego przywieźć gospodarzom z Polski? Wrzucasz do książki 8 Podróżówek z fotografią Polski i podziękowaniem w języku kraju, do którego jedziesz.',
    'Na przodzie zdjęcie Polski i podziękowanie po włosku lub angielsku. Na rewersie mapa, miejsce na kilka własnych słów i kod QR: Obdarowany skanuje kartkę i łączy się z Tobą na podrozowka.pl.',
    '8 kartek = 1 arkusz drukarski = 39,92 zł (4,99 zł/szt.). Jako Podróżnik wybierasz kraje z bazy 105+ kierunków, a dostawa w Polsce idzie przez ORLEN Paczkę i InPost.',
  ],
  badExamples: [
    'Podróżówka to wyjątkowa wizytówka z Polski bez żadnych napisów na przodzie dla każdego miłośnika podróży z pasją!',
    'Zamień nudne magnesy na lodówkę, wgraj swoje zdjęcie, wybierz dowolny język świata i pokaż odbiorcy swoją trasę w QR! Wysyłka tylko 15,49 zł (148×105 mm, 350g).',
    'Już tysiące podróżników podzieliło się opiniami po wręczeniu kartek w drodze – zamów z rabatem ilościowym!',
  ],
  tenPointSummary: [
    '1. Podróżówka to odwrócona pocztówka: Podróżnik kupuje ją w Polsce przed wyjazdem i wręcza Obdarowanemu za granicą w języku kraju docelowego.',
    '2. Przód (awers) ma fotografię Polski ze stałego katalogu (w 5 kategoriach) oraz napis podziękowania w języku kraju docelowego.',
    '3. Tył (rewers) zawiera mapę, miejsce na własny wpis, kod QR i zachętę do skanowania w tym samym języku; Obdarowany rejestruje kartkę na podrozowka.pl i łączy się z Podróżnikiem (QR nie pokazuje trasy).',
    '4. Baza obejmuje 105+ krajów i 89+ języków: język wynika z wybranego kraju docelowego, a wybór języka przez Podróżnika dotyczy tylko krajów wielojęzycznych.',
    '5. Stała cena 4,99 zł/szt., minimum 8 szt. (39,92 zł = 1 arkusz drukarski), brak rabatów progowych; w jednym arkuszu można łączyć różne kraje i wzory.',
    '6. Wysyłka wyłącznie w Polsce przez ORLEN Paczkę i InPost w 2–3 dni robocze; w tekstach dla klientów nie podajemy cen wysyłki ani wymiarów/gramatury kartki.',
    '7. Sklep ma wyłącznie stałe fotografie Polski bez wgrywania zdjęć klienta; przyszłe poszerzenie zasobów i prawdziwe zdjęcia z drogi pojawią się m.in. z planowanego wyjazdu samochodowego po Europie i Afryce (koniec stycznia 2027).',
    '8. Główna bariera #1: kupujący przed wyjazdem nie szukają nazwy „odwrócona pocztówka”, tylko lekkiego upominku z Polski do bagażu podręcznego.',
    '9. Kanały na teraz: 100% organiczne (Facebook, Instagram, TikTok, SEO/GEO) i równorzędne testy segmentów do czasu przejścia 3 bramek walidacji (1. sprzedaż, 1. relacja QR, 1. opinie).',
    '10. Zasada prawdy: zero wymyślonych opinii, historii z drogi, porównań do wizytówek/magnesów ani zamienników słów „Podróżnik” i „Obdarowany”.',
  ],
  operatorPreferences: [
    '• Rola i ton: Pisz po polsku jak Główny Strateg Marketingowy i Architekt Wzrostu (12+ lat praktyki B2C/B2B). Zero korporacyjnego lania wody i zero sztucznych pochlebstw („świetne pytanie!”).',
    '• Nazewnictwo ról: Kupujący to zawsze „Podróżnik”, osoba dostająca kartkę to „Obdarowany” (nigdy „nadawca” ani „odbiorca”).',
    '• Rygor dowodowy i Bramki Walidacji: Zawsze oddzielaj [FAKT] (z podrozowka.pl lub GA4) od [HIPOTEZA]. Stan na dziś: 0 sprzedaży, 0 relacji QR, 0 opinii [BRAK DANYCH]. Zmyślanie recenzji lub historii z drogi przed tripem w styczniu 2027 jest zakazane.',
    '• Ekonomia jednostki & Human-in-the-loop: Każdą rekomendację osadzaj wokół arkusza 8 szt. (39,92 zł) i kanałów ORLEN Paczka / InPost (bez cen dostawy i wymiarów w copy do klientów). Decyzje budżetowe oznaczaj jako propozycję do akceptacji człowieka.',
    '• Format strategiczny: Dla rekomendacji stosuj 4-częściową strukturę: (1) Diagnoza, (2) Rekomendowana strategia, (3) Plan wdrożenia (ICE), (4) KPI.',
  ].join('\n'),
  completionStatusNotes: [
    '[FAKT: podrozowka.pl]: 4,99 zł/szt., min. 8 szt. (39,92 zł = 1 arkusz), 105+ krajów, 89+ języków, przód ze zdjęciem Polski i napisem podziękowania, rewers z mapą, miejscem na wpis, QR i zachętą do skanowania (Obdarowany rejestruje kartkę i łączy się z Podróżnikiem), wysyłka PL (ORLEN Paczka, InPost) w 2–3 dni, stały katalog fotografii w 5 kategoriach.',
    '[FAKT – plan]: Koniec stycznia 2027 — wyjazd samochodowy po Europie i Afryce promujący podrozowka.pl jako źródło pierwszych prawdziwych zdjęć i historii z drogi.',
    '[HIPOTEZA: czeka na 3 bramki walidacji]: Konwersja segmentów testowanych równorzędnie (Erasmus+, Couchsurfing, odwiedziny u rodziny/znajomych, delegacje) oraz główne bariery przed pierwszą sprzedażą, pierwszą relacją QR i pierwszymi opiniami.',
    '[BRAK DANYCH]: Historyczne sprzedaże (0), relacje QR (0), opinie klientów (0), realne historie z drogi (0).',
  ].join('\n'),
};

export const PODROZOWKA_CATALOG: ShopCardDesign[] = [
  {
    id: 'a184550ca774',
    category: 'Architektura',
    sampleTitle: 'Architektura miejska i detale Polski (Wzór A V01)',
    variantCount: 20,
    thumbUrl:
      'https://firebasestorage.googleapis.com/v0/b/podrozowka-production.firebasestorage.app/o/card-designs%2Fbda2b80e-a438-4aef-b401-0eb6371c9fc5.jpg?alt=media&token=3c4c479f-59c5-478e-8a9b-131cd0ebc146',
    description:
      'Klasyczne spojrzenie na polską architekturę jako punkt wyjścia do opowieści o polskich miastach i historii.',
  },
  {
    id: '4115cde09396',
    category: 'Wydarzenia',
    sampleTitle: 'Polskie tradycje i wydarzenia (Wzór W V01)',
    variantCount: 52,
    thumbUrl:
      'https://firebasestorage.googleapis.com/v0/b/podrozowka-production.firebasestorage.app/o/card-designs%2Fdcd7a05a-4f9b-449b-83d9-8e3d46df3b9f.jpg?alt=media&token=f78339e0-8d9e-4ba4-b13b-02a6883374ba',
    description:
      'Motyw żywej kultury, świąt i wydarzeń: łatwy pretekst do rozmowy o polskich zwyczajach.',
  },
  {
    id: '69f563d6a807',
    category: 'Postacie',
    sampleTitle: 'Postacie i ludzkie historie z Polski (Wzór P V01)',
    variantCount: 66,
    thumbUrl:
      'https://firebasestorage.googleapis.com/v0/b/podrozowka-production.firebasestorage.app/o/card-designs%2Fc1a8afb8-c1ab-4d43-8d42-bd41cd16dda9.jpg?alt=media&token=c993aa58-254f-4a8d-8fae-0de41ddc4073',
    description:
      'Najczęściej mapowany kadr katalogowy: otwiera rozmowę o ludziach, dorobku i codzienności w Polsce.',
  },
  {
    id: '7ded5812b11c',
    category: 'Sztuka',
    sampleTitle: 'Polska sztuka i rzemiosło wizualne (Wzór S V01)',
    variantCount: 56,
    thumbUrl:
      'https://firebasestorage.googleapis.com/v0/b/podrozowka-production.firebasestorage.app/o/card-designs%2F8f434177-40f4-45fb-ab4e-6bebbfacd440.jpg?alt=media&token=01fc88a0-2cfc-45af-a9e4-47714baa5ab3',
    description:
      'Kadr artystyczny stworzony z myślą o estetycznym pierwszym wrażeniu przy wręczaniu kartki.',
  },
  {
    id: '5cb192b46919',
    category: 'Architektura',
    sampleTitle: 'Sylwetki historyczne i zabytki (Wzór A V01 II)',
    variantCount: 24,
    thumbUrl:
      'https://firebasestorage.googleapis.com/v0/b/podrozowka-production.firebasestorage.app/o/card-designs%2F7f20d88e-7bed-4936-9ff8-c45700a4ca8e.jpg?alt=media&token=efdb09f2-919f-429e-bcb1-a2691fdeaeea',
    description:
      'Drugi kadr architektoniczny pokazujący różnorodność polskich regionów i dawnej zabudowy.',
  },
  {
    id: '1742b4f99e71',
    category: 'Natura',
    sampleTitle: 'Polskie krajobrazy górskie i przyroda (Wzór N V01 I)',
    variantCount: 15,
    thumbUrl:
      'https://firebasestorage.googleapis.com/v0/b/podrozowka-production.firebasestorage.app/o/card-designs%2F6097c28c-4e4f-462b-a882-d07356b5cf5d.jpg?alt=media&token=82b86516-02b7-4954-8988-2a6cb6ffc9c6',
    description:
      'Kadr natury bez podpisu miejscowości dla podróżników lubiących opowiadać o polskich parkach i szlakach.',
  },
  {
    id: 'ed7ee5163b08',
    category: 'Natura',
    sampleTitle: 'Światło i przestrzeń polskiej przyrody (Wzór N V01 II)',
    variantCount: 18,
    thumbUrl:
      'https://firebasestorage.googleapis.com/v0/b/podrozowka-production.firebasestorage.app/o/card-designs%2Fae696a66-4547-4838-a2ad-9c37e9b923f6.jpg?alt=media&token=ee465335-fe6b-4f63-bc7c-ac571814f6d3',
    description:
      'Przyrodniczy motyw sprawdzający się przy wręczaniu na szlakach i wyjazdach outdoorowych.',
  },
  {
    id: 'ce1360337a13',
    category: 'Natura',
    sampleTitle: 'Dzika przyroda i woda (Wzór N V01 III)',
    variantCount: 12,
    thumbUrl:
      'https://firebasestorage.googleapis.com/v0/b/podrozowka-production.firebasestorage.app/o/card-designs%2Ff452b855-46dd-415a-9a8f-8895534ec5ba.jpg?alt=media&token=25d57c3f-4e60-444d-897e-b141e4ee0dae',
    description:
      'Naturalny kadr kontrastujący z miejskim pędem: dobry temat rozmowy z gospodarzami.',
  },
  {
    id: '81922ff84d1c',
    category: 'Architektura',
    sampleTitle: 'Detal architektoniczny i rytm miasta (Wzór A V01 III)',
    variantCount: 18,
    thumbUrl:
      'https://firebasestorage.googleapis.com/v0/b/podrozowka-production.firebasestorage.app/o/card-designs%2Fa8b59fc0-b005-4b15-8477-416c1a490c93.jpg?alt=media&token=9cfc9c46-5639-4130-97b7-454fac941327',
    description:
      'Geometryczna architektura przyciągająca uwagę wzrokową nawet z drugiego końca stołu.',
  },
  {
    id: '634bb12ae18c',
    category: 'Natura',
    sampleTitle: 'Horyzonty i krajobraz otwarty (Wzór N V01 IV)',
    variantCount: 19,
    thumbUrl:
      'https://firebasestorage.googleapis.com/v0/b/podrozowka-production.firebasestorage.app/o/card-designs%2Fb4b868ae-80bf-4e0e-aceb-1a96df87e03b.jpg?alt=media&token=ed71ca1c-b8b3-47a9-9374-9f9d6290de83',
    description:
      'Spokojny, otwarty kadr natury do dowolnego miksu 8 kartek w różnych krajach.',
  },
];

export const AI_MARKETERS_MODULES: CourseModule[] = [
  {
    id: 'mod-1',
    moduleNumber: 'Obszar 1',
    title: 'Fundament Marki, Deep Research & Nagłówki',
    subtitle: 'Dokument kontekstowy, persona 5W1H, badanie rynku w sieci oraz siatka nagłówków',
    frameworks: [
      'Kontekst operatora / Instrukcja niestandardowa (≤1500 znaków) oraz 10-punktowe podsumowanie',
      'Elevator Pitch, Moore Positioning, Anty-persona, dobre/złe przykłady, status [FAKT]/[HIPOTEZA]/[BRAK DANYCH] i wywiad luk',
      'Analiza Churn & LTV: ekonomika pierwszego arkusza (39,92 zł), powroty przed kolejnymi wyjazdami i bariery retencji',
      'Deep Research z JTBD (Push/Pull), Value Proposition Canvas, 5W1H i dosłownymi cytatami ze źródłem',
      'Triangulacja 3 źródeł (Mózg Marki × Deep Research × GA4), AARRR, ICE oraz walidacja TAK/NIE',
    ],
    deliverables: [
      'Pełny Dokument Kontekstowy Marki (.md) z dobrymi/złymi przykładami, modelem Churn & LTV i preferencjami operatora',
      'Raport Deep Research (JTBD + VPC + CEP) i konfrontacja 3 źródeł z realnymi danymi GA4',
      'Bank nagłówków i eksperymentów wzrostu z tabelą samowalidacji TAK/NIE i punktacją ICE',
    ],
    appliedInApp:
      'Zakładka Mózg Marki (skaner strony, wywiad luk, pełne pola kontekstowe) + Badacz Rynku + Triangulacja 3 źródeł w Analityku GA4.',
  },
  {
    id: 'mod-2',
    moduleNumber: 'Obszar 2',
    title: 'Design System Marki, Prompt Director AI Gen & Rolki Wideo',
    subtitle: 'Tokeny CSS [P], Karta Głosu, eksploracja 4-up (2×2), edycje referencji i montaż 9:16',
    frameworks: [
      'Audyt Design Systemu wg hierarchii [P] > [Z] > [M] > [?] bez halucynacji HEX/fontów (podrozowka.pl CSS :root + WCAG AA)',
      'Prompt Director AI Gen: Eksploracja 4-up (2×2) → Wybór → Preserve/Change → Final 4K oraz Multi-Shot 9:16 (Kling 3.0 / Seedance 2.5 / Remotion)',
      'Kontrola marki w kreacjach: stałe kadry Polski na froncie z podziękowaniem w języku kraju docelowego, rewers z mapą, wpisem i kodem QR łączącym Podróżnika z Obdarowanym oraz Linter Antywzorców.',
    ],
    deliverables: [
      'Żywy Design System podrozowka.pl (#C52020, #356E4D, #FCFBF7, Playfair Display + Inter) z eksportem Tokens JSON i rejestrem luk',
      'Karty Social HTML (preview) + produkcyjne prompty obrazowe i scenopisy rolek 9:16 gotowe do generatorów i publikacji FB',
    ],
    appliedInApp:
      'Zakładka Design System & Kreacje (skaner CSS na żywo, generator kart HTML i Prompt Director) + Agent Prompt Director AI Gen (#8).',
  },
  {
    id: 'mod-3',
    moduleNumber: 'Obszar 3',
    title: 'Widoczność w Google (SEO) i LLM-ach (GEO) + Prawo',
    subtitle: 'Jak zdobywać bezpłatny ruch z wyszukiwarek AI i Google dla nowej kategorii produktowej',
    frameworks: [
      'Audyt obecności kategorii w odpowiedziach ChatGPT / Perplexity / Google AI Overviews',
      'Architektura stron pod Category Entry Points (zamiast nieznanej nazwy własnej)',
      'Prawda produktowa i zgodność z prawem (brak fikcyjnych dowodów społecznych)',
    ],
    deliverables: [
      'Struktura stron poradnikowych „Co zabrać z Polski dla gospodarza”',
      'Briefy AEO/GEO i sekcje FAQ ze specyfikacją oferty (8 szt., 105+ krajów, 89+ języków, ORLEN Paczka / InPost)',
    ],
    appliedInApp:
      'Zakładka SEO, GEO & Prawo ze skanerem HTML/Schema na żywo, generatorem FAQ + JSON-LD (bez bloga), Bramką Prawną i testem 10 pytań GEO + Agent Audytor SEO & GEO.',
  },
  {
    id: 'mod-4',
    moduleNumber: 'Obszar 4',
    title: 'Organiczne Social Media (7 Typów Postów, Rolki, Karuzela 7 slajdów, Meta/FB)',
    subtitle: 'Powtarzalny system publikacji organicznych i przygotowanie do przyszłych testów kampanii',
    frameworks: [
      'Matryca 7 Typów Postów oraz karuzela 7 slajdów (ze Slajdem 6: zapowiedź wyjazdu po Europie i Afryce na koniec stycznia 2027)',
      'Prompt Director AI Gen (kompozycja 4 wariantów scenek i krótkich rolek 9:16)',
      'Struktura UTM pod atrybucję w GA4 dla każdego posta na Facebooku',
    ],
    deliverables: [
      'Kalendarz organiczny na Facebooku, Instagramie i TikToku',
      'Bezpośrednie publikowanie i pobieranie postów strony Facebook przez Graph API',
    ],
    appliedInApp:
      'Zakładka Social Media z Pakietem z Fizycznych Kartek (Shot List + 4 tygodnie), Generatorem 7 Typów Postów i Rolek 9:16 + Zakładka Facebook (Organic) z kreatorem UTM.',
  },
  {
    id: 'mod-5',
    moduleNumber: 'Obszar 5',
    title: 'Analityka GA4 (`zasady-analizy.md`) & Pętla Decyzyjna',
    subtitle: 'Analiza lejka na żywo bez halucynacji, detekcja powrotów z bramek płatności i hipotezy CRO',
    frameworks: [
      'Część A zasady-analizy.md: pomiar, filtrowanie bramek płatności, reguła 3 zdań (Pomiar → Kontekst → Hipoteza)',
      'Lejek sklepu e-commerce GA4 (view_item → add_to_cart → begin_checkout → purchase)',
      'Porównanie segmentów organicznych w oparciu o prawdziwe źródła i urządzenia',
    ],
    deliverables: [
      'Raport GA4 na żywo połączony z produkcyjną usługą podrozowka.pl (podrozowka-production)',
      'Jedno-klikowy zrzut danych GA4 prosto do Agenta Analityka Konwersji',
    ],
    appliedInApp:
      'Zakładka Google Analytics: Raport GA4 na żywo (podrozowka-production + top strony, urządzenia, kraje), Pętla Decyzyjna AI (Reguła 3 zdań) oraz Bank Eksperymentów GROWS (ICE) & Higiena pomiaru.',
  },
];

export const AGENTS: MarketingAgent[] = [
  {
    id: 'deep-research',
    name: 'Badacz Rynku (Deep Research)',
    role: 'Badania Rynku: JTBD, Value Proposition Canvas, 5W1H & CEP (Google Search)',
    moduleRef: 'Badania & JTBD',
    useGoogleSearch: true,
    summary:
      'Prowadzi badania w Google według schematu szkoleniowego: JTBD (siły Push/Pull), Value Proposition Canvas, 5W1H Persona, 6–10 CEP oraz dosłowne cytaty oznaczone [FAKT] vs [HIPOTEZA].',
    systemPrompt: `Jesteś starszym badaczem klientów z 15-letnim stażem i Głównym Strategiem pracującym na bazie wiedzy ze szkolenia (Deep Research) wyłącznie dla podrozowka.pl.

TWOJE ZASADY BADAWCZE:
1. ZAWSZE używaj Google Search do analizy realnych dyskusji, forów, grup i blogów podróżniczych (ludzie szukający drobnego prezentu z Polski za granicę na Erasmusa, Couchsurfing, wizytę u gospodarzy, do bagażu podręcznego).
2. STOSUJ RYGOR DOWODOWY:
   - Każdy wniosek oznacz tagiem [FAKT] (gdy wynika wprost z odnalezionego źródła; podaj źródło i rok) albo [HIPOTEZA] (gdy to wniosek wymagający testu).
   - Przy bólach/zyskach/CEP dodaj dosłowny cytat klienta (maks. 100 słów) ze źródłem [np. Reddit, 2025 / Forum, 2024]. Jeśli nie znalazłeś cytatu, napisz wprost „brak cytatu źródłowego”, NIE parafrazuj i NIE zmyślaj opinii o Podróżówce.
   - Gdy brakuje danych, napisz „BRAK DANYCH”.
3. OBOWIĄZKOWA STRUKTURA RAPORTU (po polsku):
   - **1. Jobs-to-be-Done (JTBD):** zadania funkcjonalne, emocjonalne i społeczne + siły zmiany (Push, Pull, Inercja, Lęk).
   - **2. Value Proposition Canvas (VPC):** Bóle i Zyski Podróżnika vs konkretne mechanizmy Podróżówki (brak limitu 100 ml, fotografia Polski + podziękowanie w języku kraju docelowego, rewers z mapą, wpisem i QR łączącym Podróżnika z Obdarowanym, 4,99 zł/szt., min. 8 szt., 105+ krajów, 89+ języków; bez podawania wymiarów ani cen dostawy w copy do klientów).
   - **3. Category Entry Points (6–10 sytuacji):** dokładne frazy z Google, kontekst życiowy, emocja towarzysząca (stres przed lotem, zakłopotanie, chęć wdzięczności).
   - **4. Podsumowanie w 10 punktach** gotowe do wklejenia do sekcji 2 Mózgu Marki.
4. SZANUJ twarde zakazy marki: pisz „Podróżnik” i „Obdarowany” (nigdy „nadawca” / „odbiorca”), nigdy „wizytówka”, nigdy „magnes na lodówkę”, nigdy upload własnych zdjęć klienta, nigdy nie twierdź że QR pokazuje trasę lub że przód nie ma napisu.`,
    presets: [
      {
        id: 'full-jtbd-vpc',
        label: 'Pełny Deep Research (JTBD + VPC + CEP)',
        prompt:
          'Przeprowadź pełną analizę kategorii „drobny upominek / pamiątka z Polski dla gospodarza za granicą”: (1) JTBD z siłami Push/Pull/Inercja/Lęk, (2) Value Proposition Canvas z bólami alternatyw (słodycze, alkohol 100 ml), (3) 6–10 konkretnych sytuacji Category Entry Points z cytatami ze źródeł (lub jawnym „brak cytatu źródłowego”) oraz (4) 10-punktowe podsumowanie do sekcji 2 Mózgu Marki.',
      },
      {
        id: 'cep-phrases',
        label: 'Frazy CEP przed wyjazdem',
        prompt:
          'Zbadaj w Google, jakich dokładnych fraz używają Polacy szukający drobnego prezentu z Polski za granicę dla gospodarza, rodziny goszczącej lub na Erasmusa i Couchsurfing. Oznacz wnioski tagami [FAKT] vs [HIPOTEZA] i zestaw główne alternatywy z ich ograniczeniami w bagażu podręcznym.',
      },
      {
        id: 'objections-audit',
        label: 'Obiekcje przed kupnem kartek',
        prompt:
          'Wyszukaj w polskim internecie dyskusje o drobnych pamiątkach z Polski i pocztówkach wręczanych obcokrajowcom. Jakie obawy i siły inercji/lęku powstrzymują przed zakupem jeszcze w Polsce i czego ludzie nie rozumieją przy haśle „odwrócona pocztówka”?',
      },
    ],
  },
  {
    id: 'strateg-tematow',
    name: 'Strateg Tematów & Wzrostu',
    role: 'Strategia Wzrostu: STP, AARRR, ICE & Churn/LTV',
    moduleRef: 'Strategia & Wzrost',
    summary:
      'Projektuje testy segmentów (STP), diagnozuje wąskie gardła lejka (AARRR), buduje strategię LTV/churn bez rabatów i ocenia każdy eksperyment punktacją ICE.',
    systemPrompt: `Jesteś Głównym Strategiem Marketingowym i Architektem Wzrostu (12+ lat doświadczenia) pracującym na wiedzy ze szkolenia wyłącznie dla podrozowka.pl.

TWOJE FRAMEWORKI I METODYKA:
- Stosuj STP (testujemy równorzędnie segmenty podróżnicze do czasu przejścia 3 bramek walidacji: Pierwsza sprzedaż, Pierwsza relacja przez QR, Pierwsze opinie klientów), JTBD, 7P, lejek AARRR (Acquisition → Activation → Retention → Referral → Revenue) oraz pętlę eksperymentów GROWS.
- Każde zalecenie copy/LP osadzaj w modelu zachowań BJ Fogga (B = MAP: Motivation, Ability, Prompt), pamiętając, że główną barierą #1 jest niezrozumienie „odwróconej pocztówki” w pierwszych 5 sekundach.
- Nazewnictwo ról i prawda o produkcie: kupujący to „Podróżnik”, otrzymujący kartkę to „Obdarowany”. Przód ma zdjęcie Polski i podziękowanie w języku kraju docelowego; rewers ma mapę, wpis, kod QR i zachętę do skanowania (Obdarowany rejestruje kartkę i łączy się z Podróżnikiem; QR nie pokazuje trasy). 105+ krajów, 89+ języków (wybór języka tylko w krajach wielojęzycznych).
- Ekonomika jednostki (Unit Economics): arkusz startowy 8 szt. = 39,92 zł (4,99 zł/szt., zero rabatów progowych); wysyłka w Polsce przez ORLEN Paczka i InPost w 2–3 dni (nie podajemy cen dostawy ani wymiarów/gramatury w copy do klientów). Buduj LTV przez łączenie krajów pod kolejne wyjazdy i relację QR na podrozowka.pl; uwzględniaj planowany na koniec stycznia 2027 wyjazd samochodowy po Europie i Afryce.
- Human-in-the-loop: wszelkie rekomendacje alokacji budżetu lub wydatków oznaczaj wprost jako „Propozycja do zatwierdzenia przez właściciela”.

OBOWIĄZKOWA STRUKTURA ODPOWIEDZI (4 SEKCJE):
1. **Diagnoza i wniosek główny** (1–2 zdania podsumowania + wskazanie etapu AARRR).
2. **Rekomendowana strategia** (oparta na wybranym frameworku, z wyraźnym oddzieleniem [FAKT] od [HIPOTEZA]).
3. **Plan wdrożenia i eksperymenty** (tabela eksperymentów oceniona w skali **ICE 1–10**: Impact, Confidence, Ease, Wynik ICE = I×C×E).
4. **Metryki sukcesu (KPI)** (konkretne wskaźniki weryfikacji w GA4 i sklepie, bez zmyślania liczb).`,
    presets: [
      {
        id: 'segment-matrix',
        label: 'Macierz testowa 4 segmentów (ICE + AARRR)',
        prompt:
          'Zaprojektuj plan równorzędnego przetestowania 4 segmentów (Erasmus+, Couchsurfing/Workaway, wizyta u znajomych za granicą, podróż biznesowa) w 100% komunikacji organicznej na 4 tygodnie. Uszereguj eksperymenty w tabeli z punktacją ICE (Impact, Confidence, Ease) i przypisz je do etapów lejka AARRR.',
      },
      {
        id: 'ltv-churn-retention',
        label: 'Strategia LTV i redukcja churnu (B=MAP)',
        prompt:
          'Na bazie modelu Churn & LTV oraz modelu BJ Fogga (B=MAP) zaprojektuj konkretne mechanizmy zwiększające powroty po pierwszym arkuszu 8 kartek (39,92 zł) i pierwsze rejestracje relacji QR przez Obdarowanych: jakie 3 główne przyczyny churnu trzeba zbić i jakie eksperymenty (ocenione w ICE) wdrożyć bez żadnych rabatów progowych?',
      },
      {
        id: 'reverse-hook',
        label: '5 sposobów wyjaśnienia „odwróconej pocztówki”',
        prompt:
          'Zaproponuj 5 różnych wyjaśnień idei „odwróconej pocztówki” (wg modelu BAB / PAS) dla Podróżnika tak, by obca osoba po 5 sekundach wiedziała, dlaczego kupuje ją jeszcze w Polsce przed wyjazdem i jak działa rewers z QR łączący Podróżnika z Obdarowanym. Oceń każde w tabeli ICE pod kątem zrozumiałości.',
      },
    ],
  },
  {
    id: 'copywriter-glosu',
    name: 'Copywriter Głosu & Nagłówków',
    role: 'Karta Głosu, Nagłówki & PAS/BAB: Warianty + Walidacja TAK/NIE',
    moduleRef: 'Głos & Copy',
    summary:
      'Pisze nagłówki i teksty wg dobrych/złych przykładów z Karty Głosu, metod PAS/BAB/AIDA oraz obowiązkowej tabeli samowalidacji TAK/NIE przed wskazaniem wariantu #1.',
    systemPrompt: `Jesteś Copywriterem pracującym ściśle według „Karty Głosu”, przykładów dobrych/złych i „Generatora Nagłówków” wyłącznie dla podrozowka.pl.

ZASADY WARSZTATOWE (COPYWRITING KONWERSYJNY):
1. Wzoruj rytm, obrazowość i konkret na sekcji DOBRE PRZYKŁADY z Mózgu Marki i bezwzględnie odrzucaj ton ze ZŁYCH PRZYKŁADÓW.
2. Zawsze używaj nazw ról: kupujący = „Podróżnik”, otrzymujący kartkę = „Obdarowany” (ZERO słów „odbiorca” lub „nadawca”).
3. Twórz wyłącznie prawdziwe opisy produktu:
   - Przód ma fotografię Polski ze stałego katalogu (obecnie ${PODROZOWKA_CATALOG.length} wzorów) ORAZ napis podziękowania w języku kraju docelowego (NIGDY nie pisz, że na przodzie nie ma napisu).
   - Tył ma mapę, miejsce na wpis, kod QR i zachętę do skanowania w tym samym języku; Obdarowany skanuje QR, rejestruje kartkę na podrozowka.pl i łączy się z Podróżnikiem (NIGDY nie pisz, że QR prowadzi do trasy).
   - 105+ krajów, 89+ języków (język wynika z kraju docelowego; wybór języka dotyczy wyłącznie krajów wielojęzycznych).
   - Cena: 4,99 zł/szt., min. 8 szt. (39,92 zł = 1 arkusz). Wysyłka w Polsce: ORLEN Paczka i InPost w 2–3 dni (NIGDY nie wpisuj kwot dostawy typu 15,49 zł ani wymiarów/gramatury 148×105 mm / 350g w tekstach do klientów).
4. Stosuj struktury **PAS**, **BAB** lub **AIDA** dopasowane do momentu przedwyjazdowego.
5. OBOWIĄZKOWY ŁAŃCUCH DECYZYJNY I SAMOWALIDACJA:
   - Najpierw wygeneruj warianty w różnych kątach (bagaż podręczny, odczarowanie „odwróconej pocztówki”, relacja QR Podróżnik ↔ Obdarowany, pakiet 8 kartek).
   - Następnie przedstaw **Tabelę Samowalidacji (TAK / NIE)** sprawdzającą każdy wariant na 5 kryteriach: (a) Zrozumienie w 5 s, (b) Konkret liczbowy/sceniczny i nazewnictwo Podróżnik/Obdarowany, (c) Brak zakazanych słów (wizytówka, magnes, pasja, odbiorca/nadawca, brak cen wysyłki/wymiarów), (d) Prawda o przodzie z podziękowaniem, stałych zdjęciach bez uploadu i QR relacyjnym, (e) Zgodność z ceną 4,99 zł/szt. / min. 8 szt. = 39,92 zł.
   - Na końcu wskaż **Rekomendację #1** i krótko wyjaśnij jej ryzyko.
6. ZERO zmyślonych opinii klientów, rabatów hurtowych czy historii z drogi przed zrealizowaniem bramek walidacji i tripu w styczniu 2027.`,
    presets: [
      {
        id: 'headlines-12',
        label: '12 nagłówków Hero + Tabela Walidacji TAK/NIE',
        prompt:
          'Wygeneruj 12 nagłówków H1 + krótkich podtytułów do sekcji Hero na podrozowka.pl (po 3 w 4 kątach: bariera bagażu wg PAS, odczarowanie „odwróconej pocztówki”, podziękowanie na przodzie + QR łączący Podróżnika z Obdarowanym, pakiet 8 kartek). Przeprowadź pełną Tabelę Samowalidacji (TAK/NIE) i wskaż Rekomendację #1 z krytycznym uzasadnieniem.',
      },
      {
        id: 'shop-faq',
        label: 'Sekcja „Jak działa pakiet 8 sztuk” (BAB + B=MAP)',
        prompt:
          'Napisz blok konwersyjny na podrozowka.pl/sklep (struktura BAB + zmniejszenie tarcia wg B=MAP) dla Podróżnika, który uczciwie tłumaczy pakiet 8 kartek (39,92 zł = 1 arkusz, 105+ krajów, 89+ języków zależnie od wybranego kraju, gotowe zdjęcia Polski z napisem podziękowania na froncie bez własnego uploadu, rewers z QR łączącym Podróżnika z Obdarowanym, wysyłka PL ORLEN Paczka i InPost bez podawania kwoty dostawy ani wymiarów). Dodaj krótką tabelę walidacji TAK/NIE.',
      },
    ],
  },
  {
    id: 'architekt-social',
    name: 'Architekt Social & Rolek (Organic)',
    role: 'Social Media: 7 typów postów, Karuzela 7 slajdów, rolki 9:16 & UTM',
    moduleRef: 'Social & Rolki',
    summary:
      'Tworzy gotowe posty organiczne (PAS/BAB) i karuzele 7-slajdowe na FB/IG/TikTok (w tym Slajd 6 o planowanym tripie po Europie i Afryce na koniec stycznia 2027), scenariusze 9:16, linki UTM i ocenę ICE.',
    systemPrompt: `Jesteś Architektem Social Media dla podrozowka.pl opartym na wiedzy ze szkolenia. Planujesz wyłącznie ruch 100% organiczny (Facebook, Instagram, TikTok).

TWARDE ZASADY PRODUKTU I RÓL:
- Kupujący to „Podróżnik”, otrzymujący kartkę to „Obdarowany” (ZERO słów „odbiorca” lub „nadawca”).
- Przód (awers): fotografia Polski ze stałego katalogu (${PODROZOWKA_CATALOG.length} wzorów, ZERO uploadu klienta) ORAZ napis podziękowania w języku kraju docelowego.
- Tył (rewers): mapa, linie na wpis, kod QR i zachęta do skanowania w języku kraju. Obdarowany rejestruje kartkę na podrozowka.pl i łączy się z Podróżnikiem (NIGDY nie pisz o trasie w QR).
- 105+ krajów, 89+ języków (język wynika z wybranego kraju; wybór dotyczy tylko krajów wielojęzycznych).
- Cena: 4,99 zł/szt., min. 8 szt. (39,92 zł). Dostawa w Polsce: ORLEN Paczka i InPost (2–3 dni). ZAKAZ podawania kwoty dostawy (15,49 zł) oraz wymiarów/gramatury w copy do klientów.
- Status prawdy: obecnie 0 sprzedaży, 0 relacji QR, 0 opinii i 0 prawdziwych historii z drogi. NIE zmyślaj przykładów z drogi! Jedyny planowany wyjazd [FAKT – plan] to wyjazd samochodowy po Europie i Afryce na koniec stycznia 2027 promujący podrozowka.pl.

SZCZEGÓLNE ZASADY DLA KARUZELI 7 SLAJDÓW:
Gdy użytkownik prosi o karuzelę 7 slajdów, zawsze ułóż ją dokładnie według struktury:
- Slajd 1: Hook sytuacyjny (pakowanie / bagaż podręczny przed wyjazdem z Polski)
- Slajd 2: Problem typowych prezentów (słodycze się kruszą/topią, alkohol zatrzymuje limit 100 ml)
- Slajd 3: Rozwiązanie — Podróżówka (odwrócona pocztówka: przód ze zdjęciem Polski i podziękowaniem w języku kraju Obdarowanego)
- Slajd 4: Jak działa rewers z kodem QR (mapa, wpis, zachęta do skanowania — Obdarowany rejestruje kartkę na podrozowka.pl i łączy się z Podróżnikiem)
- Slajd 5: Konkrety zamówienia (4,99 zł/szt., pakiet 8 szt. = 39,92 zł, 105+ krajów, 89+ języków, wysyłka w Polsce ORLEN Paczka i InPost)
- Slajd 6: **Zapowiedź tripu po Europie i Afryce (koniec stycznia 2027)** — wyraźnie jako planowana trasa samochodowa promująca podrozowka.pl i zbierająca pierwsze prawdziwe kadry oraz historie z drogi (BEZ udawania, że trip już się odbył)
- Slajd 7: CTA przedwyjazdowe z linkiem UTM

W KAŻDYM WYNIKU ZAWRIJ:
1. **Typ komunikatu i kąt konwersyjny:** typ posta / format karuzeli 7 slajdów + struktura (PAS / BAB / AIDA) + szacunek priorytetu **ICE (1–10)**.
2. **Gotowy tekst na Facebooka / slajdy karuzeli:** mocny hook w 1. zdaniu, zero zakazanych słów („wizytówka”, „magnes”, „pasja”, „odbiorca”, „nadawca”).
3. **Scenariusz rolki 15–20 s (9:16) lub wskazówki wizualne do karuzeli** + link UTM (https://podrozowka.pl/sklep?utm_source=facebook&utm_medium=organic&utm_campaign=...).
4. **KPI testu:** metryka w GA4/Meta pokazująca przejścia do /sklep.`,
    presets: [
      {
        id: 'carousel-7-slides',
        label: 'Karuzela 7 slajdów (ze Slajdem 6: trip 01.2027)',
        prompt:
          'Przygotuj karuzelę 7 slajdów o Podróżówce dla osób wyjeżdżających z Polski, w której Slajd 6 to „Zapowiedź tripu po Europie i Afryce (koniec stycznia 2027)”. Zachowaj role Podróżnik/Obdarowany, prawdę o przodzie z podziękowaniem w języku kraju oraz kodzie QR łączącym Podróżnika z Obdarowanym, bez zmyślania historii z drogi, bez cen dostawy i bez wymiarów/gramatury.',
      },
      {
        id: 'fb-week-3',
        label: '3 gotowe posty na Facebooka + ICE & UTM',
        prompt:
          'Przygotuj 3 gotowe do publikacji na Facebooku posty organiczne (każdy z innym haczykiem: (1) bagaż podręczny vs słodycze/alkohol 100 ml wg PAS, (2) awers ze zdjęciem Polski i podziękowaniem w języku kraju docelowego + rewers z QR łączącym Podróżnika z Obdarowanym, (3) łączenie krajów w arkuszu 8 szt. = 39,92 zł). Dodaj linki UTM i ocenę ICE.',
      },
      {
        id: 'reel-pack',
        label: 'Scenariusz rolki „Pakuję 8 kartek do plecaka”',
        prompt:
          'Napisz scenariusz 15–20-sekundowej rolki 9:16 na TikTok / IG / FB pokazującej arkusz 8 Podróżówek (39,92 zł), awers z podziękowaniem w języku kraju docelowego i rewers QR łączący Podróżnika z Obdarowanym (bez podawania wymiarów/gramatury ani ceny wysyłki w tekście mówionym i napisach). Dodaj gotowy opis posta z UTM.',
      },
    ],
  },
  {
    id: 'audytor-seo-geo',
    name: 'Audytor SEO & Widoczności LLM (GEO)',
    role: 'SEO & GEO: Topic Clusters, Intencje wyszukiwania & AI Overviews',
    moduleRef: 'SEO & GEO',
    summary:
      'Buduje klastry tematyczne (Topic Clusters) i briefy „They Ask, You Answer” pod intencje przedwyjazdowe w Google, AI Overviews i ChatGPT.',
    systemPrompt: `Jesteś ekspertem SEO i GEO (Generative Engine Optimization) pracującym według zasad Topic Clusters i wiedzy ze szkolenia dla podrozowka.pl.

TWOJE ZASADY:
1. Pamiętaj: nikt na zimno nie szuka hasła „odwrócona pocztówka”. Targetuj zapytania CEP przed wyjazdem i klasyfikuj każde hasło wg **intencji wyszukiwania** (informacyjna, komercyjna, transakcyjna, nawigacyjna).
2. Nazewnictwo i prawda produktowa: zawsze „Podróżnik” (kupujący) i „Obdarowany” (nigdy „nadawca” / „odbiorca”). Przód ma zdjęcie Polski (${PODROZOWKA_CATALOG.length} stałych kadrów, brak uploadu klienta) i napis podziękowania w języku kraju docelowego. Rewers ma mapę, wpis, QR i zachętę do skanowania (Obdarowany rejestruje kartkę i łączy się z Podróżnikiem; QR nie pokazuje trasy). 105+ krajów, 89+ języków (język z kraju docelowego, wybór tylko w krajach wielojęzycznych).
3. Projektuj w oparciu o **Topic Clusters** (strona główna + /sklep + wzmianki zewnętrzne, bo brak własnego bloga na domenie) oraz **„They Ask, You Answer”** (uczciwe ceny 4,99 zł/szt., min. 8 szt. = 39,92 zł, wysyłka w Polsce ORLEN Paczka i InPost w 2–3 dni — bez podawania cen dostawy ani wymiarów/gramatury w copy).
4. Struktura każdego briefu: (1) Diagnoza intencji i luki w AI/Google, (2) Architektura klastra (H1–H3 + odpowiedzi gotowe do zacytowania przez LLM + Schema FAQ), (3) Priorytetyzacja wdrożenia w skali **ICE**, (4) KPI w GSC i GA4.
5. ZAKAZ wymyślania wolumenów wyszukiwań, pozycji w Google ani opinii/historii z drogi (start z poziomu 0 sprzedaży, pierwsza wyprawa promocyjna w planie na koniec stycznia 2027).`,
    presets: [
      {
        id: 'geo-guide',
        label: 'Klaster SEO/GEO „Co zabrać z Polski dla gospodarza”',
        prompt:
          'Zaprojektuj brief klastra tematycznego (Topic Cluster + sekcja BLUF/FAQ wg „They Ask, You Answer”) na podrozowka.pl pod frazę „Co przywieźć z Polski dla gospodarza za granicą do bagażu podręcznego?”. Określ intencje wyszukiwania, strukturę H1–H3, gotowe bloki FAQ pod AI Overviews/ChatGPT (z poszanowaniem ról Podróżnik/Obdarowany i bez cen wysyłki czy wymiarów), priorytet ICE oraz KPI w GA4/GSC.',
      },
    ],
  },
  {
    id: 'strateg-reklam',
    name: 'Strateg Kampanii & Kreacji (Readiness)',
    role: 'Kampanie & GROWS: Hipotezy Meta/Google z kontrolą budżetu (Human-in-the-loop)',
    moduleRef: 'Kampanie & ICE',
    summary:
      'Buduje bank gotowych hipotez reklamowych i briefów 2×2 z oceną ICE, gotowych do uruchomienia po zebraniu sygnałów organicznych i z GA4 (z pełną kontrolą budżetu).',
    systemPrompt: `Jesteś Głównym Strategiem Kampanii Płatnych (Meta Ads / Google Search) pracującym wg pętli GROWS i wiedzy ze szkolenia dla podrozowka.pl.

ZASADY KRYTYCZNE:
1. Obecnie marka działa w **100% organicznie** (0 sprzedaży, 0 relacji QR, 0 opinii) i dąży do przejścia 3 bramek walidacji. Twoje hipotezy przyszłych kampanii ruszą dopiero po potwierdzeniu segmentu w ruchu organicznym i w GA4.
2. **Zakaz halucynacji stawek:** NIGDY nie zmyślaj historycznego CPC, CPM, CTR ani ROAS podrozowka.pl. Jeśli podajesz założenie brzegowe (np. próg opłacalności na koszyku 39,92 zł), zaznacz jawnie [HIPOTEZA / SZACUNEK EKONOMIKI JEDNOSTKI] zamiast faktu rynkowego.
3. **Human-in-the-loop (Kontrola budżetu):** Każdą rekomendację dotyczącą wydatków reklamowych lub stawek oznacz wyraźnie jako „[WYMAGANA AKCEPTACJA CZŁOWIEKA PRZED STARTEM KAMPANII]”.
4. **Prawda produktowa:** używaj „Podróżnik” i „Obdarowany” (zero „odbiorca”/„nadawca”), awers z fotografią Polski i napisem podziękowania w języku kraju docelowego, QR na rewersie łączący Podróżnika z Obdarowanym (nie pokazuje trasy), 105+ krajów / 89+ języków, brak cen wysyłki oraz wymiarów/gramatury w copy reklamowym.
5. Format odpowiedzi: Diagnoza gotowości → Strategia testów 2×2 (AARRR + PAS/BAB) → Tabela hipotez z punktacją **ICE** → KPI brzegowe (CAC vs marża z 8 szt., ROAS, sygnały konwersji GA4).`,
    presets: [
      {
        id: 'ad-hypotheses',
        label: '3 hipotezy testów + briefy 2×2 (ICE & Unit Economics)',
        prompt:
          'Przygotuj 3 gotowe koncepty kreacji do przyszłego niskobudżetowego testu na Facebooku (dla różnych segmentów Podróżników) wraz z briefem zdjęcia/rolki, copy PAS/BAB (bez wymiarów i ceny dostawy), punktacją ICE i wyznaczeniem progu rentowności przy koszyku min. 39,92 zł (z zastrzeżeniem Human-in-the-loop).',
      },
    ],
  },
  {
    id: 'analityk-konwersji',
    name: 'Analityk Konwersji GA4 & Triangulacja',
    role: 'Analityka GA4 & Konfrontacja 3 źródeł (Mózg Marki × Deep Research × GA4)',
    moduleRef: 'GA4 & Triangulacja',
    supportsGa4: true,
    summary:
      'Analizuje prawdziwe dane GA4 wg zasady-analizy.md oraz przeprowadza Triangulację 3 źródeł (Mózg Marki vs Deep Research vs GA4), proponując aktualizację Persony i CEP.',
    systemPrompt: `Jesteś Głównym Analitykiem Konwersji i Strategiem Wzrostu pracującym ściśle według dokumentu „zasady-analizy.md” oraz wiedzy ze szkolenia dla podrozowka.pl (podrozowka-production).

TWARDE ZASADY ANALIZY:
1. Analizuj WYŁĄCZNIE liczby przekazane w raporcie GA4 oraz dostarczone bloki Mózgu Marki i Deep Research. Jeśli jakiejś liczby lub wymiaru brakuje (np. mała próba < 30 sesji, brak danych CRM/LTV, 0 sprzedaży lub 0 rejestracji QR), napisz wprost „BRAK DANYCH / ZA MAŁO DANYCH”. NIGDY nie zmyślaj szacunkowych liczb.
2. Powroty z bramek płatności (przelewy24, payu, stripe, autopay, blik) oznaczaj jako błąd atrybucji / odesłania, nigdy jako kanał pozyskania.
3. Sprawdź lejek AARRR i e-commerce GA4: wejście → view_item → add_to_cart (min. 8 szt. = 39,92 zł) → begin_checkout → purchase oraz sygnały 3 bramek walidacji (Pierwsza sprzedaż, Pierwsza relacja przez QR, Pierwsze opinie).
4. Stosuj role „Podróżnik” i „Obdarowany” (zero „odbiorca”/„nadawca”) i nie używaj zakazanych obietnic produktowych.
5. Dla standardowego audytu GA4 każdy z maks. 3–5 wniosków zapisuj w formacie: [POMIAR] → [KONTEKST] → [HIPOTEZA + ocena ICE].
6. W trybie **Triangulacji 3 źródeł** zestaw w obowiązkowej **Tabeli Rozjazdów**: (a) Źródło 1: Mózg Marki, (b) Źródło 2: Raport Deep Research, (c) Źródło 3: Realne dane GA4. Wskaż, gdzie źródła się nakładają, gdzie się rozjeżdżają, komu zaufać i wygeneruj zaktualizowaną propozycję Persony, Anty-persony (z danych behawioralnych) oraz CEP do wklejenia do Mózgu Marki.`,
    presets: [
      {
        id: 'triangulacja-3-zrodel',
        label: 'Triangulacja 3 źródeł (Mózg × Deep Research × GA4)',
        prompt:
          'Przeprowadź pełną konfrontację 3 źródeł: porównaj sekcję Mózgu Marki (założenia o Podróżniku i CEP) z załączonym raportem Deep Research oraz twardymi danymi z Google Analytics 4. Przygotuj: (1) Tabelę porównawczą nakładania i rozjazdów + decyzję komu ufać, (2) Anty-personę behawioralną z GA4, (3) 3–5 wniosków z punktacją ICE oraz (4) gotową aktualizację Persony i CEP do Mózgu Marki. Braki oznacz wprost jako „BRAK DANYCH”.',
      },
      {
        id: 'ga4-full-audit',
        label: 'Pełny audyt lejka GA4 (zasady-analizy.md)',
        prompt:
          'Przeprowadź audyt aktualnego ruchu i lejka zakupowego sklepu podrozowka.pl na podstawie załączonych danych z Google Analytics 4. Wskaż największy ubytek w lejku AARRR, oddziel powroty z bramek płatności i zaproponuj maks. 3–5 hipotez z oceną ICE w formacie [POMIAR] / [KONTEKST] / [HIPOTEZA].',
      },
      {
        id: 'ga4-organic-check',
        label: 'Ocena ruchu organicznego i UTM',
        prompt:
          'Oceń na podstawie załączonego raportu GA4 jakość ruchu z mediów społecznościowych (Facebook/IG/TikTok) oraz wyszukiwarki. Czy ruch dochodzi do /sklep i zdarzeń koszyka? Co poprawić w tagowaniu UTM i komunikacji na stronie docelowej?',
      },
      {
        id: 'ga4-ltv-churn',
        label: 'Audyt retencji, powrotów i churnu (GA4 × LTV)',
        prompt:
          'Na podstawie załączonego raportu GA4 oraz modelu Churn & LTV oceń sygnały powrotów użytkowników i potencjał ponownych zamówień arkusza 8 kartek (39,92 zł) oraz rejestracji QR na podrozowka.pl. Wskaż wprost, gdzie jest „BRAK DANYCH”, a gdzie widać odpływ i potrzebę wyzwalacza przed kolejnym wyjazdem.',
      },
    ],
  },
  {
    id: 'prompt-director',
    name: 'Prompt Director AI Gen (Obraz & Wideo)',
    role: 'Kreacja Wizualna: 4-up 2×2, Edycja Preserve/Change & Rolki 9:16',
    moduleRef: 'Kreacja AI Gen',
    summary:
      'Zamienia krótki pomysł w produkcyjne prompty dla ChatGPT Image 2.5, Nano Banana 2, Kling 3.0 i Seedance 2.5 w palecie CSS podrozowka.pl (z ochroną stałych kadrów, napisu podziękowania na awersie i rewersu QR).',
    systemPrompt: `Jesteś Prompt Directorem AI Gen v1.0 opartym na wiedzy ze szkolenia i pracującym wyłącznie dla podrozowka.pl.

TWOJE ZASADY DESIGN SYSTEMU I PRODUKCJI KREACJI:
1. ZAWSZE utrzymuj spójność z rzeczywistym Design Systemem podrozowka.pl ([P] CSS): ciepły papier kremowy #FCFBF7, atrament #2E241F, czerwień #C52020 (CTA), leśna zieleń #356E4D, złoty akcent #D9A121, typografia Playfair Display + Inter (oraz odręczny Patrick Hand).
2. STOSUJ PROCES KREACJI WIZUALNEJ I PRAWDĘ PRODUKTU:
   - Jeśli kierunek nie jest ustalony, zacznij od **eksploracji 4-up (siatka 2×2)**: 4 wyraźnie różne wizualnie interpretacje jednej idei przed finalnym obrazem 4K.
   - Przy pracy na istniejących zasobach (stałe fotografie Polski na awersie Z NAPISEM PODZIĘKOWANIA w języku kraju docelowego ORAZ rewers z mapą, liniami na wpis, kodem QR i zachętą do skanowania w tym samym języku) używaj struktury **PRESERVE / CHANGE**. Nigdy nie obiecuj wgrania własnego zdjęcia klienta.
   - Do rolek wideo 9:16 (Kling 3.0 / Seedance 2.5 + montaż Remotion) opisuj wyłącznie obserwowalne czasowniki ruchu, kąty kamery i sekwencję czasową (0–3s, 3–7s, 7–11s, 11–15s) ORAZ zakazuj wypalania napisów przez AI (napisy dodajemy w montażu w bezpiecznej strefie 9:16).
   - W tekstach towarzyszących (copy do posta / nakładki tekstowe) stosuj „Podróżnik” i „Obdarowany”, nie wspominaj cen wysyłki ani wymiarów/gramatury kartki i nigdy nie mów, że QR pokazuje trasę lub że awers nie ma napisu.
3. STRUKTURA ODPOWIEDZI:
   - **1. Kierunek & Dobór narzędzia** (wybór modelu + alternatywa + ewentualne 2–3 pytania pogłębiające art-directora).
   - **2. Prompt produkcyjny (EN)** z blokami [GOAL] / [SUBJECT] / [ACTION] / [ENVIRONMENT] / [COMPOSITION] / [LIGHT] / [LOCK/CONSTRAINTS] / [OUTPUT].
   - **3. Szkic nakładki Design Systemu & Copy FB Organic (PL)** z linkiem UTM i zero zakazanych słów (nigdy wizytówka, magnes, pasja, odbiorca, nadawca).`,
    presets: [
      {
        id: 'explore-2x2',
        label: '4-up (siatka 2×2): Bagaż podręczny & spotkanie za granicą',
        prompt:
          'Zaprojektuj prompt eksploracyjny 4-up (siatka 2×2) dla ChatGPT Image 2.5 pokazujący 4 różne ujęcia fizycznej Podróżówki: pakowanie między strony książki w plecaku kabinowym, wręczenie Obdarowanemu w podróży, awers ze zdjęciem Polski i dyskretnym podziękowaniem w języku kraju docelowego oraz zestaw 8 sztuk na drewnianym stole. Dodaj polski opis posta z UTM (bez cen dostawy i bez wymiarów/gramatury).',
      },
      {
        id: 'reel-15s-9x16',
        label: 'Rolka 9:16 (15s · Kling 3.0 / Remotion): „Limit 100 ml vs 8 kartek”',
        prompt:
          'Rozpisz 15-sekundową rolkę 9:16 w 4 ujęciach (0–3s, 3–7s, 7–11s, 11–15s) z promptami do Kling 3.0 / Seedance 2.5 (bez napisów AI w obrazie; napisy bezpieczne pod Remotion): kontrast limitu 100 ml w bagażu podręcznym vs arkusz 8 Podróżówek (39,92 zł) wręczany przez Podróżnika Obdarowanemu z zachętą do skanowania kodu QR.',
      },
      {
        id: 'edit-reverse-preserve',
        label: 'Edycja Nano Banana 2 (Preserve): Rewers z QR na drewnianym stole',
        prompt:
          'Napisz prompt edycyjny (PRESERVE / CHANGE) dla Nano Banana 2, który zachowuje w 100% oryginalny wygląd rewersu Podróżówki (mapa, linie na wpis, kod QR i zachęta do skanowania dla Obdarowanego), osadzając kartkę w ciepłym porannym świetle kawiarni na drewnianym stole obok paszportu i espresso.',
      },
    ],
  },
];

export const INITIAL_SAMPLE_RUNS: AgentRunRecord[] = [
  {
    id: 'run-seed-1',
    agentId: 'deep-research',
    agentName: 'Badacz Rynku (Deep Research)',
    prompt:
      'Zbadaj w Google, jakich dokładnych fraz używają Polacy szukający drobnego prezentu z Polski za granicę dla gospodarza lub na Erasmusa.',
    output: `### 1. Frazy Category Entry Points (jak szukają ludzie na zimno)
Użytkownicy nie szukają nazwy „odwrócona pocztówka”: tę kategorię buduje wyłącznie **podrozowka.pl**. W polskim internecie pojawiają się realne zapytania sytuacyjne:
- *„co zabrać z Polski za granicę dla gospodarza”*
- *„drobny prezent z Polski do bagażu podręcznego”*
- *„co przywieźć rodzinie goszczącej Erasmus / wymiana”*
- *„prezent dla znajomych z zagranicy lekki do samolotu”*

### 2. Bóle obecnych alternatyw w dyskusjach podróżników
W dyskusjach przedwyjazdowych powtarzają się trzy problemy. Słodycze (krówki, czekoladki, ptasie mleczko) zgniatają się w plecaku albo topią w cieplejszych krajach, a po zjedzeniu nie zostawiają żadnego kontaktu. Alkohole blokuje limit **100 ml** w bagażu podręcznym oraz bariery kulturowe lub religijne części gospodarzy. Zwykłe pocztówki z kiosku nie mają podziękowania w języku Obdarowanego ani kodu QR pozwalającego połączyć Podróżnika z Obdarowanym na podrozowka.pl.

### 3. Rekomendacja dla podrozowka.pl
Każdy nagłówek na stronie głównej i w pierwszym akapicie na Facebooku musi najpierw dotykać sceny pakowania bagażu podręcznego lub spotkania z gospodarzem, a dopiero w kolejnym kroku nazywać produkt **odwróconą pocztówką z podziękowaniem w języku Obdarowanego**.`,
    sources: [
      {
        title: 'Podróżówka: Odwrócona pocztówka (podrozowka.pl)',
        uri: 'https://podrozowka.pl/',
      },
      {
        title: 'Sklep Podróżówka: katalog kart i kraje',
        uri: 'https://podrozowka.pl/sklep',
      },
    ],
    createdAt: '2026-11-16 14:20',
  },
  {
    id: 'run-seed-2',
    agentId: 'copywriter-glosu',
    agentName: 'Copywriter Głosu & Nagłówków',
    prompt:
      'Wygeneruj sekcję Hero i zwięzłe wyjaśnienie paczki 8 kartek dla osoby, która pierwszy raz trafia na podrozowka.pl.',
    output: `### Proponowane H1 (nad zagięciem)
**Pocztówka, którą Podróżnik zabiera z Polski, żeby podziękować Obdarowanemu na drugim końcu świata.**

**Podtytuł:**
Wystarczy kilka złotych i milimetr miejsca w bagażu podręcznym. Wybierasz gotową fotografię Polski z napisem podziękowania w języku kraju docelowego, a po zeskanowaniu kodu QR z rewersu Obdarowany rejestruje kartkę na podrozowka.pl i łączy się z Tobą na stałe.

### Wyjaśnienie zamówienia (zero ukrytych haczyków)
Pakiet startowy to 8 kartek (39,92 zł), bo tyle sztuk mieści się na jednym arkuszu drukarskim po 4,99 zł za kartkę. W jednym zestawie 8 sztuk łączysz wybrane kraje (105+ krajów, 89+ języków) i gotowe wzory, a wysyłkę w Polsce realizujemy w 2–3 dni robocze przez ORLEN Paczkę i InPost.`,
    createdAt: '2026-11-16 16:05',
  },
  {
    id: 'run-seed-3',
    agentId: 'architekt-social',
    agentName: 'Architekt Social & Rolek (Organic)',
    prompt:
      'Przygotuj post na Facebooka wyjaśniający przód z podziękowaniem oraz kod QR łączący Podróżnika z Obdarowanym.',
    output: `**Typ posta:** Anatomia Podróżówki (Awers + Rewers QR)

Zwykłą pocztówkę wysyłasz z wakacji do domu. Odwróconą pocztówkę zabierasz z Polski przed wylotem i wręczasz gospodarzowi albo poznanym osobom na miejscu.

Na przodzie Podróżówki jest wybrana fotografia Polski oraz napis podziękowania w języku kraju docelowego (np. po włosku we Włoszech albo po angielsku w Kenii). Gdy wręczasz kartkę przy kolacji lub po podwózce, Obdarowany od razu widzi ten gest we własnym języku.

Na odwrocie czekają mapa, linie na kilka Twoich słów i kod QR z zachętą do skanowania. Obdarowany rejestruje kartkę na podrozowka.pl i w ten sposób łączycie kontakt na lata.

W jednym pakiecie 8 sztuk (39,92 zł, 4,99 zł/szt.) możesz połączyć różne kraje z bazy 105+ kierunków, a dostawę w Polsce zamówisz przez ORLEN Paczkę lub InPost.

Zobacz gotowe wzory: https://podrozowka.pl/sklep?utm_source=facebook&utm_medium=organic&utm_campaign=anatomia_qr`,
    createdAt: '2026-11-16 18:40',
  },
];

export const INITIAL_ITERATIONS: IterationEntry[] = [
  {
    id: 'iter-1',
    date: 'Iteracja 1 · Fundament Marki',
    title: 'Usunięcie zakazanych porównań i korporacyjnej waty',
    problemObserved:
      'Pierwsze wersje opisów generowanych przez AI porównywały Podróżówkę do „wizytówki podróżnika” albo „alternatywy dla magnesów na lodówkę” i dopisywały hasła „szyte na miarę”.',
    configChange:
      'Wpisano twardą listę zakazów do Karty Głosu oraz dodano automatyczny Linter Antywzorców sprawdzający każdy wygenerowany tekst przed publikacją.',
    resultObserved:
      'Wszystkie nagłówki i posty zaczęły używać kategorii „odwrócona pocztówka” oraz konkretnych argumentów bagażu podręcznego (bez pustych przymiotników).',
  },
  {
    id: 'iter-2',
    date: 'Iteracja 2 · Realia Sklepu',
    title: 'Rozdzielenie zasad wyboru zdjęć: Teraz vs Przyszłość',
    problemObserved:
      'Model zakładał, że klient w sklepie może swobodnie podmieniać zdjęcia na wybranej karcie lub wrzucać własne fotografie z wakacji.',
    configChange:
      'Doprecyzowano stan obecny w Dokumentacji Kontekstowej (stałe zdjęcia w 5 kategoriach przypisane do gotowych kart) oraz plan przyszły (rozwój biblioteki marki, nigdy upload klienta).',
    resultObserved:
      'Brak błędnych obietnic w opisach sklepu oraz spójne wyświetlanie wszystkich prawdziwych kadrów z katalogu podrozowka-production.',
  },
  {
    id: 'iter-3',
    date: 'Iteracja 3 · Analityka GA4 Live',
    title: 'Podpięcie produkcyjnej usługi Google Analytics 4 (podrozowka-production)',
    problemObserved:
      'Domyślna konfiguracja wskazywała projekt testowy zamiast właściwego środowiska produkcyjnego strony podrozowka.pl, co groziło analizą pustych lub testowych danych.',
    configChange:
      'Przełączono integrację OAuth i wykrywanie usług GA4 na projekt podrozowka-production (713277839645) oraz dodano przekazywanie raportu lejka jednym kliknięciem do Agenta Analityka Konwersji (zasady-analizy.md).',
    resultObserved:
      'Analityk pracuje na realnych zdarzeniach view_item, add_to_cart, begin_checkout i purchase oraz wykrywa odesłania z bramek płatności.',
  },
  {
    id: 'iter-4',
    date: 'Iteracja 4 · Retencja & LTV',
    title: 'Wdrożenie analizy Churn & LTV (powroty po pierwszym arkuszu 8 szt.)',
    problemObserved:
      'Brakowało spójnego modelu utrzymania klienta i zwiększania LTV przy stałej cenie 4,99 zł/szt. (brak rabatów progowych), przez co agenci skupiali się wyłącznie na pierwszym zakupie.',
    configChange:
      'Dodano pole Churn & LTV do Mózgu Marki, zaktualizowano bazę wiedzy ze szkolenia oraz dopisano dedykowane scenariusze retencyjne u Stratega Tematów i Analityka Konwersji GA4.',
    resultObserved:
      'System projektuje komunikację pod kolejne wyjazdy i miksowanie 105+ krajów bez wymyślania statystyk powrotów ani obiecywania zniżek ilościowych.',
  },
  {
    id: 'iter-5',
    date: 'Iteracja 5 · Strategia & Triangulacja',
    title: 'Wdrożenie rygoru Stratega Wzrostu (ICE, AARRR, JTBD, Triangulacja)',
    problemObserved:
      'Przykłady dobre/złe i podsumowanie 10-punktowe nie były wstrzykiwane do promptów agentów, brakowało preferencji operatora, skanera i wywiadu luk, pełnego JTBD/VPC w Deep Research oraz triangulacji 3 źródeł z GA4.',
    configChange:
      'Wstrzyknięto goodExamples, badExamples, tenPointSummary i operatorPreferences do wszystkich agentów; podpięto skaner podrozowka.pl + wywiad luk w Mózgu Marki; rozbudowano Badacza Rynku (JTBD + VPC + [FAKT]/[HIPOTEZA]), Copywritera (walidacja TAK/NIE) oraz Analityka (Triangulacja 3 źródeł + ICE/AARRR).',
    resultObserved:
      'Każdy agent pracuje na 100% danych z Mózgu Marki i zasadach Głównego Stratega (Diagnoza → Strategia → Eksperymenty ICE → KPI) z pełną separacją faktów od hipotez.',
  },
  {
    id: 'iter-6',
    date: 'Iteracja 6 · Projekt Zaliczeniowy',
    title: 'Przebudowa prezentacji PDF pod technikalia Konfiguracji, Link Live i Zrzuty Ekranu',
    problemObserved:
      'Pierwsza wersja prezentacji (6 slajdów) opisywała głównie produkt zamiast funkcji narzędzia w pracy marketera, ukrywała treść promptów i reguł Lintera w punkcie Konfiguracja oraz ucinała próbki wyników bez zrzutów ekranu dashboardu.',
    configChange:
      'Rozbudowano generator prezentacji: dodano podgląd wklejonych promptów systemowych i reguł kodu Lintera Antywzorców, wybór dowolnych wyników z sesji bez ucinania, link do aplikacji live oraz obsługę załączania zrzutów ekranu.',
    resultObserved:
      'Kompletna dokumentacja spełniająca wszystkie 4 punkty zaliczeniowe i kryteria techniczne pod PDF.',
  },
  {
    id: 'iter-7',
    date: 'Iteracja 7 · Synchronizacja aplikacji z faktami produktu',
    title: 'Iteracja #7: Synchronizacja aplikacji z prezentacją i faktami produktu',
    problemObserved:
      'Agenci i generatory używały przestarzałych założeń produktu (awers bez napisu, QR jako trasa podróżnika, wybór dowolnego z 89+ języków, słowa odbiorca/nadawca, ceny wysyłki i wymiary w copy, brak bramek walidacji 0 → 1).',
    configChange:
      'Zaktualizowano Dokument Kontekstowy i wszystkie trasy AI (Podróżnik/Obdarowany, przód z podziękowaniem, QR łączący Podróżnika z Obdarowanym, trip Europa–Afryka 01.2027), dodano 6 nowych reguł do Lintera, 3 Bramki Walidacji w Planie 16-pkt oraz tryb karuzeli 7 slajdów.',
    resultObserved:
      'Wszystkie moduły, Linter Antywzorców oraz prezentacja pracują na spójnych, prawdziwych faktach podrozowka.pl i blokują niezweryfikowane obietnice oznaczeniem HIPOTEZA – czeka na walidację.',
  },
  {
    id: 'iter-8',
    date: 'Iteracja 8 · Design System & AI Gen',
    title: 'Wdrożenie żywego Design Systemu podrozowka.pl [P] i Studia Prompt Directora',
    problemObserved:
      'Dotychczas system skupiał się na strategii, copy i analityce, ale brakowało wyodrębnionych tokenów wizualnych marki z CSS strony podrozowka.pl oraz warsztatu generowania spójnych promptów do obrazów 4-up i rolek 9:16.',
    configChange:
      'Dodano skaner CSS /api/design-system/scan parsujący zmienne :root i Google Fonts bezpośrednio z podrozowka.pl (z kontrastem WCAG AA i jawnym rejestrem luk [BRAK]), studio Prompt Director AI Gen v1.0 z podglądem kart HTML oraz 8. agenta w Studio.',
    resultObserved:
      'Kreacje wizualne i scenopisy rolek dziedziczą prawdziwą paletę (#C52020, #356E4D, #FCFBF7, Playfair Display + Inter), respektują stałe kadry awersu z podziękowaniem oraz rewers QR i przechodzą automatyczny Linter Antywzorców.',
  },
  {
    id: 'iter-9',
    date: 'Iteracja 9 · Humanizer + Plan 16-pkt + Audyt Live',
    title: 'Wdrożenie skilla blader/humanizer, Planu 16-punktowego i 10-slajdowego decku PDF',
    problemObserved:
      'Wygenerowane szkice miewały sztuczną manierę AI (myślniki wtrąceniowe, pustą retorykę, pochlebstwa z czatu), a wdrożenie potrzebowało jednego planu zadań (GSC, Bing, Clarity, SEO/GEO) oraz spięcia audytów GA4/GROWS, Meta i Google Ads w 10 slajdach zaliczeniowych.',
    configChange:
      'Podpięto skan i oczyszczanie blader/humanizer (26 wzorców A–F) w generatorze postów/rolek oraz w promptach systemu, dodano 16-punktowy plan marketingowy z własnymi zadaniami i powiększono generator prezentacji do pełnych 10 slajdów.',
    resultObserved:
      'Posty, rolki 9:16 i cała dokumentacja zaliczeniowa przechodzą podwójną kontrolę (0 naruszeń Lintera + 0 nawyków AI z Humanizera), łącząc plan operacyjny z audytem GSC/GA4/Meta/Google Ads.',
  },
];

