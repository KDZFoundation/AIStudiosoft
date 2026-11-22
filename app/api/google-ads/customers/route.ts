import { NextRequest, NextResponse } from 'next/server';
import firebaseConfig from '@/firebase-applet-config.json';

const ACTIVE_PROJECT_ID = firebaseConfig.projectId || 'podrozowka-production';
const GOOGLE_ADS_API_VERSION = 'v26';

export interface GoogleAdsCustomerItem {
  customerId: string;
  descriptiveName: string;
  currencyCode: string;
  manager: boolean;
}

interface ListAccessibleResponse {
  resourceNames?: string[];
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
}

interface SearchRow {
  customer?: {
    id?: string;
    descriptiveName?: string;
    currencyCode?: string;
    manager?: boolean;
  };
}

function getOptionalDeveloperToken(): string | null {
  const token = process.env.GOOGLE_ADS_DEVELOPER_TOKEN?.trim();
  if (!token || token === 'MY_GOOGLE_ADS_DEVELOPER_TOKEN') return null;
  return token;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Brak tokenu autoryzacji Google Ads.' },
      { status: 401 }
    );
  }

  const developerToken = getOptionalDeveloperToken();
  const loginCustomerId = (
    req.headers.get('x-login-customer-id') ||
    process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID ||
    ''
  )
    .replaceAll('-', '')
    .trim();

  const baseHeaders: Record<string, string> = {
    Authorization: authHeader,
  };
  if (developerToken) {
    baseHeaders['developer-token'] = developerToken;
  }

  try {
    const res = await fetch(
      `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers:listAccessibleCustomers`,
      {
        headers: baseHeaders,
        cache: 'no-store',
      }
    );

    const rawText = await res.text();
    let data: ListAccessibleResponse = {};
    try {
      data = JSON.parse(rawText) as ListAccessibleResponse;
    } catch {
      return NextResponse.json(
        {
          error: `Nieoczekiwana odpowiedź Google Ads API (HTTP ${res.status}).`,
        },
        { status: res.status || 502 }
      );
    }

    if (!res.ok) {
      const msg = data.error?.message || `Błąd Google Ads API (${res.status})`;
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
            ? `W projekcie Google Cloud „${ACTIVE_PROJECT_ID}” usługa Google Ads API jest wyłączona.`
            : needsExplorer
            ? `Połączenie Google Ads wymaga włączenia poziomu „Explorer Access” (lub Basic Access) na stronie Google Ads API w projekcie Google Cloud „${ACTIVE_PROJECT_ID}”. Od września 2026 nie używa się już starego Developer Tokena z MCC. Szczegóły błędu Google: ${msg}`
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

    const ids = (data.resourceNames ?? [])
      .map((name) => name.replace(/^customers\//, '').trim())
      .filter((id) => /^\d+$/.test(id))
      .slice(0, 10);

    const customers: GoogleAdsCustomerItem[] = await Promise.all(
      ids.map(async (customerId) => {
        try {
          const headers: Record<string, string> = {
            ...baseHeaders,
            'Content-Type': 'application/json',
          };
          if (loginCustomerId && /^\d+$/.test(loginCustomerId)) {
            headers['login-customer-id'] = loginCustomerId;
          }
          const detailRes = await fetch(
            `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${customerId}/googleAds:search`,
            {
              method: 'POST',
              headers,
              body: JSON.stringify({
                query:
                  'SELECT customer.id, customer.descriptive_name, customer.currency_code, customer.manager FROM customer LIMIT 1',
              }),
              cache: 'no-store',
            }
          );
          if (!detailRes.ok) {
            return {
              customerId,
              descriptiveName: `Konto ${customerId}`,
              currencyCode: 'PLN',
              manager: false,
            };
          }
          const detailJson = (await detailRes.json()) as { results?: SearchRow[] };
          const row = detailJson.results?.[0]?.customer;
          return {
            customerId,
            descriptiveName: row?.descriptiveName || `Konto ${customerId}`,
            currencyCode: row?.currencyCode || 'PLN',
            manager: Boolean(row?.manager),
          };
        } catch {
          return {
            customerId,
            descriptiveName: `Konto ${customerId}`,
            currencyCode: 'PLN',
            manager: false,
          };
        }
      })
    );

    return NextResponse.json({ customers });
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : 'Nie udało się połączyć z Google Ads API.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
