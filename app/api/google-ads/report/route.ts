import { NextRequest, NextResponse } from 'next/server';
import firebaseConfig from '@/firebase-applet-config.json';

const ACTIVE_PROJECT_ID = firebaseConfig.projectId || 'podrozowka-production';
const GOOGLE_ADS_API_VERSION = 'v26';

export interface GoogleAdsCampaignRow {
  id: string;
  name: string;
  status: string;
  channelType: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  conversionsValue: number;
  ctr: number;
  averageCpc: number;
}

export interface GoogleAdsReportPayload {
  customerId: string;
  days: number;
  currencyCode: string;
  overview: {
    impressions: number;
    clicks: number;
    cost: number;
    conversions: number;
    conversionsValue: number;
    ctr: number;
    averageCpc: number;
    roas: number;
  };
  campaigns: GoogleAdsCampaignRow[];
  summaryForAgent: string;
}

interface SearchCampaignRow {
  campaign?: {
    id?: string;
    name?: string;
    status?: string;
    advertisingChannelType?: string;
  };
  metrics?: {
    impressions?: string | number;
    clicks?: string | number;
    costMicros?: string | number;
    conversions?: number;
    conversionsValue?: number;
    ctr?: number;
    averageCpc?: number;
  };
}

interface SearchErrorResponse {
  error?: {
    message?: string;
    status?: string;
  };
}

function getOptionalDeveloperToken(): string | null {
  const token = process.env.GOOGLE_ADS_DEVELOPER_TOKEN?.trim();
  if (!token || token === 'MY_GOOGLE_ADS_DEVELOPER_TOKEN') return null;
  return token;
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Brak tokenu autoryzacji Google Ads.' },
      { status: 401 }
    );
  }

  const developerToken = getOptionalDeveloperToken();

  try {
    const body = (await req.json()) as {
      customerId?: string;
      loginCustomerId?: string;
      currencyCode?: string;
      days?: number;
    };

    const cleanCustomerId = (body.customerId || '').replaceAll('-', '').trim();
    if (!/^\d{8,12}$/.test(cleanCustomerId)) {
      return NextResponse.json(
        { error: 'Podaj prawidłowe 10-cyfrowe Customer ID konta Google Ads (np. 123-456-7890).' },
        { status: 400 }
      );
    }

    const days = body.days === 7 ? 7 : body.days === 14 ? 14 : 30;
    const dateRange =
      days === 7 ? 'LAST_7_DAYS' : days === 14 ? 'LAST_14_DAYS' : 'LAST_30_DAYS';
    const currencyCode = (body.currencyCode || 'PLN').trim() || 'PLN';

    const cleanLoginId = (
      body.loginCustomerId ||
      process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID ||
      ''
    )
      .replaceAll('-', '')
      .trim();

    const headers: Record<string, string> = {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    };
    if (developerToken) {
      headers['developer-token'] = developerToken;
    }
    if (cleanLoginId && /^\d{8,12}$/.test(cleanLoginId)) {
      headers['login-customer-id'] = cleanLoginId;
    }

    const gaql = `SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.conversions_value, metrics.ctr, metrics.average_cpc FROM campaign WHERE segments.date DURING ${dateRange} AND campaign.status != 'REMOVED' ORDER BY metrics.cost_micros DESC LIMIT 25`;

    const res = await fetch(
      `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${cleanCustomerId}/googleAds:search`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ query: gaql }),
        cache: 'no-store',
      }
    );

    const rawText = await res.text();
    let parsed: { results?: SearchCampaignRow[] } & SearchErrorResponse = {};
    try {
      parsed = JSON.parse(rawText) as { results?: SearchCampaignRow[] } & SearchErrorResponse;
    } catch {
      return NextResponse.json(
        { error: `Nieoczekiwana odpowiedź Google Ads API (HTTP ${res.status}).` },
        { status: res.status || 502 }
      );
    }

    if (!res.ok) {
      const msg = parsed.error?.message || `Błąd raportu Google Ads (${res.status})`;
      const lower = msg.toLowerCase();
      const apiDisabled =
        res.status === 403 &&
        (lower.includes('disabled') || lower.includes('has not been used'));
      const needsExplorer =
        res.status === 403 &&
        (lower.includes('test') ||
          lower.includes('access') ||
          lower.includes('permission') ||
          lower.includes('explorer') ||
          lower.includes('developer'));

      return NextResponse.json(
        {
          error: apiDisabled
            ? `Google Ads API nie jest włączone w projekcie „${ACTIVE_PROJECT_ID}”.`
            : needsExplorer
            ? `Aby pobierać dane z produkcyjnego konta Google Ads, włącz poziom „Explorer Access” w Google Cloud Console dla projektu „${ACTIVE_PROJECT_ID}” (nie wymaga już konta MCC ani Developer Tokena). Szczegóły Google: ${msg}`
            : msg,
          enableUrl: apiDisabled
            ? `https://console.cloud.google.com/apis/library/googleads.googleapis.com?project=${encodeURIComponent(
                ACTIVE_PROJECT_ID
              )}`
            : `https://console.cloud.google.com/apis/api/googleads.googleapis.com/overview?project=${encodeURIComponent(
                ACTIVE_PROJECT_ID
              )}`,
        },
        { status: res.status }
      );
    }

    const campaigns: GoogleAdsCampaignRow[] = (parsed.results ?? []).map((row) => {
      const impressions = Number(row.metrics?.impressions ?? 0);
      const clicks = Number(row.metrics?.clicks ?? 0);
      const cost = Number(row.metrics?.costMicros ?? 0) / 1_000_000;
      const conversions = Number(row.metrics?.conversions ?? 0);
      const conversionsValue = Number(row.metrics?.conversionsValue ?? 0);
      const ctr = Number(row.metrics?.ctr ?? 0) * 100;
      const averageCpc = Number(row.metrics?.averageCpc ?? 0) / 1_000_000;

      return {
        id: row.campaign?.id || '',
        name: row.campaign?.name || 'Kampania bez nazwy',
        status: row.campaign?.status || 'UNKNOWN',
        channelType: row.campaign?.advertisingChannelType || 'UNSPECIFIED',
        impressions,
        clicks,
        cost: Number(cost.toFixed(2)),
        conversions: Number(conversions.toFixed(2)),
        conversionsValue: Number(conversionsValue.toFixed(2)),
        ctr: Number(ctr.toFixed(2)),
        averageCpc: Number(averageCpc.toFixed(2)),
      };
    });

    const totals = campaigns.reduce(
      (acc, c) => {
        acc.impressions += c.impressions;
        acc.clicks += c.clicks;
        acc.cost += c.cost;
        acc.conversions += c.conversions;
        acc.conversionsValue += c.conversionsValue;
        return acc;
      },
      { impressions: 0, clicks: 0, cost: 0, conversions: 0, conversionsValue: 0 }
    );

    const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
    const averageCpc = totals.clicks > 0 ? totals.cost / totals.clicks : 0;
    const roas = totals.cost > 0 ? totals.conversionsValue / totals.cost : 0;

    const overview = {
      impressions: totals.impressions,
      clicks: totals.clicks,
      cost: Number(totals.cost.toFixed(2)),
      conversions: Number(totals.conversions.toFixed(2)),
      conversionsValue: Number(totals.conversionsValue.toFixed(2)),
      ctr: Number(ctr.toFixed(2)),
      averageCpc: Number(averageCpc.toFixed(2)),
      roas: Number(roas.toFixed(2)),
    };

    const campaignLines =
      campaigns.length > 0
        ? campaigns
            .slice(0, 12)
            .map(
              (c) =>
                `- ${c.name} [${c.channelType} · ${c.status}]: ${c.impressions} wyśw., ${c.clicks} klik. (CTR ${c.ctr}%), koszt ${c.cost.toFixed(
                  2
                )} ${currencyCode}, konwersje ${c.conversions}`
            )
            .join('\n')
        : '- Brak aktywnych ani wstrzymanych kampanii w wybranym okresie.';

    const summaryForAgent = [
      `RAPORT GOOGLE ADS NA ŻYWO [FAKT · Google Ads API v26] · Konto: ${cleanCustomerId} | Okres: ostatnie ${days} dni`,
      `Podsumowanie: ${overview.impressions} wyświetleń, ${overview.clicks} kliknięć (CTR ${overview.ctr}%), wydatek ${overview.cost.toFixed(
        2
      )} ${currencyCode}, śr. CPC ${overview.averageCpc.toFixed(2)} ${currencyCode}, konwersje ${
        overview.conversions
      }, wartość konwersji ${overview.conversionsValue.toFixed(2)} ${currencyCode}, ROAS ${
        overview.roas
      }x`,
      `Kampanie:\n${campaignLines}`,
    ].join('\n');

    const payload: GoogleAdsReportPayload = {
      customerId: cleanCustomerId,
      days,
      currencyCode,
      overview,
      campaigns,
      summaryForAgent,
    };

    return NextResponse.json(payload);
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : 'Nie udało się pobrać raportu Google Ads.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
