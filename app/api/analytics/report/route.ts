import { NextRequest, NextResponse } from 'next/server';
import firebaseConfig from '@/firebase-applet-config.json';

const ACTIVE_PROJECT_ID = firebaseConfig.projectId || 'podrozowka-production';

export interface Ga4SourceRow {
  source: string;
  medium: string;
  campaign: string;
  sessions: number;
  engagedSessions: number;
  purchases: number;
}

export interface Ga4PageRow {
  path: string;
  views: number;
  sessions: number;
  avgDurationSec: number;
}

export interface Ga4EventRow {
  eventName: string;
  count: number;
  users: number;
}

export interface Ga4DeviceRow {
  device: string;
  sessions: number;
  purchases: number;
}

export interface Ga4CountryRow {
  country: string;
  users: number;
  sessions: number;
}

export interface Ga4ReportPayload {
  propertyId: string;
  days: number;
  fetchedAt: string;
  realtimeActiveUsers: number | null;
  overview: {
    sessions: number;
    totalUsers: number;
    screenPageViews: number;
    engagedSessions: number;
    engagementRate: number;
    bounceRate: number;
    purchases: number;
    revenue: number;
  };
  funnelEvents: Ga4EventRow[];
  sources: Ga4SourceRow[];
  topPages: Ga4PageRow[];
  devices: Ga4DeviceRow[];
  countries: Ga4CountryRow[];
  summaryForAgent: string;
}

interface RunReportResponse {
  rows?: Array<{
    dimensionValues?: Array<{ value?: string }>;
    metricValues?: Array<{ value?: string }>;
  }>;
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
}

async function runGa4Report(
  propertyId: string,
  authHeader: string,
  body: Record<string, unknown>
): Promise<RunReportResponse> {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(
      propertyId
    )}:runReport`,
    {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    }
  );
  const rawText = await res.text();
  let data: RunReportResponse = {};
  try {
    data = JSON.parse(rawText) as RunReportResponse;
  } catch {
    const err = new Error(
      `Nieoczekiwana odpowiedź Google Analytics Data API (HTTP ${res.status}).`
    ) as Error & { status?: number };
    err.status = res.status || 502;
    throw err;
  }
  if (!res.ok) {
    const rawMsg = data.error?.message || `Błąd Google Analytics Data API (${res.status})`;
    const apiDisabled =
      res.status === 403 &&
      (rawMsg.toLowerCase().includes('disabled') ||
        rawMsg.toLowerCase().includes('has not been used'));
    const msg = apiDisabled
      ? `W projekcie Google Cloud „${ACTIVE_PROJECT_ID}” nie jest jeszcze włączone Google Analytics Data API. Włącz je w Google Cloud Console, odczekaj ok. 30 sekund i kliknij Odśwież.`
      : rawMsg;
    const err = new Error(msg) as Error & { status?: number; apiNotEnabled?: boolean };
    err.status = res.status;
    err.apiNotEnabled = apiDisabled;
    throw err;
  }
  return data;
}

async function runGa4Realtime(
  propertyId: string,
  authHeader: string
): Promise<number | null> {
  try {
    const res = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(
        propertyId
      )}:runRealtimeReport`,
      {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics: [{ name: 'activeUsers' }],
        }),
        cache: 'no-store',
      }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as RunReportResponse;
    return Number(data.rows?.[0]?.metricValues?.[0]?.value ?? 0);
  } catch {
    return null;
  }
}

function num(val?: string): number {
  const n = Number(val ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Brak tokenu autoryzacji Google Analytics.' },
      { status: 401 }
    );
  }

  try {
    const body = (await req.json()) as { propertyId?: string; days?: number };
    const propertyId = (body.propertyId || '').trim().replace(/^properties\//, '');
    const days = [7, 28, 90].includes(Number(body.days)) ? Number(body.days) : 28;

    if (!propertyId || !/^\d+$/.test(propertyId)) {
      return NextResponse.json(
        { error: 'Podaj prawidłowe numeryczne ID usługi GA4 (Property ID).' },
        { status: 400 }
      );
    }

    const dateRanges = [{ startDate: `${days}daysAgo`, endDate: 'today' }];

    const [
      overviewRes,
      eventsRes,
      sourcesRes,
      pagesRes,
      devicesRes,
      countriesRes,
      realtimeUsers,
    ] = await Promise.all([
      runGa4Report(propertyId, authHeader, {
        dateRanges,
        metrics: [
          { name: 'sessions' },
          { name: 'totalUsers' },
          { name: 'screenPageViews' },
          { name: 'engagedSessions' },
          { name: 'engagementRate' },
          { name: 'bounceRate' },
          { name: 'ecommercePurchases' },
          { name: 'purchaseRevenue' },
        ],
      }),
      runGa4Report(propertyId, authHeader, {
        dateRanges,
        dimensions: [{ name: 'eventName' }],
        metrics: [{ name: 'eventCount' }, { name: 'totalUsers' }],
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
        limit: 25,
      }),
      runGa4Report(propertyId, authHeader, {
        dateRanges,
        dimensions: [
          { name: 'sessionSource' },
          { name: 'sessionMedium' },
          { name: 'sessionCampaignName' },
        ],
        metrics: [
          { name: 'sessions' },
          { name: 'engagedSessions' },
          { name: 'ecommercePurchases' },
        ],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 12,
      }),
      runGa4Report(propertyId, authHeader, {
        dateRanges,
        dimensions: [{ name: 'pagePath' }],
        metrics: [
          { name: 'screenPageViews' },
          { name: 'sessions' },
          { name: 'averageSessionDuration' },
        ],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 12,
      }),
      runGa4Report(propertyId, authHeader, {
        dateRanges,
        dimensions: [{ name: 'deviceCategory' }],
        metrics: [{ name: 'sessions' }, { name: 'ecommercePurchases' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      }),
      runGa4Report(propertyId, authHeader, {
        dateRanges,
        dimensions: [{ name: 'country' }],
        metrics: [{ name: 'totalUsers' }, { name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 8,
      }),
      runGa4Realtime(propertyId, authHeader),
    ]);

    const ovRow = overviewRes.rows?.[0]?.metricValues ?? [];
    const overview = {
      sessions: num(ovRow[0]?.value),
      totalUsers: num(ovRow[1]?.value),
      screenPageViews: num(ovRow[2]?.value),
      engagedSessions: num(ovRow[3]?.value),
      engagementRate: Math.round(num(ovRow[4]?.value) * 1000) / 10,
      bounceRate: Math.round(num(ovRow[5]?.value) * 1000) / 10,
      purchases: num(ovRow[6]?.value),
      revenue: Math.round(num(ovRow[7]?.value) * 100) / 100,
    };

    const funnelEvents: Ga4EventRow[] = (eventsRes.rows ?? []).map((r) => ({
      eventName: r.dimensionValues?.[0]?.value || '(unknown)',
      count: num(r.metricValues?.[0]?.value),
      users: num(r.metricValues?.[1]?.value),
    }));

    const sources: Ga4SourceRow[] = (sourcesRes.rows ?? []).map((r) => ({
      source: r.dimensionValues?.[0]?.value || '(direct)',
      medium: r.dimensionValues?.[1]?.value || '(none)',
      campaign: r.dimensionValues?.[2]?.value || '(not set)',
      sessions: num(r.metricValues?.[0]?.value),
      engagedSessions: num(r.metricValues?.[1]?.value),
      purchases: num(r.metricValues?.[2]?.value),
    }));

    const topPages: Ga4PageRow[] = (pagesRes.rows ?? []).map((r) => ({
      path: r.dimensionValues?.[0]?.value || '/',
      views: num(r.metricValues?.[0]?.value),
      sessions: num(r.metricValues?.[1]?.value),
      avgDurationSec: Math.round(num(r.metricValues?.[2]?.value)),
    }));

    const devices: Ga4DeviceRow[] = (devicesRes.rows ?? []).map((r) => ({
      device: r.dimensionValues?.[0]?.value || 'unknown',
      sessions: num(r.metricValues?.[0]?.value),
      purchases: num(r.metricValues?.[1]?.value),
    }));

    const countries: Ga4CountryRow[] = (countriesRes.rows ?? []).map((r) => ({
      country: r.dimensionValues?.[0]?.value || 'Unknown',
      users: num(r.metricValues?.[0]?.value),
      sessions: num(r.metricValues?.[1]?.value),
    }));

    const eventLookup = (name: string) =>
      funnelEvents.find((e) => e.eventName === name)?.count ?? 0;

    const summaryLines = [
      `DANE NA ŻYWO Z GOOGLE ANALYTICS 4 (Property ID: ${propertyId}, okres: ostatnie ${days} dni):`,
      `- Sesje: ${overview.sessions} | Użytkownicy: ${overview.totalUsers} | Odsłony: ${overview.screenPageViews}`,
      `- Sesje z zaangażowaniem: ${overview.engagedSessions} (${overview.engagementRate}%) | Współczynnik odrzuceń: ${overview.bounceRate}%`,
      `- Zakupy e-commerce (purchase): ${overview.purchases} | Przychód: ${overview.revenue.toFixed(2)} zł`,
      `- Aktywni teraz (30 min): ${realtimeUsers ?? 'brak danych'}`,
      ``,
      `LEJEK ZDARZEŃ GA4:`,
      `- page_view: ${eventLookup('page_view')}`,
      `- view_item: ${eventLookup('view_item')}`,
      `- add_to_cart: ${eventLookup('add_to_cart')}`,
      `- begin_checkout: ${eventLookup('begin_checkout')}`,
      `- purchase: ${eventLookup('purchase')}`,
      ``,
      `ŹRÓDŁA RUCHU I UTM (TOP):`,
      ...sources
        .slice(0, 8)
        .map(
          (s) =>
            `- ${s.source} / ${s.medium} (kampania: ${s.campaign}): ${s.sessions} sesji, ${s.engagedSessions} zaangażowanych, ${s.purchases} zakupów`
        ),
      ``,
      `URZĄDZENIA:`,
      ...devices.map(
        (d) => `- ${d.device}: ${d.sessions} sesji, ${d.purchases} zakupów`
      ),
      ``,
      `TOP PODSTRONY:`,
      ...topPages
        .slice(0, 8)
        .map(
          (p) =>
            `- ${p.path}: ${p.views} odsłon (${p.sessions} sesji, śr. ${p.avgDurationSec}s)`
        ),
    ];

    const payload: Ga4ReportPayload = {
      propertyId,
      days,
      fetchedAt: new Date().toISOString(),
      realtimeActiveUsers: realtimeUsers,
      overview,
      funnelEvents,
      sources,
      topPages,
      devices,
      countries,
      summaryForAgent: summaryLines.join('\n'),
    };

    return NextResponse.json(payload);
  } catch (err: unknown) {
    const status =
      typeof err === 'object' && err !== null && 'status' in err
        ? Number((err as { status?: number }).status) || 500
        : 500;
    const apiNotEnabled =
      typeof err === 'object' && err !== null && 'apiNotEnabled' in err
        ? Boolean((err as { apiNotEnabled?: boolean }).apiNotEnabled)
        : false;
    const message =
      err instanceof Error
        ? err.message
        : 'Nie udało się pobrać raportu Google Analytics 4.';
    return NextResponse.json(
      {
        error: message,
        apiNotEnabled,
        enableUrl: apiNotEnabled
          ? `https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com?project=${encodeURIComponent(
              ACTIVE_PROJECT_ID
            )}`
          : undefined,
      },
      { status }
    );
  }
}
