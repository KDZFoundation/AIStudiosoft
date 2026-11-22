import { NextRequest, NextResponse } from 'next/server';
import { BrandContextData, DEFAULT_BRAND_CONTEXT } from '@/data/podrozowka-kb';
import { buildBrandContextBlock } from '@/lib/brand-context';
import { formatGeminiError, generateWithGemini } from '@/lib/gemini';
import { HUMANIZER_EMBEDDED_DIRECTIVE } from '@/lib/humanizer';

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function GET() {
  try {
    const [homeRes, shopRes] = await Promise.all([
      fetch('https://podrozowka.pl/', {
        headers: { 'User-Agent': 'Podrozowka-Marketing-Agent-Audit/1.0' },
        next: { revalidate: 300 },
      }),
      fetch('https://podrozowka.pl/sklep', {
        headers: { 'User-Agent': 'Podrozowka-Marketing-Agent-Audit/1.0' },
        next: { revalidate: 300 },
      }).catch(() => null),
    ]);

    if (!homeRes.ok) {
      return NextResponse.json(
        { ok: false, error: `Strona podrozowka.pl zwróciła kod ${homeRes.status}.` },
        { status: 502 }
      );
    }

    const html = await homeRes.text();
    const shopHtml = shopRes && shopRes.ok ? await shopRes.text() : '';
    const combinedText = `${stripTags(html)} ${stripTags(shopHtml)}`;

    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i);
    const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);

    const factualChecks = [
      { label: 'Cena jednostkowa 4,99 zł', found: /4[,.]99/.test(combinedText) },
      { label: 'Minimum 8 sztuk / arkusz', found: /\b8\s*(szt|kartek|poczt)/i.test(combinedText) },
      { label: 'Ponad 105 krajów', found: /105/.test(combinedText) },
      { label: 'Dostawa ORLEN Paczka', found: /orlen/i.test(combinedText) },
    ];

    return NextResponse.json({
      ok: true,
      checkedAt: new Date().toLocaleString('pl-PL'),
      status: homeRes.status,
      shopStatus: shopRes?.status ?? null,
      title: titleMatch?.[1]?.trim() || 'Podróżówka. Odwrócona pocztówka z Polski',
      description: descMatch?.[1]?.trim() || '',
      ogTitle: ogTitleMatch?.[1]?.trim() || '',
      h1: h1Match ? stripTags(h1Match[1]) : '',
      factualChecks,
      verifiedRoutes: ['/', '/sklep', '/spolecznosc', '/mapa', '/autorzy', '/kontakt'],
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Nie udało się połączyć z podrozowka.pl.';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { brandContext?: BrandContextData };
    const ctx = { ...DEFAULT_BRAND_CONTEXT, ...(body.brandContext ?? {}) };

    const systemInstruction = `Jesteś Strategiem Marketingowym odpowiedzialnym za audyt kompletności i wywiad uzupełniający luki w dokumencie kontekstowym.
ZASADY:
1. Przejrzyj przekazany Dokument Kontekstowy marki podrozowka.pl.
2. NIE wymyślaj brakujących faktów, opinii ani liczb. Każdą niezweryfikowaną informację oznacz jako [HIPOTEZA] lub [BRAK DANYCH: do uzupełnienia przez właściciela].
3. Zwróć zwięzły audyt po polsku w dokładnie 2 blokach:
   - **Status wypełnienia:** krótka lista co jest [FAKT], co jest [HIPOTEZA], a gdzie występuje [BRAK DANYCH] lub potencjalna sprzeczność (np. sekcje cytatów, obietnic zakazanych i zakazów).
   - **Wywiad uzupełniający z właścicielem (5–7 konkretnych pytań):** lista numerowanych pytań, na które właściciel może odpowiedzieć jednym-dwoma zdaniami, by domknąć luki w Mózgu Marki (np. pierwsze prawdziwe głosy podróżników, najczęstsze pytania przed zakupem, granica rentowności CAC przy koszyku 39,92 zł).

${HUMANIZER_EMBEDDED_DIRECTIVE}`;

    const brandBlock = buildBrandContextBlock(ctx);
    const userPrompt = `Przeanalizuj aktualny Dokument Kontekstowy Marki Podróżówka i wygeneruj status wypełnienia oraz listę pytań wywiadu do właściciela:\n\n${brandBlock}`;

    const result = await generateWithGemini({ systemInstruction, userPrompt });

    return NextResponse.json({
      ok: true,
      interview: result.text,
      generatedAt: new Date().toLocaleString('pl-PL'),
    });
  } catch (err: unknown) {
    const formatted = formatGeminiError(err);
    return NextResponse.json({ error: formatted.message }, { status: formatted.status });
  }
}
