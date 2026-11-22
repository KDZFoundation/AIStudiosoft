import { NextRequest, NextResponse } from 'next/server';
import firebaseConfig from '@/firebase-applet-config.json';

const ACTIVE_PROJECT_ID = firebaseConfig.projectId || 'podrozowka-production';

export interface Ga4PropertyItem {
  propertyId: string;
  displayName: string;
  accountName: string;
}

interface AccountSummaryResponse {
  accountSummaries?: Array<{
    displayName?: string;
    propertySummaries?: Array<{
      property?: string;
      displayName?: string;
      propertyType?: string;
    }>;
  }>;
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Brak tokenu autoryzacji Google Analytics.' },
      { status: 401 }
    );
  }

  try {
    const res = await fetch(
      'https://analyticsadmin.googleapis.com/v1beta/accountSummaries?pageSize=100',
      {
        headers: {
          Authorization: authHeader,
        },
        cache: 'no-store',
      }
    );

    const rawText = await res.text();
    let data: AccountSummaryResponse = {};
    try {
      data = JSON.parse(rawText) as AccountSummaryResponse;
    } catch {
      return NextResponse.json(
        {
          error: `Nieoczekiwana odpowiedź Google Analytics Admin API (HTTP ${res.status}).`,
        },
        { status: res.status || 502 }
      );
    }

    if (!res.ok) {
      const msg = data.error?.message || `Błąd Google Analytics Admin API (${res.status})`;
      const apiDisabled =
        res.status === 403 &&
        (msg.toLowerCase().includes('disabled') ||
          msg.toLowerCase().includes('has not been used'));

      return NextResponse.json(
        {
          error: apiDisabled
            ? `W projekcie Google Cloud „${ACTIVE_PROJECT_ID}” nie jest jeszcze włączone Google Analytics Admin API. Włącz je poniżej albo wpisz numeryczne Property ID produkcyjnej usługi podrozowka.pl ręcznie.`
            : msg,
          rawError: msg,
          apiNotEnabled: apiDisabled,
          enableUrl: apiDisabled
            ? `https://console.cloud.google.com/apis/library/analyticsadmin.googleapis.com?project=${encodeURIComponent(
                ACTIVE_PROJECT_ID
              )}`
            : undefined,
        },
        { status: res.status }
      );
    }

    const properties: Ga4PropertyItem[] = [];
    for (const acc of data.accountSummaries ?? []) {
      const accountName = acc.displayName || 'Konto Google Analytics';
      for (const prop of acc.propertySummaries ?? []) {
        const rawId = prop.property || '';
        const propertyId = rawId.replace(/^properties\//, '');
        if (!propertyId) continue;
        properties.push({
          propertyId,
          displayName: prop.displayName || `Property ${propertyId}`,
          accountName,
        });
      }
    }

    const rankProperty = (item: Ga4PropertyItem): number => {
      const label = `${item.displayName} ${item.accountName}`.toLowerCase();
      const isTest = label.includes('test') || label.includes('dev') || label.includes('staging');
      const isProd =
        label.includes('production') || label.includes('podrozowka.pl') || label.includes('prod');
      const isPodroz = label.includes('podroz');
      if (isProd && isPodroz && !isTest) return 0;
      if (isPodroz && !isTest) return 1;
      if (isPodroz) return 2;
      return 3;
    };

    properties.sort((a, b) => {
      const diff = rankProperty(a) - rankProperty(b);
      if (diff !== 0) return diff;
      return a.displayName.localeCompare(b.displayName, 'pl');
    });

    return NextResponse.json({ properties });
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : 'Nie udało się połączyć z Google Analytics Admin API.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
