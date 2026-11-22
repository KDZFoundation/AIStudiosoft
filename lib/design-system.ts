import { PODROZOWKA_CATALOG } from '@/data/podrozowka-kb';

export type SourceRank = 'P' | 'Z' | 'M' | 'BRAK';

export interface ColorTokenSpec {
  token: string;
  role: string;
  rawValue: string;
  hex: string;
  contrastOnCream: number | null;
  wcagAA: 'PASS' | 'LARGE_ONLY' | 'FAIL' | 'N/A';
  status: SourceRank;
  sourceNote: string;
}

export interface TypographySpec {
  role: string;
  cssVar: string;
  family: string;
  weights: string;
  status: SourceRank;
  sourceNote: string;
}

export interface GapOrContradictionSpec {
  id: string;
  area: string;
  severity: 'BRAK' | 'OTWARTA' | 'REGUŁA';
  detail: string;
  actionRequired: string;
}

export interface DesignSystemSnapshot {
  brandName: string;
  sourceUrl: string;
  shopUrl: string;
  scannedAt: string;
  isLiveScan: boolean;
  stylesheetUrl: string;
  faviconUrl: string;
  colorTokens: ColorTokenSpec[];
  typography: TypographySpec[];
  geometryAndElevation: Array<{
    token: string;
    value: string;
    usage: string;
    status: SourceRank;
  }>;
  productVisualRules: string[];
  gapsAndContradictions: GapOrContradictionSpec[];
}

export type PromptDirectorWorkflow =
  | 'exploration-4up'
  | 'final-image'
  | 'image-edit'
  | 'video-reel';

export type TargetGenModel =
  | 'chatgpt-image-2.5'
  | 'nano-banana-2'
  | 'kling-3.0'
  | 'seedance-2.5-remotion';

export interface PromptDirectorPreset {
  id: string;
  label: string;
  workflow: PromptDirectorWorkflow;
  model: TargetGenModel;
  aspectRatio: '1:1' | '4:5' | '9:16' | '16:9';
  cardId: string;
  brief: string;
  cardHeadline: string;
  cardSubline: string;
  cardCta: string;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export function hslTripletToHex(triplet: string): string | null {
  const clean = triplet.split('/')[0].trim();
  const match = clean.match(/^(-?\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/);
  if (!match) return null;

  const h = ((parseFloat(match[1]) % 360) + 360) % 360;
  const s = clamp01(parseFloat(match[2]) / 100);
  const l = clamp01(parseFloat(match[3]) / 100);

  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16),
      parseInt(clean[1] + clean[1], 16),
      parseInt(clean[2] + clean[2], 16),
    ];
  }
  if (clean.length === 6) {
    return [
      parseInt(clean.slice(0, 2), 16),
      parseInt(clean.slice(2, 4), 16),
      parseInt(clean.slice(4, 6), 16),
    ];
  }
  return null;
}

function relativeLuminance(hex: string): number | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function computeContrastRatio(fgHex: string, bgHex: string): number | null {
  const l1 = relativeLuminance(fgHex);
  const l2 = relativeLuminance(bgHex);
  if (l1 === null || l2 === null) return null;
  const bright = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  return Math.round(((bright + 0.05) / (dark + 0.05)) * 100) / 100;
}

export function classifyWcagAA(ratio: number | null): 'PASS' | 'LARGE_ONLY' | 'FAIL' | 'N/A' {
  if (ratio === null) return 'N/A';
  if (ratio >= 4.5) return 'PASS';
  if (ratio >= 3.0) return 'LARGE_ONLY';
  return 'FAIL';
}

export function buildVerifiedBaselineDesignSystem(scannedAt = '2026-11-19 (audyt CSS [P])'): DesignSystemSnapshot {
  const creamHex = hslTripletToHex('40 33% 98%') ?? '#FCFBF7';
  const rawTokens: Array<Omit<ColorTokenSpec, 'contrastOnCream' | 'wcagAA'>> = [
    {
      token: '--background / --warm-white',
      role: 'Główne tło strony (papier podróżny)',
      rawValue: 'hsl(40 33% 98%)',
      hex: creamHex,
      status: 'P',
      sourceNote: ':root podrozowka.pl/assets/index-D8YUbOu8.css',
    },
    {
      token: '--foreground / --card-foreground',
      role: 'Tekst główny (ciemny brąz atramentu)',
      rawValue: 'hsl(20 20% 15%)',
      hex: hslTripletToHex('20 20% 15%') ?? '#2E241F',
      status: 'P',
      sourceNote: ':root podrozowka.pl/assets/index-D8YUbOu8.css',
    },
    {
      token: '--primary / --polish-red',
      role: 'Główny akcent i przyciski CTA (polska czerwień)',
      rawValue: 'hsl(0 72% 45%)',
      hex: hslTripletToHex('0 72% 45%') ?? '#C52020',
      status: 'P',
      sourceNote: ':root podrozowka.pl/assets/index-D8YUbOu8.css',
    },
    {
      token: '--accent / --forest',
      role: 'Drugi kolor marki (leśna zieleń szlaku)',
      rawValue: 'hsl(145 35% 32%)',
      hex: hslTripletToHex('145 35% 32%') ?? '#356E4D',
      status: 'P',
      sourceNote: ':root + favicon-traveler.svg',
    },
    {
      token: '--gold',
      role: 'Akcent wyróżniający / odznaki i kapelusz podróżnika',
      rawValue: 'hsl(43 74% 49%)',
      hex: hslTripletToHex('43 74% 49%') ?? '#D9A121',
      status: 'P',
      sourceNote: ':root + favicon-traveler.svg (#BA8B2B)',
    },
    {
      token: '--secondary / --cream',
      role: 'Powierzchnie sekcji i karty formularzy',
      rawValue: 'hsl(38 35% 92%)',
      hex: hslTripletToHex('38 35% 92%') ?? '#F2ECE1',
      status: 'P',
      sourceNote: ':root podrozowka.pl/assets/index-D8YUbOu8.css',
    },
    {
      token: '--muted-foreground',
      role: 'Metadane i opisy uzupełniające',
      rawValue: 'hsl(20 10% 45%)',
      hex: hslTripletToHex('20 10% 45%') ?? '#7E7067',
      status: 'P',
      sourceNote: ':root podrozowka.pl/assets/index-D8YUbOu8.css',
    },
    {
      token: '--border / --input',
      role: 'Cienkie obramowania kart i pól wejściowych',
      rawValue: 'hsl(35 20% 88%)',
      hex: hslTripletToHex('35 20% 88%') ?? '#E6E0D6',
      status: 'P',
      sourceNote: ':root podrozowka.pl/assets/index-D8YUbOu8.css',
    },
  ];

  const colorTokens: ColorTokenSpec[] = rawTokens.map((item) => {
    const contrast = computeContrastRatio(item.hex, creamHex);
    return {
      ...item,
      contrastOnCream: contrast,
      wcagAA: classifyWcagAA(contrast),
    };
  });

  return {
    brandName: 'Podróżówka',
    sourceUrl: 'https://podrozowka.pl/',
    shopUrl: 'https://podrozowka.pl/sklep',
    scannedAt,
    isLiveScan: false,
    stylesheetUrl: 'https://podrozowka.pl/assets/index-D8YUbOu8.css',
    faviconUrl: 'https://podrozowka.pl/favicon-traveler.svg',
    colorTokens,
    typography: [
      {
        role: 'Nagłówki Display / Hero / Tytuły sekcji',
        cssVar: '--font-display',
        family: '"Playfair Display", Georgia, serif',
        weights: '400, 500, 600, 700 (Regular + Italic)',
        status: 'P',
        sourceNote: 'Google Fonts + :root na podrozowka.pl',
      },
      {
        role: 'Tekst zasadniczy, przyciski UI i specyfikacja',
        cssVar: '--font-body',
        family: '"Inter", system-ui, sans-serif',
        weights: '300, 400, 500, 600, 700',
        status: 'P',
        sourceNote: 'Google Fonts + :root na podrozowka.pl',
      },
      {
        role: 'Akcent odręczny / podpis na pocztówce',
        cssVar: 'Google Fonts import',
        family: '"Patrick Hand"',
        weights: '400',
        status: 'P',
        sourceNote: 'Ładowane w <head> podrozowka.pl (brak zmiennej :root)',
      },
    ],
    geometryAndElevation: [
      {
        token: '--radius',
        value: '0.75rem (12px)',
        usage: 'Zaokrąglenie kart, pól formularzy i kontenerów sklepu',
        status: 'P',
      },
      {
        token: '--shadow-soft / --shadow-card',
        value: '0 4px 20px -4px hsl(20 20% 15% / .08) · 0 8px 30px -8px hsl(20 20% 15% / .12)',
        usage: 'Ciepły cień kart na kremowym tle (--background)',
        status: 'P',
      },
      {
        token: 'Specyfikacja fizyczna (wewnętrzna)',
        value: '148×105 mm (A6), karton 350g połysk, 8 kartek = 1 arkusz drukarski [WYŁĄCZNIE WEWNĘTRZNA — NIE UŻYWAĆ W COPY DO KLIENTÓW]',
        usage: 'Parametry produkcyjne do makiet i briefów AI Gen, pomijane w copy do klientów',
        status: 'Z',
      },
    ],
    productVisualRules: [
      `Awers (przód) zawsze pokazuje 1 z ${PODROZOWKA_CATALOG.length} autorskich fotografii Polski w 5 kategoriach ORAZ napis podziękowania w języku kraju docelowego.`,
      'Rewers (tył: /images/rewers-podrozowka.png) zachowuje stałą kompozycję: mapa relacji, linie na odręczne słowa, kod QR oraz zachęta do zeskanowania kodu w tym samym języku (Obdarowany rejestruje kartkę i łączy się z Podróżnikiem).',
      `Klienci NIGDY nie wgrywają własnych zdjęć prywatnych ani w sklepie, ani w reklamach. W Prompt Directorze pracujemy wyłącznie na ${PODROZOWKA_CATALOG.length} stałych wzorach lub scenkach lifestyle wokół wręczania kartki.`,
      'Zakaz porównań wizualnych do „wizytówki” oraz do „magnesu na lodówkę”; w tekstach do klientów używamy „Podróżnik” i „Obdarowany”, bez cen wysyłki ani wymiarów/gramatury.',
    ],
    gapsAndContradictions: [
      {
        id: 'L1',
        area: 'Wariant logo SVG na ciemne i jasne tło + pole ochronne',
        severity: 'BRAK',
        detail:
          'W kodzie strony wykryto wyłącznie wielokolorowy sygnet `/favicon-traveler.svg` (`#BA8B2B` / `#3E823E` / `#000`). Brak produkcyjnego wordmarku SVG oraz zdefiniowanego pola ochronnego.',
        actionRequired: 'BRAK: do uzupełnienia przez właściciela (pliki logo wektorowe).',
      },
      {
        id: 'L2',
        area: 'Tryb ciemny (Dark Mode)',
        severity: 'BRAK',
        detail:
          'Arkusz produkcyjny CSS definiuje wyłącznie jasną paletę ciepłego papieru (`--background: 40 33% 98%`). Brak zdefiniowanych tokenów `.dark`.',
        actionRequired: 'Nie wymyślać ciemnego motywu. Na potrzeby nakładek wideo stosować półprzezroczystą aplę z `#2E241F` lub `#FCFBF7`.',
      },
      {
        id: 'L3',
        area: 'Specyfikacja druku CMYK i spady drukarskie',
        severity: 'BRAK',
        detail:
          'Znany jest format netto `148×105 mm` oraz gramatura `350g` połysk, ale w zasobach webowych brak dokładnych profili ICC CMYK i szerokości spadu (np. 2–3 mm).',
        actionRequired: 'BRAK: nie generować gotowych plików do druku z RGB CSS bez potwierdzenia z drukarnią.',
      },
      {
        id: 'L4',
        area: 'Sprzeczność nasycenia CTA: Gold (#D9A121) vs Polish Red (#C52020)',
        severity: 'REGUŁA',
        detail:
          'W CSS `:root` głównym kolorem akcji (`--primary`) jest czerwień `--polish-red` (`#C52020`), natomiast `--gold` (`#D9A121`) ma niski kontrast na jasnym kremie (2.25:1, FAIL dla drobnego tekstu).',
        actionRequired:
          'Do przycisków CTA i tekstu na jasnym tle używać `#C52020` lub `#356E4D` (PASS AA). Kolor `--gold` stosować tylko jako obrys/akcent lub tło z ciemnym tekstem `#2E241F`.',
      },
    ],
  };
}

export const PROMPT_DIRECTOR_PRESETS: PromptDirectorPreset[] = [
  {
    id: 'explore-backpack',
    label: '4-up 2×2: Scenka „Bagaż podręczny i wręczenie gospodarzowi”',
    workflow: 'exploration-4up',
    model: 'chatgpt-image-2.5',
    aspectRatio: '4:5',
    cardId: PODROZOWKA_CATALOG[5]?.id || '1742b4f99e71',
    brief:
      'Zaprojektuj 4 różne ujęcia eksploracyjne (siatka 2×2): Podróżnik pakujący przed wylotem płaskie Podróżówki między strony książki w małym plecaku kabinowym albo wręczający kartkę Obdarowanemu przy drewnianym stole za granicą.',
    cardHeadline: 'Mieści się w bagażu podręcznym. Zostawia kontakt na lata.',
    cardSubline: '8 kartek w pakiecie = 39,92 zł · Ponad 105 krajów i 89+ języków',
    cardCta: `Wybierz z ${PODROZOWKA_CATALOG.length} kadrów →`,
  },
  {
    id: 'final-reverse-detail',
    label: 'Final Image: Zbliżenie rewersu z kodem QR i odręcznym wpisem',
    workflow: 'final-image',
    model: 'nano-banana-2',
    aspectRatio: '1:1',
    cardId: 'reverse-qr',
    brief:
      'Stwórz dopracowane ujęcie produktowe lifestyle pokazujące fizyczny rewers Podróżówki leżący na ciepłym drewnianym stoliku kawiarnianym obok filiżanki espresso i paszportu. Zachowaj układ rewersu: mapę, linie na wpis, kod QR i zachętę do skanowania.',
    cardHeadline: 'Obdarowany skanuje kod QR i łączy się z Podróżnikiem na podrozowka.pl.',
    cardSubline: '4,99 zł/szt. (min. 8 kartek) · Wysyłka PL: ORLEN Paczka i InPost · Realizacja 2–3 dni',
    cardCta: 'Sprawdź 105+ krajów',
  },
  {
    id: 'edit-catalog-table',
    label: 'Edycja referencji: Zachowaj awers z katalogu, zmień scenerię stołu',
    workflow: 'image-edit',
    model: 'nano-banana-2',
    aspectRatio: '4:5',
    cardId: PODROZOWKA_CATALOG[0]?.id || 'a184550ca774',
    brief:
      'Edycja z zachowaniem oryginału (Preserve/Change): zachowaj 100% oryginalnej fotografii Polski oraz podziękowania w języku kraju docelowego z awersu, umieść wydrukowaną kartkę w dłoniach Podróżnika i Obdarowanego rozmawiających przy stole za granicą.',
    cardHeadline: 'Zdjęcie z Polski i podziękowanie w języku kraju, do którego lecisz.',
    cardSubline: `${PODROZOWKA_CATALOG.length} autorskich kadrów Polski · 105+ krajów w jednym arkuszu 8 szt.`,
    cardCta: `Zobacz katalog ${PODROZOWKA_CATALOG.length} wzorów`,
  },
  {
    id: 'reel-100ml',
    label: 'Rolka 9:16 (15s): „Limit płynów 100 ml vs 8 Podróżówek”',
    workflow: 'video-reel',
    model: 'kling-3.0',
    aspectRatio: '9:16',
    cardId: 'reverse-qr',
    brief:
      '15-sekundowa rolka 9:16 na TikTok / IG / FB (4 ujęcia z cięciem rytmicznym + napisy w bezpiecznej strefie montażowej Remotion): problem ciężkich słodyczy i limitu 100 ml w bagażu podręcznym → włożenie cienkiego arkusza 8 Podróżówek do kieszeni paszportu → uśmiechnięte wręczenie kartki Obdarowanemu i skanowanie QR.',
    cardHeadline: 'Lecisz z małym plecakiem? Nie bierz czekolady, która się stopi.',
    cardSubline: '8 Podróżówek (39,92 zł) · Zero limitu płynów · Relacja przez kod QR',
    cardCta: 'Zobacz jak działa →',
  },
];

function esc(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function buildSocialCardPreviewHtml(opts: {
  headline: string;
  subline: string;
  ctaLabel: string;
  badgeText: string;
  imageUrl: string;
  aspectRatio: '1:1' | '4:5' | '9:16' | '16:9';
  designSystem: DesignSystemSnapshot;
}): string {
  const polishRed =
    opts.designSystem.colorTokens.find((t) => t.token.includes('primary'))?.hex ?? '#C52020';
  const forest =
    opts.designSystem.colorTokens.find((t) => t.token.includes('forest'))?.hex ?? '#356E4D';
  const cream =
    opts.designSystem.colorTokens.find((t) => t.token.includes('background'))?.hex ?? '#FCFBF7';
  const ink =
    opts.designSystem.colorTokens.find((t) => t.token.includes('foreground'))?.hex ?? '#2E241F';
  const gold =
    opts.designSystem.colorTokens.find((t) => t.token.includes('gold'))?.hex ?? '#D9A121';
  const border =
    opts.designSystem.colorTokens.find((t) => t.token.includes('border'))?.hex ?? '#E6E0D6';

  const ratioCss =
    opts.aspectRatio === '9:16'
      ? '9 / 16'
      : opts.aspectRatio === '4:5'
      ? '4 / 5'
      : opts.aspectRatio === '16:9'
      ? '16 / 9'
      : '1 / 1';

  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8" />
  <title>Podgląd Kreacji Podróżówka (${esc(opts.aspectRatio)})</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;1,500&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #F2ECE1;
      font-family: "Inter", system-ui, sans-serif;
      padding: 16px;
    }
    .canvas {
      width: 100%;
      max-width: 420px;
      aspect-ratio: ${ratioCss};
      background: ${cream};
      border: 1px solid ${border};
      border-radius: 16px;
      box-shadow: 0 14px 36px -10px rgba(46, 36, 31, 0.16);
      padding: 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 14px;
      overflow: hidden;
      color: ${ink};
    }
    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      font-size: 11px;
      font-weight: 600;
      color: ${forest};
    }
    .brand {
      font-family: "Playfair Display", Georgia, serif;
      font-size: 16px;
      font-weight: 700;
      color: ${ink};
    }
    .photo-frame {
      position: relative;
      flex: 1 1 auto;
      min-height: 140px;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid ${border};
      background: #F6F0E4;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .photo-frame img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .headline {
      font-family: "Playfair Display", Georgia, serif;
      font-size: ${opts.aspectRatio === '16:9' ? '18px' : '21px'};
      line-height: 1.22;
      font-weight: 700;
      color: ${ink};
    }
    .subline {
      font-size: 12px;
      line-height: 1.45;
      color: #5C4F47;
    }
    .footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding-top: 8px;
      border-top: 1px solid ${border};
    }
    .cta {
      background: ${polishRed};
      color: ${cream};
      font-size: 12px;
      font-weight: 600;
      padding: 8px 14px;
      border-radius: 999px;
      text-decoration: none;
      white-space: nowrap;
    }
    .spec {
      font-size: 11px;
      font-weight: 600;
      color: ${forest};
    }
    .accent-bar {
      height: 4px;
      width: 48px;
      border-radius: 999px;
      background: ${gold};
    }
  </style>
</head>
<body>
  <article class="canvas">
    <header class="topbar">
      <span class="brand">Podróżówka</span>
      <span>${esc(opts.badgeText)}</span>
    </header>

    <div class="photo-frame" title="Awers: fotografia Polski i napis podziękowania w języku kraju docelowego">
      <img src="${esc(opts.imageUrl)}" alt="Kadr produktu Podróżówka" referrerpolicy="no-referrer" />
    </div>

    <div style="display:flex;flex-direction:column;gap:8px;">
      <div class="accent-bar"></div>
      <h1 class="headline">${esc(opts.headline)}</h1>
      <p class="subline">${esc(opts.subline)}</p>
    </div>

    <footer class="footer">
      <span class="spec">8 szt. · 39,92 zł · 105+ krajów</span>
      <span class="cta">${esc(opts.ctaLabel)}</span>
    </footer>
  </article>
</body>
</html>`;
}
