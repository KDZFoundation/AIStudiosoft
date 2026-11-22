import { NextResponse } from 'next/server';
import {
  buildVerifiedBaselineDesignSystem,
  classifyWcagAA,
  ColorTokenSpec,
  computeContrastRatio,
  DesignSystemSnapshot,
  hslTripletToHex,
  TypographySpec,
} from '@/lib/design-system';

function parseRootVariables(css: string): Record<string, string> {
  const vars: Record<string, string> = {};
  const rootMatches = css.match(/:root\s*\{([^}]+)\}/g) ?? [];
  for (const block of rootMatches) {
    const inner = block.replace(/^:root\s*\{/, '').replace(/\}$/, '');
    for (const decl of inner.split(';')) {
      const idx = decl.indexOf(':');
      if (idx === -1) continue;
      const key = decl.slice(0, idx).trim();
      const val = decl.slice(idx + 1).trim();
      if (key.startsWith('--') && val) {
        vars[key] = val;
      }
    }
  }
  return vars;
}

export async function GET() {
  try {
    const homeRes = await fetch('https://podrozowka.pl/', {
      headers: { 'User-Agent': 'Podrozowka-DesignSystem-Audit/1.0' },
      cache: 'no-store',
    });

    if (!homeRes.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: `Strona podrozowka.pl zwróciła kod HTTP ${homeRes.status}.`,
        },
        { status: 502 }
      );
    }

    const html = await homeRes.text();
    const cssHrefMatch = html.match(/href=["']([^"']+\.css[^"']*)["']/i);
    const stylesheetPath = cssHrefMatch?.[1] || '/assets/index-D8YUbOu8.css';
    const stylesheetUrl = stylesheetPath.startsWith('http')
      ? stylesheetPath
      : new URL(stylesheetPath, 'https://podrozowka.pl/').toString();

    const googleFontsMatch = html.match(
      /href=["'](https:\/\/fonts\.googleapis\.com\/css2[^"']+)["']/i
    );
    const googleFontsUrl = googleFontsMatch?.[1] ?? '';

    const faviconMatch = html.match(/rel=["']icon["'][^>]*href=["']([^"']+)["']/i);
    const faviconUrl = faviconMatch?.[1]
      ? new URL(faviconMatch[1], 'https://podrozowka.pl/').toString()
      : 'https://podrozowka.pl/favicon-traveler.svg';

    const cssRes = await fetch(stylesheetUrl, {
      headers: { 'User-Agent': 'Podrozowka-DesignSystem-Audit/1.0' },
      cache: 'no-store',
    });

    if (!cssRes.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: `Nie udało się pobrać arkusza stylów ${stylesheetUrl} (HTTP ${cssRes.status}).`,
        },
        { status: 502 }
      );
    }

    const css = await cssRes.text();
    const vars = parseRootVariables(css);
    const baseline = buildVerifiedBaselineDesignSystem(
      `${new Date().toLocaleString('pl-PL')} (skan na żywo [P])`
    );

    const resolveHex = (varName: string, fallbackHex: string): { raw: string; hex: string } => {
      const val = vars[varName];
      if (!val) return { raw: 'BRAK w :root', hex: fallbackHex };
      if (val.startsWith('#')) return { raw: val, hex: val.toUpperCase() };
      const hex = hslTripletToHex(val);
      return { raw: `hsl(${val})`, hex: hex ?? fallbackHex };
    };

    const bg = resolveHex('--background', '#FCFBF7');
    const creamHex = bg.hex;

    const liveColorMappings: Array<{
      token: string;
      primaryVar: string;
      role: string;
      fallbackHex: string;
      note: string;
    }> = [
      {
        token: '--background / --warm-white',
        primaryVar: '--background',
        role: 'Główne tło strony (papier podróżny)',
        fallbackHex: '#FCFBF7',
        note: `:root w ${stylesheetUrl}`,
      },
      {
        token: '--foreground / --card-foreground',
        primaryVar: '--foreground',
        role: 'Tekst główny (ciemny brąz atramentu)',
        fallbackHex: '#2E241F',
        note: `:root w ${stylesheetUrl}`,
      },
      {
        token: '--primary / --polish-red',
        primaryVar: '--primary',
        role: 'Główny akcent i przyciski CTA (polska czerwień)',
        fallbackHex: '#C52020',
        note: `:root w ${stylesheetUrl}`,
      },
      {
        token: '--accent / --forest',
        primaryVar: '--accent',
        role: 'Drugi kolor marki (leśna zieleń szlaku)',
        fallbackHex: '#356E4D',
        note: `:root + ${faviconUrl}`,
      },
      {
        token: '--gold',
        primaryVar: '--gold',
        role: 'Akcent wyróżniający / odznaki i kapelusz podróżnika',
        fallbackHex: '#D9A121',
        note: `:root + ${faviconUrl}`,
      },
      {
        token: '--secondary / --cream',
        primaryVar: '--secondary',
        role: 'Powierzchnie sekcji i karty formularzy',
        fallbackHex: '#F2ECE1',
        note: `:root w ${stylesheetUrl}`,
      },
      {
        token: '--muted-foreground',
        primaryVar: '--muted-foreground',
        role: 'Metadane i opisy uzupełniające',
        fallbackHex: '#7E7067',
        note: `:root w ${stylesheetUrl}`,
      },
      {
        token: '--border / --input',
        primaryVar: '--border',
        role: 'Cienkie obramowania kart i pól wejściowych',
        fallbackHex: '#E6E0D6',
        note: `:root w ${stylesheetUrl}`,
      },
    ];

    const colorTokens: ColorTokenSpec[] = liveColorMappings.map((m) => {
      const resolved = resolveHex(m.primaryVar, m.fallbackHex);
      const isLiveFound = resolved.raw !== 'BRAK w :root';
      const contrast = computeContrastRatio(resolved.hex, creamHex);
      return {
        token: m.token,
        role: m.role,
        rawValue: resolved.raw,
        hex: resolved.hex,
        contrastOnCream: contrast,
        wcagAA: classifyWcagAA(contrast),
        status: isLiveFound ? 'P' : 'BRAK',
        sourceNote: m.note,
      };
    });

    const displayFont = vars['--font-display'] || '"Playfair Display", Georgia, serif';
    const bodyFont = vars['--font-body'] || '"Inter", system-ui, sans-serif';
    const hasPatrickHand = /Patrick\+Hand|Patrick Hand/i.test(googleFontsUrl + html);

    const typography: TypographySpec[] = [
      {
        role: 'Nagłówki Display / Hero / Tytuły sekcji',
        cssVar: '--font-display',
        family: displayFont,
        weights: /Playfair\+Display:[^&]*/i.exec(googleFontsUrl)?.[0] || '400, 500, 600, 700',
        status: vars['--font-display'] ? 'P' : 'Z',
        sourceNote: `Live CSS + Google Fonts (${stylesheetUrl})`,
      },
      {
        role: 'Tekst zasadniczy, przyciski UI i specyfikacja',
        cssVar: '--font-body',
        family: bodyFont,
        weights: /Inter:[^&]*/i.exec(googleFontsUrl)?.[0] || '300–700',
        status: vars['--font-body'] ? 'P' : 'Z',
        sourceNote: `Live CSS + Google Fonts (${stylesheetUrl})`,
      },
      {
        role: 'Akcent odręczny / podpis na pocztówce',
        cssVar: 'Google Fonts <link>',
        family: hasPatrickHand ? '"Patrick Hand"' : 'BRAK: nie wykryto w <head>',
        weights: hasPatrickHand ? '400' : 'n/d',
        status: hasPatrickHand ? 'P' : 'BRAK',
        sourceNote: 'Skan <head> na https://podrozowka.pl/',
      },
    ];

    const liveRadius = vars['--radius'] || '0.75rem';
    const liveShadows = [vars['--shadow-soft'], vars['--shadow-card']]
      .filter(Boolean)
      .join(' · ');

    const snapshot: DesignSystemSnapshot = {
      ...baseline,
      isLiveScan: true,
      stylesheetUrl,
      faviconUrl,
      colorTokens,
      typography,
      geometryAndElevation: [
        {
          token: '--radius',
          value: liveRadius,
          usage: 'Zaokrąglenie kart, pól formularzy i kontenerów sklepu',
          status: vars['--radius'] ? 'P' : 'BRAK',
        },
        {
          token: '--shadow-soft / --shadow-card',
          value: liveShadows || baseline.geometryAndElevation[1].value,
          usage: 'Ciepły cień kart na kremowym tle (--background)',
          status: liveShadows ? 'P' : 'BRAK',
        },
        baseline.geometryAndElevation[2],
      ],
    };

    return NextResponse.json({
      ok: true,
      snapshot,
      cssVariablesCount: Object.keys(vars).length,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : 'Nie udało się przeprowadzić audytu CSS podrozowka.pl.',
      },
      { status: 500 }
    );
  }
}
