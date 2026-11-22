'use client';

import { useCallback, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  LogOut,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import {
  getGoogleAccessToken,
  googleSignIn,
  googleSignOut,
  initGoogleAuth,
} from '@/lib/google-auth';
import type { GoogleAdsCustomerItem } from '@/app/api/google-ads/customers/route';
import type { GoogleAdsReportPayload } from '@/app/api/google-ads/report/route';

interface GoogleAdsPanelProps {
  onSendReportToAgent: (summaryForAgent: string) => void;
}

export default function GoogleAdsPanel({ onSendReportToAgent }: GoogleAdsPanelProps) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(() =>
    getGoogleAccessToken()
  );
  const [customers, setCustomers] = useState<GoogleAdsCustomerItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [manualCustomerId, setManualCustomerId] = useState<string>('');
  const [loginCustomerId, setLoginCustomerId] = useState<string>('');
  const [days, setDays] = useState<7 | 14 | 30>(30);
  const [report, setReport] = useState<GoogleAdsReportPayload | null>(null);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [enableApiUrl, setEnableApiUrl] = useState<string | null>(null);

  const loadCustomers = useCallback(async (token: string, mccId: string) => {
    setLoadingCustomers(true);
    setErrorMsg(null);
    setEnableApiUrl(null);
    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
      };
      const cleanMcc = mccId.replaceAll('-', '').trim();
      if (cleanMcc) {
        headers['x-login-customer-id'] = cleanMcc;
      }

      const res = await fetch('/api/google-ads/customers', {
        headers,
        cache: 'no-store',
      });
      const data = (await res.json()) as {
        customers?: GoogleAdsCustomerItem[];
        error?: string;
        enableUrl?: string;
        apiCenterUrl?: string;
      };

      if (res.ok && data.customers) {
        setCustomers(data.customers);
        const preferred =
          data.customers.find((c) => !c.manager) ?? data.customers[0];
        if (preferred) {
          setSelectedCustomerId((prev) => prev || preferred.customerId);
        }
        return;
      }

      if (data.enableUrl) setEnableApiUrl(data.enableUrl);
      setErrorMsg(
        data.error ||
          'Nie udało się pobrać listy kont Google Ads. Sprawdź uprawnienia lub wpisz Customer ID ręcznie.'
      );
    } catch {
      setErrorMsg(
        'Błąd połączenia podczas pobierania listy kont Google Ads.'
      );
    } finally {
      setLoadingCustomers(false);
    }
  }, []);

  const loadReport = useCallback(
    async (
      token: string,
      customerId: string,
      mccId: string,
      rangeDays: number,
      currencyCode: string
    ) => {
      const cleanId = customerId.replaceAll('-', '').trim();
      if (!/^\d{8,12}$/.test(cleanId)) return;

      setLoadingReport(true);
      setErrorMsg(null);
      setEnableApiUrl(null);

      try {
        const res = await fetch('/api/google-ads/report', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerId: cleanId,
            loginCustomerId: mccId.replaceAll('-', '').trim() || undefined,
            currencyCode,
            days: rangeDays,
          }),
        });
        const data = (await res.json()) as GoogleAdsReportPayload & {
          error?: string;
          enableUrl?: string;
        };

        if (!res.ok) {
          if (data.enableUrl) setEnableApiUrl(data.enableUrl);
          throw new Error(data.error || 'Błąd pobierania raportu Google Ads.');
        }

        setReport(data);
      } catch (err: unknown) {
        setErrorMsg(
          err instanceof Error
            ? err.message
            : 'Nie udało się pobrać raportu kampanii Google Ads.'
        );
      } finally {
        setLoadingReport(false);
      }
    },
    []
  );

  useEffect(() => {
    const unsub = initGoogleAuth(
      (authedUser, token) => {
        setUser(authedUser);
        setAccessToken(token);
      },
      (maybeUser) => {
        setUser(maybeUser);
        setAccessToken(null);
      }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    let active = true;
    (async () => {
      await loadCustomers(accessToken, '');
      if (!active) return;
    })();
    return () => {
      active = false;
    };
  }, [accessToken, loadCustomers]);

  const selectedCustomerObj = customers.find(
    (c) => c.customerId === selectedCustomerId
  );
  const activeCurrency = selectedCustomerObj?.currencyCode || 'PLN';

  useEffect(() => {
    if (!accessToken || !selectedCustomerId) return;
    let active = true;
    (async () => {
      await loadReport(
        accessToken,
        selectedCustomerId,
        loginCustomerId,
        days,
        activeCurrency
      );
      if (!active) return;
    })();
    return () => {
      active = false;
    };
  }, [accessToken, selectedCustomerId, loginCustomerId, days, activeCurrency, loadReport]);

  const handleSignIn = async () => {
    setErrorMsg(null);
    setEnableApiUrl(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
      }
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Logowanie Google zostało przerwane.'
      );
    }
  };

  const handleSignOut = async () => {
    await googleSignOut();
    setUser(null);
    setAccessToken(null);
    setCustomers([]);
    setSelectedCustomerId('');
    setReport(null);
  };

  const handleApplyManualCustomer = () => {
    const cleaned = manualCustomerId.replaceAll('-', '').trim();
    if (!/^\d{8,12}$/.test(cleaned)) {
      setErrorMsg('Podaj prawidłowe 10-cyfrowe Customer ID konta Google Ads (np. 123-456-7890).');
      return;
    }
    setSelectedCustomerId(cleaned);
  };

  return (
    <div className="space-y-6">
      {/* Header + Auth Controls */}
      <section className="bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#121926]">
              Google Ads · Połączenie konta i raport kampanii (API v26)
            </h2>
            <p className="text-sm text-[#414751] mt-1">
              Odczyt kampanii, wydatków, CPC i konwersji z pełną zasadą Human-in-the-loop (tylko odczyt i rekomendacje bez automatycznego wydawania budżetu).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {accessToken ? (
              <>
                {user?.email && (
                  <span className="text-xs font-medium text-[#646A75] px-2">
                    {user.email}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() =>
                    selectedCustomerId
                      ? loadReport(
                          accessToken,
                          selectedCustomerId,
                          loginCustomerId,
                          days,
                          activeCurrency
                        )
                      : loadCustomers(accessToken, loginCustomerId)
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#121926] bg-[#FAF6EA] hover:bg-[#FFF2CC] border border-[#E8E1D3] rounded-full transition-colors whitespace-nowrap shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Odśwież</span>
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#121926] bg-[#FAF6EA] hover:bg-[#FFF2CC] border border-[#E8E1D3] rounded-full transition-colors whitespace-nowrap shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Wyloguj</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleSignIn}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-[#121926] bg-[#FFBF00] hover:bg-[#F0B200] rounded-full transition-colors whitespace-nowrap shrink-0"
              >
                <TrendingUp className="w-4 h-4" />
                <span>Zaloguj przez Google (Google Ads)</span>
              </button>
            )}
          </div>
        </div>

        {/* Account Selector + Period */}
        {accessToken && (
          <div className="flex flex-wrap items-end justify-between gap-4 pt-4 border-t border-[#F1ECE1]">
            <div className="flex flex-wrap items-end gap-3">
              {customers.length > 0 && (
                <div>
                  <label className="block text-[11px] font-semibold text-[#646A75] mb-1">
                    Konto Google Ads ({customers.length})
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    disabled={loadingCustomers}
                    className="rounded-xl border border-[#E8E1D3] bg-[#FAF6EA] px-3 py-2 text-xs font-medium text-[#121926] min-w-[260px] focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
                  >
                    {customers.map((c) => (
                      <option key={c.customerId} value={c.customerId}>
                        {c.descriptiveName} ({c.customerId})
                        {c.manager ? ' [MCC]' : ` · ${c.currencyCode}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-[#646A75] mb-1">
                  Customer ID ręcznie
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={manualCustomerId}
                    onChange={(e) => setManualCustomerId(e.target.value)}
                    placeholder="np. 123-456-7890"
                    className="rounded-xl border border-[#E8E1D3] bg-[#FAF6EA] px-3 py-2 text-xs font-mono text-[#121926] w-36 focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyManualCustomer}
                    className="px-3.5 py-2 text-xs font-medium text-[#121926] bg-[#FAF6EA] hover:bg-[#FFF2CC] border border-[#E8E1D3] rounded-full transition-colors whitespace-nowrap shrink-0"
                  >
                    Wczytaj ID
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#646A75] mb-1">
                  Manager ID / MCC (opcjonalnie)
                </label>
                <input
                  type="text"
                  value={loginCustomerId}
                  onChange={(e) => setLoginCustomerId(e.target.value)}
                  placeholder="np. 987-654-3210"
                  className="rounded-xl border border-[#E8E1D3] bg-[#FAF6EA] px-3 py-2 text-xs font-mono text-[#121926] w-36 focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
                />
              </div>
            </div>

            <div className="flex items-center gap-1 p-1 bg-[#FAF6EA] border border-[#E8E1D3] rounded-full">
              {([7, 14, 30] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap shrink-0 ${
                    days === d
                      ? 'bg-[#FFBF00] text-[#121926] font-semibold'
                      : 'text-[#414751] hover:text-[#121926]'
                  }`}
                >
                  Ostatnie {d} dni
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {errorMsg && (
        <div className="bg-[#FFF8E1] border border-[#FDE68A] rounded-2xl p-4 text-xs text-[#78350F] space-y-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-[#B45309] mt-0.5" />
            <span>{errorMsg}</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 pt-1">
            {enableApiUrl && (
              <a
                href={enableApiUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 font-semibold text-[#5B2182] hover:text-[#3B0754] hover:underline"
              >
                <span>Sprawdź poziom dostępu Google Ads API w Google Cloud Console</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      )}

      {!accessToken ? (
        <div className="bg-white border border-[#E8E1D3] rounded-2xl p-8 text-center space-y-3">
          <p className="text-sm font-semibold text-[#121926]">
            Zaloguj się kontem Google powiązanym z Google Ads dla podrozowka.pl
          </p>
          <p className="text-xs text-[#414751] max-w-xl mx-auto leading-relaxed">
            Po autoryzacji jedno logowanie obsługuje jednocześnie Google Analytics 4 i Google Ads. Token dostępu działa wyłącznie w pamięci RAM bieżącej karty, a uprawnienia API kontrolowane są bezpośrednio przez projekt Google Cloud (poziom Explorer / Basic Access bez potrzeby tworzenia konta MCC dla tokena deweloperskiego).
          </p>
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5B2182] pt-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Tryb Human-in-the-loop: panel tylko raportuje dane i nie modyfikuje budżetu reklamowego</span>
          </div>
        </div>
      ) : loadingReport ? (
        <div className="bg-white border border-[#E8E1D3] rounded-2xl p-8 text-center text-xs text-[#646A75]">
          Pobieranie raportu kampanii Google Ads dla konta {selectedCustomerId}…
        </div>
      ) : report ? (
        <div className="space-y-6">
          {/* Action Banner */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-[#E8E1D3] rounded-2xl p-5">
            <div className="text-xs text-[#414751]">
              Konto <strong className="font-mono text-[#121926]">{report.customerId}</strong> · Okres:{' '}
              <strong>{report.days} dni</strong> · Waluta:{' '}
              <strong className="font-mono text-[#121926]">{report.currencyCode}</strong>
            </div>
            <button
              type="button"
              onClick={() => onSendReportToAgent(report.summaryForAgent)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#121926] bg-[#FFBF00] hover:bg-[#F0B200] rounded-full transition-colors whitespace-nowrap shrink-0"
            >
              <span>Przekaż do Stratega Kampanii</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 4 KPI Strip */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#E8E1D3] rounded-2xl p-5 space-y-1">
              <p className="text-xs font-medium text-[#646A75]">Kliknięcia / Wyświetlenia</p>
              <p className="text-2xl font-bold font-mono tabular-nums text-[#121926]">
                {report.overview.clicks}{' '}
                <span className="text-sm font-normal text-[#646A75]">
                  / {report.overview.impressions}
                </span>
              </p>
              <p className="text-xs text-[#646A75] font-mono tabular-nums">
                CTR {report.overview.ctr}%
              </p>
            </div>

            <div className="bg-white border border-[#E8E1D3] rounded-2xl p-5 space-y-1">
              <p className="text-xs font-medium text-[#646A75]">Wydatki reklamowe</p>
              <p className="text-2xl font-bold font-mono tabular-nums text-[#121926]">
                {report.overview.cost.toFixed(2)} {report.currencyCode}
              </p>
              <p className="text-xs text-[#646A75] font-mono tabular-nums">
                Śr. CPC {report.overview.averageCpc.toFixed(2)} {report.currencyCode}
              </p>
            </div>

            <div className="bg-white border border-[#E8E1D3] rounded-2xl p-5 space-y-1">
              <p className="text-xs font-medium text-[#646A75]">Konwersje</p>
              <p className="text-2xl font-bold font-mono tabular-nums text-[#121926]">
                {report.overview.conversions}
              </p>
            </div>

            <div className="bg-white border border-[#E8E1D3] rounded-2xl p-5 space-y-1">
              <p className="text-xs font-medium text-[#646A75]">Wartość konwersji / ROAS</p>
              <p className="text-2xl font-bold font-mono tabular-nums text-[#121926]">
                {report.overview.conversionsValue.toFixed(2)} {report.currencyCode}
              </p>
              <p className="text-xs text-[#646A75] font-mono tabular-nums">
                ROAS {report.overview.roas}x
              </p>
            </div>
          </section>

          {/* Campaigns Table */}
          <section className="bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-4 overflow-x-auto">
            <h3 className="text-base font-semibold text-[#121926]">
              Kampanie w koncie ({report.campaigns.length})
            </h3>
            {report.campaigns.length === 0 ? (
              <p className="text-xs text-[#646A75]">
                Brak aktywnych ani wstrzymanych kampanii w ostatnich {report.days} dniach (status konta może być na etapie przygotowania; zob. Strateg Kampanii Readiness).
              </p>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="border-b border-[#E8E1D3] text-[#646A75]">
                  <tr>
                    <th className="py-2 pr-3 font-medium">Kampania</th>
                    <th className="py-2 pr-3 font-medium">Typ / Status</th>
                    <th className="py-2 px-2 font-medium text-right">Wyśw.</th>
                    <th className="py-2 px-2 font-medium text-right">Klik.</th>
                    <th className="py-2 px-2 font-medium text-right">CTR</th>
                    <th className="py-2 px-2 font-medium text-right">Koszt</th>
                    <th className="py-2 pl-2 font-medium text-right">Konwersje</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1ECE1]">
                  {report.campaigns.map((c) => (
                    <tr key={c.id || c.name}>
                      <td className="py-2.5 pr-3 font-medium text-[#121926]">{c.name}</td>
                      <td className="py-2.5 pr-3 text-[#646A75] font-mono">
                        {c.channelType} · {c.status}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono tabular-nums">
                        {c.impressions}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono tabular-nums">
                        {c.clicks}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono tabular-nums">
                        {c.ctr}%
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono tabular-nums">
                        {c.cost.toFixed(2)} {report.currencyCode}
                      </td>
                      <td className="py-2.5 pl-2 text-right font-mono tabular-nums font-semibold">
                        {c.conversions}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
