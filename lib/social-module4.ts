export type SocialPostTypeId =
  | 'counter-intuitive'
  | 'travel-scene'
  | 'reverse-anatomy'
  | 'clean-front'
  | 'eight-pack-mix'
  | 'faq-objection'
  | 'zero-test-pack';

export type SocialSegmentId =
  | 'erasmus'
  | 'couchsurfing-solo'
  | 'family-friends'
  | 'business-trip';

import { PODROZOWKA_CATALOG } from '@/data/podrozowka-kb';

export type SocialFormatMode =
  | 'reel-and-fb'
  | 'fb-group-post'
  | 'reel-script-only'
  | 'carousel-7';

export interface SocialPostTypeSpec {
  id: SocialPostTypeId;
  number: number;
  name: string;
  angle: string;
  recommendedUtmCampaign: string;
  recommendedUtmContent: string;
  hookExample: string;
  physicalShotHint: string;
}

export interface SocialSegmentSpec {
  id: SocialSegmentId;
  label: string;
  painPoint: string;
  polishDepartureContext: string;
}

export interface PhysicalShotSpec {
  id: string;
  number: number;
  title: string;
  duration: string;
  framing: string;
  whatToShow: string;
  audioOrCaptionNote: string;
}

export interface WeeklyPlanSlot {
  id: string;
  weekLabel: string;
  title: string;
  postTypeId: SocialPostTypeId;
  segmentId: SocialSegmentId;
  shotId: string;
  channels: string;
  utmCampaign: string;
  utmContent: string;
  timeBudget: string;
  deliverable: string;
}

export const SOCIAL_SEVEN_TYPES: SocialPostTypeSpec[] = [
  {
    id: 'counter-intuitive',
    number: 1,
    name: 'Kontrintuicja (100 ml vs 8 kartek)',
    angle: 'Zestawienie limitu bagażu podręcznego z ciężkimi słodyczami i alkoholem.',
    recommendedUtmCampaign: 'm4_bagaz_100ml',
    recommendedUtmContent: 'typ1_kontrintuicja',
    hookExample: 'Lecisz z małym plecakiem? Krówki się roztopią, nalewki nie zabierzesz.',
    physicalShotHint: 'Wsuń 8 kartek do kieszonki okładki paszportu obok plecaka kabinowego.',
  },
  {
    id: 'travel-scene',
    number: 2,
    name: 'Scenka przed wylotem (Erasmus+ / Couchsurfing)',
    angle: 'Konkretny moment pierwszego spotkania za granicą i przełamania lodów bez niezręczności.',
    recommendedUtmCampaign: 'm4_erasmus_couch',
    recommendedUtmContent: 'typ2_scenka',
    hookExample: 'Pierwszy wieczór u gospodarza za granicą: dajesz coś z Polski w jego języku.',
    physicalShotHint: 'Dłoń pisze krótkie zdanie długopisem na rewersie przy kawie/paszporcie.',
  },
  {
    id: 'reverse-anatomy',
    number: 3,
    name: 'Anatomia rewersu (QR + 105+ krajów / 89+ języków)',
    angle: 'Obrót z przodu na rewers: mapa relacji, wpis, zachęta do skanowania w języku kraju docelowego i kod QR łączący Podróżnika z Obdarowanym.',
    recommendedUtmCampaign: 'm4_rewers_qr',
    recommendedUtmContent: 'typ3_rewers',
    hookExample: 'Zwykłą pocztówkę wysyłasz z wakacji do domu. Odwróconą Podróżnik zabiera z Polski i wręcza Obdarowanemu na miejscu.',
    physicalShotHint: 'Powolny obrót jednej kartki w dłoni przy świetle z okna (awers → rewers z QR).',
  },
  {
    id: 'clean-front',
    number: 4,
    name: 'Przód ze zdjęciem i podziękowaniem w języku Obdarowanego',
    angle: 'Pokaż, dlaczego awers od razu działa przy wręczeniu: fotografia Polski ze stałego katalogu i podziękowanie w języku kraju docelowego.',
    recommendedUtmCampaign: 'm4_awers_podziekowanie',
    recommendedUtmContent: 'typ4_awers',
    hookExample: 'Na przodzie Podróżówki jest kadrowane zdjęcie Polski i proste „dziękuję” w języku kraju, do którego jedziesz.',
    physicalShotHint: 'Zbliżenie na 3 wybrane kadry z Polski ułożone na drewnianym stole.',
  },
  {
    id: 'eight-pack-mix',
    number: 5,
    name: 'Pakiet 8 kartek (Dlaczego arkusz 39,92 zł?)',
    angle: 'Uczciwe zbicie obiekcji minimalnego pakietu 8 szt. po 4,99 zł + dowolne łączenie krajów z bazy 105+ kierunków.',
    recommendedUtmCampaign: 'm4_miks_8szt',
    recommendedUtmContent: 'typ5_miks8',
    hookExample: 'Jeden wyjazd, trzy kraje: łączysz 8 kartek w jednym arkuszu po 4,99 zł (39,92 zł).',
    physicalShotHint: 'Rozłóż wachlarzem 8 różnych kartek i pokaż kadr z przodu oraz rewers.',
  },
  {
    id: 'faq-objection',
    number: 6,
    name: 'Obiekcja na twardo (stałe kadry Polski, brak uploadu + trip 01.2027)',
    angle: `Szczerość produktowa: szybki wybór spośród ${PODROZOWKA_CATALOG.length} gotowych kadrów Polski (z zapowiedzią samochodowego tripu po Europie i Afryce w styczniu 2027).`,
    recommendedUtmCampaign: 'm4_faq_kadry',
    recommendedUtmContent: 'typ6_faq',
    hookExample: `Nie wgrywasz tu własnych zdjęć: wybierasz z ${PODROZOWKA_CATALOG.length} gotowych kadrów Polski i kraju z bazy 105+ kierunków w 2 minuty.`,
    physicalShotHint: 'Przerzucaj po kolei 5–6 wydrukowanych kartek jedną ręką do kamery.',
  },
  {
    id: 'zero-test-pack',
    number: 7,
    name: 'Paczka testowa w Polsce (Wyjście z 0 sprzedaży)',
    angle: 'Transparentne zaproszenie Podróżników lecących z Polski do przetestowania 8 kartek w zamian za pierwszą opinię i rejestrację QR.',
    recommendedUtmCampaign: 'm4_probki_pl',
    recommendedUtmContent: 'typ7_test_pl',
    hookExample: 'Lecisz w tym miesiącu z Polski za granicę? Wyślę 3 Podróżnikom arkusz 8 kartek, żeby przetestowali relację QR z Obdarowanym.',
    physicalShotHint: 'Pakowanie arkusza 8 kartek do koperty przed wysyłką w Polsce (ORLEN Paczka / InPost).',
  },
];

export const SOCIAL_SEGMENTS: SocialSegmentSpec[] = [
  {
    id: 'erasmus',
    label: 'Studenci Erasmus+ (wylot z Polski)',
    painPoint: 'Brak miejsca w walizce na prezenty dla współlokatorów z kilku różnych krajów naraz.',
    polishDepartureContext: 'Zamówienie w Polsce 2–3 dni przed wylotem (ORLEN Paczka / InPost).',
  },
  {
    id: 'couchsurfing-solo',
    label: 'Couchsurfing & podróże z plecakiem',
    painPoint: 'Wypada podziękować gospodarzowi za nocleg, ale limit 100 ml i waga plecaka blokują prezenty.',
    polishDepartureContext: '8 lekkich kartek mieszczących się w okładce paszportu.',
  },
  {
    id: 'family-friends',
    label: 'Wizyta u rodziny lub znajomych za granicą',
    painPoint: 'Słodycze i alkohol są oklepane albo problematyczne przy przesiadkach lotniczych.',
    polishDepartureContext: 'Język kraju Obdarowanego dobierany pod kraj docelowy (105+ krajów, 89+ języków).',
  },
  {
    id: 'business-trip',
    label: 'Wyjazdy służbowe i delegacje z Polski',
    painPoint: 'Potrzeba kulturalnego, nienachalnego upominku z Polski mieszczącego się w teczce.',
    polishDepartureContext: 'Fotografia Polski z podziękowaniem w języku gospodarza + rewers QR do kontaktu po wyjeździe.',
  },
];

export const PHYSICAL_SHOT_LIST: PhysicalShotSpec[] = [
  {
    id: 'shot-1',
    number: 1,
    title: '8 kartek vs kieszeń paszportu i plecak',
    duration: '8–10 sek. (9:16)',
    framing: 'Pionowo z góry (45°), przy oknie w świetle dziennym na drewnianym stole.',
    whatToShow:
      'Po lewej paszport i mały plecak kabinowy, po prawej cały arkusz 8 Podróżówek. Dłoń wsuwa plik 8 kartek w okładkę paszportu.',
    audioOrCaptionNote: 'Napis na ekranie: „Zmieścisz 8 prezentów tam, gdzie nie wejdzie nawet 100 ml”.',
  },
  {
    id: 'shot-2',
    number: 2,
    title: 'Powolny obrót: awers z podziękowaniem → rewers QR',
    duration: '10–12 sek. (9:16)',
    framing: 'Bliski kadr dłoni (tło neutralne: jasny blat lub ściana).',
    whatToShow:
      'Przez 3 sekundy przód z polskim kadrem i napisem podziękowania w języku kraju docelowego, potem płynny obrót na rewers: mapa, linie na wpis, zachęta do skanowania i kod QR.',
    audioOrCaptionNote: 'Napis: „Odwrócona pocztówka: zabierasz z Polski, Obdarowany skanuje QR i łączy się z Tobą”.',
  },
  {
    id: 'shot-3',
    number: 3,
    title: 'Wachlarz 8 różnych krajów',
    duration: '8–10 sek. (9:16)',
    framing: 'Zbliżenie na krawędź kartek i rozkładany wachlarz rewersów.',
    whatToShow:
      'Pstryknięcie w sztywną kartkę (naturalny dźwięk bez muzyki w tle przez 2 sek.) i rozłożenie 8 różnych krajów z bazy 105+ kierunków.',
    audioOrCaptionNote: 'Napis: „4,99 zł/szt. · Min. 8 szt. (39,92 zł) · Łączysz różne kraje”.',
  },
  {
    id: 'shot-4',
    number: 4,
    title: 'Pakowanie paczki do wysłania w Polsce',
    duration: '8–10 sek. (9:16)',
    framing: 'Kadr znad ramienia lub z boku stołu podczas pakowania.',
    whatToShow:
      'Włożenie 8 kartek do koperty wysyłkowej. Na końcu ujęcie gotowej przesyłki na wyjazd.',
    audioOrCaptionNote: 'Napis: „Wysyłka w Polsce w 2–3 dni · ORLEN Paczka i InPost”.',
  },
];

export const FOUR_WEEK_ORGANIC_PLAN: WeeklyPlanSlot[] = [
  {
    id: 'week-1',
    weekLabel: 'Tydzień 1',
    title: 'Limit bagażu podręcznego (100 ml vs 8 kartek)',
    postTypeId: 'counter-intuitive',
    segmentId: 'couchsurfing-solo',
    shotId: 'shot-1',
    channels: 'Rolka 9:16 (FB/IG/TikTok) + post na grupie tanie loty / Couchsurfing PL',
    utmCampaign: 'm4_bagaz_100ml',
    utmContent: 'tydzien1_paszport',
    timeBudget: '1,5 h montażu + 2,5 h publikacji i odpowiedzi',
    deliverable: 'Ujęcie #1 z paszportem + post PAS z linkiem UTM do /sklep',
  },
  {
    id: 'week-2',
    weekLabel: 'Tydzień 2',
    title: 'Tłumaczenie mechanizmu „odwróconej pocztówki” (QR relacyjny)',
    postTypeId: 'reverse-anatomy',
    segmentId: 'family-friends',
    shotId: 'shot-2',
    channels: 'Strona FB (karuzela 7 slajdów lub 2 zdjęcia: awers + rewers) + Rolka z obrotem',
    utmCampaign: 'm4_rewers_qr',
    utmContent: 'tydzien2_obrot',
    timeBudget: '1,5 h przygotowania + 2,0 h grupy i komentarze',
    deliverable: 'Ujęcie #2 (obrót w dłoni) + wyjaśnienie relacji Podróżnik ↔ Obdarowany przez QR',
  },
  {
    id: 'week-3',
    weekLabel: 'Tydzień 3',
    title: 'Zbijanie obiekcji: 8 sztuk (39,92 zł) i przód z podziękowaniem',
    postTypeId: 'eight-pack-mix',
    segmentId: 'erasmus',
    shotId: 'shot-3',
    channels: 'Grupy Erasmus+ Polska + Rolka z wachlarzem 8 krajów',
    utmCampaign: 'm4_miks_8szt',
    utmContent: 'tydzien3_wachlarz',
    timeBudget: '1,5 h edycji + 2,5 h aktywności w wątkach Erasmus',
    deliverable: 'Ujęcie #3 (wachlarz 8 kartek) + opis pakietu 105+ krajów',
  },
  {
    id: 'week-4',
    weekLabel: 'Tydzień 4',
    title: 'Akcja wyjścia z 0: paczki testowe w Polsce + zapowiedź tripu 01.2027',
    postTypeId: 'zero-test-pack',
    segmentId: 'erasmus',
    shotId: 'shot-4',
    channels: 'Wybrane grupy podróżnicze w Polsce + Strona FB',
    utmCampaign: 'm4_probki_pl',
    utmContent: 'tydzien4_paczki',
    timeBudget: '2,0 h rekrutacji testerów i wysyłki w Polsce + 1,0 h przegląd GA4',
    deliverable: 'Ujęcie #4 (pakowanie) + zbieranie pierwszych rejestracji QR i opinii',
  },
];

export const WEEKLY_6H_ALLOCATION = [
  {
    block: 'Produkcja z fizycznych kartek',
    hours: '1,5 h / tydz.',
    scope: 'Nagrania telefonem przy oknie (10–15 s) i szybki montaż napisów w CapCut.',
  },
  {
    block: 'Strona FB + Grupy wyjazdowe w Polsce',
    hours: '2,5 h / tydz.',
    scope: '1–2 posty organiczne z UTM oraz merytoryczne odpowiedzi pod pytaniami o prezent z Polski.',
  },
  {
    block: 'Paczki testowe i pierwsze dowody (wyjście z 0)',
    hours: '1,0 h / tydz.',
    scope: 'Kontakt z wyjeżdżającymi osobami w Polsce i zbieranie zgód/zdjęć wg Omnibus.',
  },
  {
    block: 'Pętla danych GA4 + Microsoft Clarity',
    hours: '1,0 h / tydz.',
    scope: 'Sprawdzenie wejść do /sklep wg utm_campaign i nagrań sesji przed kolejnym tygodniem.',
  },
];

export function buildModule4UtmUrl(utmCampaign: string, utmContent: string): string {
  const params = new URLSearchParams({
    utm_source: 'facebook',
    utm_medium: 'organic',
    utm_campaign: utmCampaign.trim() || 'm4_organic',
    utm_content: utmContent.trim() || 'post',
  });
  return `https://podrozowka.pl/sklep?${params.toString()}`;
}
