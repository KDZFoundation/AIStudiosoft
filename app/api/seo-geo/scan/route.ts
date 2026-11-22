import { NextResponse } from 'next/server';
import { lintPodrozowkaCopy } from '@/lib/lint-copy';
import {
  RobotsTxtSummary,
  SeoGeoAuditSnapshot,
  SeoGeoFactMatch,
  SeoGeoPageScan,
  SitemapSummary,
} from '@/lib/seo-geo';

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripTags(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  );
}

function extractMetaTag(html: string, attrName: 'name' | 'property', key: string): string {
  const regex1 = new RegExp(
    `<meta[^>]*${attrName}=["']${key}["'][^>]*content=["']([^"']*)["'][^>]*>`,
    'i'
  );
  const regex2 = new RegExp(
    `<meta[^>]*content=["']([^"']*)["'][^>]*${attrName}=["']${key}["'][^>]*>`,
    'i'
  );
  const match = html.match(regex1) || html.match(regex2);
  return match?.[1] ? decodeHtmlEntities(match[1]) : '';
}

function extractJsonLdTypes(html: string): string[] {
  const types = new Set<string>();
  const matches = html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );
  for (const m of matches) {
    try {
      const parsed = JSON.parse(m[1].trim()) as Record<string, unknown>;
      const collect = (node: unknown) => {
        if (!node || typeof node !== 'object') return;
        if (Array.isArray(node)) {
          node.forEach(collect);
          return;
        }
        const obj = node as Record<string, unknown>;
        const rawType = obj['@type'];
        if (typeof rawType === 'string') {
          types.add(rawType);
        } else if (Array.isArray(rawType)) {
          rawType.forEach((t) => typeof t === 'string' && types.add(t));
        }
        if (Array.isArray(obj['@graph'])) {
          obj['@graph'].forEach(collect);
        }
      };
      collect(parsed);
    } catch {
      types.add('Niepoprawny JSON-LD');
    }
  }
  return Array.from(types);
}

async function fetchWithTimeout(url: string, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      headers: {
        'User-Agent': 'Podrozowka-SEO-GEO-Audit/1.0 (compatible; Googlebot/2.1)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      cache: 'no-store',
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function scanPage(url: string, label: string): Promise<SeoGeoPageScan> {
  try {
    const res = await fetchWithTimeout(url);
    const html = await res.text();
    const visibleText = stripTags(html);

    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch?.[1] ? decodeHtmlEntities(titleMatch[1]) : '';
    const metaDescription = extractMetaTag(html, 'name', 'description');
    const canonicalMatch = html.match(
      /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i
    );
    const canonical = canonicalMatch?.[1]?.trim() || '';
    const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const h1 = h1Match?.[1] ? stripTags(h1Match[1]) : '';

    const ogTitle = extractMetaTag(html, 'property', 'og:title');
    const ogDescription = extractMetaTag(html, 'property', 'og:description');
    const ogImage = extractMetaTag(html, 'property', 'og:image');
    const schemaTypes = extractJsonLdTypes(html);

    const lowerVisible = visibleText.toLowerCase();
    const lowerHtml = html.toLowerCase();
    const haystack = `${lowerVisible} ${lowerHtml}`;

    const needles: Array<{ label: string; needle: string }> = [
      { label: 'Cena jednostkowa (4,99 zł)', needle: '4,99' },
      { label: 'Pakiet bazowy (39,92 zł / 8 szt.)', needle: '39,92' },
      { label: 'Pojęcie „odwrócona pocztówka” / Podróżówka', needle: 'pocztówk' },
      { label: 'Języki / podziękowanie w języku kraju (89+)', needle: 'język' },
      { label: 'Zasięg (105+ krajów)', needle: '105' },
      { label: 'Kod QR na rewersie', needle: 'qr' },
      { label: 'Dostawa PL (ORLEN Paczka / InPost)', needle: 'orlen' },
    ];

    const factMatches: SeoGeoFactMatch[] = needles.map((item) => ({
      label: item.label,
      needle: item.needle,
      foundInRawHtml:
        haystack.includes(item.needle) ||
        (item.needle === '4,99' && haystack.includes('4.99')) ||
        (item.needle === '39,92' && haystack.includes('39.92')),
    }));

    const brandBanWarnings = lintPodrozowkaCopy(visibleText, { allowShippingPrices: true });

    return {
      url,
      label,
      httpStatus: res.status,
      ok: res.ok,
      title,
      metaDescription,
      canonical,
      h1,
      ogTitle,
      ogDescription,
      ogImage,
      schemaTypes,
      rawTextChars: visibleText.length,
      looksLikeEmptySpaShell: visibleText.length < 220,
      factMatches,
      brandBanWarnings,
    };
  } catch (err) {
    return {
      url,
      label,
      httpStatus: 0,
      ok: false,
      title: '',
      metaDescription: '',
      canonical: '',
      h1: '',
      ogTitle: '',
      ogDescription: '',
      ogImage: '',
      schemaTypes: [],
      rawTextChars: 0,
      looksLikeEmptySpaShell: true,
      factMatches: [],
      brandBanWarnings: [],
      error: err instanceof Error ? err.message : 'Błąd pobierania strony',
    };
  }
}

async function scanRobots(): Promise<RobotsTxtSummary> {
  const url = 'https://podrozowka.pl/robots.txt';
  try {
    const res = await fetchWithTimeout(url);
    const text = res.ok ? await res.text() : '';
    const lower = text.toLowerCase();
    const aiBots = ['gptbot', 'oai-searchbot', 'perplexitybot', 'claudebot', 'google-extended'];
    const blocksAiCrawlers: string[] = [];

    for (const bot of aiBots) {
      const idx = lower.indexOf(`user-agent: ${bot}`);
      if (idx !== -1) {
        const blockSlice = lower.slice(idx, idx + 180);
        if (/disallow:\s*\//i.test(blockSlice)) {
          blocksAiCrawlers.push(bot);
        }
      }
    }

    const blocksGooglebot =
      /user-agent:\s*(\*|googlebot)[\s\S]{0,120}disallow:\s*\/\s*$/im.test(text);

    return {
      url,
      httpStatus: res.status,
      found: res.ok && text.trim().length > 0,
      blocksGooglebot,
      blocksAiCrawlers,
      hasSitemapDirective: /sitemap:/i.test(text),
      excerpt: text.trim().slice(0, 600),
    };
  } catch {
    return {
      url,
      httpStatus: 0,
      found: false,
      blocksGooglebot: false,
      blocksAiCrawlers: [],
      hasSitemapDirective: false,
      excerpt: '',
    };
  }
}

async function scanSitemap(): Promise<SitemapSummary> {
  const url = 'https://podrozowka.pl/sitemap.xml';
  try {
    const res = await fetchWithTimeout(url);
    const text = res.ok ? await res.text() : '';
    const locs = Array.from(text.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)).map((m) =>
      m[1].trim()
    );
    return {
      url,
      httpStatus: res.status,
      found: res.ok && locs.length > 0,
      urlCount: locs.length,
      sampleUrls: locs.slice(0, 8),
    };
  } catch {
    return {
      url,
      httpStatus: 0,
      found: false,
      urlCount: 0,
      sampleUrls: [],
    };
  }
}

export async function GET() {
  try {
    const [homeScan, shopScan, robots, sitemap] = await Promise.all([
      scanPage('https://podrozowka.pl/', 'Strona główna (/)'),
      scanPage('https://podrozowka.pl/sklep', 'Sklep (/sklep)'),
      scanRobots(),
      scanSitemap(),
    ]);

    const snapshot: SeoGeoAuditSnapshot = {
      scannedAt: new Date().toLocaleString('pl-PL'),
      pages: [homeScan, shopScan],
      robots,
      sitemap,
    };

    return NextResponse.json({ ok: true, snapshot });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : 'Nie udało się przeprowadzić audytu SEO/GEO podrozowka.pl.',
      },
      { status: 500 }
    );
  }
}
