'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Link2,
  LogOut,
  RefreshCw,
  Send,
} from 'lucide-react';
import { lintPodrozowkaCopy } from '@/lib/lint-copy';

interface FacebookPageInfo {
  id: string;
  name: string;
  category: string | null;
  pictureUrl: string | null;
}

interface FacebookStatusResponse {
  configured: boolean;
  connected: boolean;
  callbackUrl: string;
  userName?: string | null;
  selectedPageId: string | null;
  pages: FacebookPageInfo[];
}

interface FacebookPostItem {
  id: string;
  message: string;
  createdTime: string;
  permalinkUrl: string | null;
  reactions: number;
  comments: number;
  shares: number;
}

interface FacebookPanelProps {
  initialDraft?: string;
  initialUtmCampaign?: string;
  initialUtmContent?: string;
}

export default function FacebookPanel({
  initialDraft = '',
  initialUtmCampaign = 'odwrocona_pocztowka',
  initialUtmContent = 'post_organiczny',
}: FacebookPanelProps) {
  const [status, setStatus] = useState<FacebookStatusResponse | null>(null);
  const [posts, setPosts] = useState<FacebookPostItem[]>([]);
  const [message, setMessage] = useState(initialDraft);
  const [utmCampaign, setUtmCampaign] = useState(initialUtmCampaign);
  const [utmContent, setUtmContent] = useState(initialUtmContent);
  const [attachShopLink, setAttachShopLink] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [copiedCallback, setCopiedCallback] = useState(false);

  const builtUtmLink = useMemo(() => {
    const base = 'https://podrozowka.pl/sklep';
    const params = new URLSearchParams({
      utm_source: 'facebook',
      utm_medium: 'organic',
      utm_campaign: utmCampaign.trim() || 'organic_fb',
      utm_content: utmContent.trim() || 'post',
    });
    return `${base}?${params.toString()}`;
  }, [utmCampaign, utmContent]);

  const lintFindings = useMemo(() => lintPodrozowkaCopy(message), [message]);
  const hasBlockingErrors = lintFindings.some((f) => f.severity === 'error');

  const fetchPosts = useCallback(async (pageId?: string) => {
    setLoadingPosts(true);
    try {
      const qs = pageId ? `?pageId=${encodeURIComponent(pageId)}` : '';
      const res = await fetch(`/api/facebook/posts${qs}`, { cache: 'no-store' });
      const data = (await res.json()) as { posts?: FacebookPostItem[]; error?: string };
      if (res.ok && data.posts) {
        setPosts(data.posts);
      }
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  const loadStatus = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch('/api/facebook/status', { cache: 'no-store' });
      const data = (await res.json()) as FacebookStatusResponse;
      setStatus(data);
      if (data.connected && data.selectedPageId) {
        await fetchPosts(data.selectedPageId);
      } else {
        setPosts([]);
      }
    } finally {
      setLoadingStatus(false);
    }
  }, [fetchPosts]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/facebook/status', { cache: 'no-store' });
        const data = (await res.json()) as FacebookStatusResponse;
        if (!active) return;
        setStatus(data);
        if (data.connected && data.selectedPageId) {
          const qs = `?pageId=${encodeURIComponent(data.selectedPageId)}`;
          const postsRes = await fetch(`/api/facebook/posts${qs}`, { cache: 'no-store' });
          const postsData = (await postsRes.json()) as { posts?: FacebookPostItem[] };
          if (active && postsRes.ok && postsData.posts) {
            setPosts(postsData.posts);
          }
        } else {
          setPosts([]);
        }
      } finally {
        if (active) {
          setLoadingStatus(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) return;
      if (event.data?.type === 'FACEBOOK_OAUTH_SUCCESS') {
        setFeedback({ type: 'ok', text: 'Połączono stronę na Facebooku.' });
        void loadStatus();
      } else if (event.data?.type === 'FACEBOOK_OAUTH_ERROR') {
        setFeedback({
          type: 'err',
          text: event.data?.error || 'Nie udało się połączyć z Facebookiem.',
        });
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [loadStatus]);

  const handleConnect = async () => {
    setFeedback(null);
    try {
      const res = await fetch('/api/facebook/auth-url', { cache: 'no-store' });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setFeedback({
          type: 'err',
          text:
            data.error ||
            'Dodaj FACEBOOK_APP_ID oraz FACEBOOK_APP_SECRET w Settings > Secrets.',
        });
        return;
      }
      const popup = window.open(data.url, 'facebook_oauth_popup', 'width=640,height=720');
      if (!popup) {
        setFeedback({
          type: 'err',
          text: 'Przeglądarka zablokowała okno logowania Facebooka. Zezwól na wyskakujące okna dla tej karty.',
        });
      }
    } catch {
      setFeedback({ type: 'err', text: 'Nie udało się otworzyć okna logowania Meta.' });
    }
  };

  const handleDisconnect = async () => {
    await fetch('/api/facebook/disconnect', { method: 'POST' });
    setPosts([]);
    setFeedback({ type: 'ok', text: 'Rozłączono konto Facebook.' });
    await loadStatus();
  };

  const handleSelectPage = async (pageId: string) => {
    await fetch('/api/facebook/select-page', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageId }),
    });
    await loadStatus();
  };

  const handlePublish = async () => {
    if (!message.trim() || hasBlockingErrors) return;
    setPublishing(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/facebook/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId: status?.selectedPageId,
          message: message.trim(),
          link: attachShopLink ? builtUtmLink : undefined,
        }),
      });
      const data = (await res.json()) as { published?: boolean; postId?: string; error?: string };
      if (!res.ok) {
        throw new Error(data.error || 'Błąd publikacji na Facebooku.');
      }
      setFeedback({
        type: 'ok',
        text: `Opublikowano post organiczny na stronie Facebook (ID: ${data.postId}).`,
      });
      setMessage('');
      await fetchPosts(status?.selectedPageId || undefined);
    } catch (err: unknown) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Nie udało się opublikować posta.',
      });
    } finally {
      setPublishing(false);
    }
  };

  const handleCopyCallback = async () => {
    if (!status?.callbackUrl) return;
    await navigator.clipboard.writeText(status.callbackUrl);
    setCopiedCallback(true);
    setTimeout(() => setCopiedCallback(false), 1800);
  };

  return (
    <div className="space-y-6">
      {/* Connection Card */}
      <section className="bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#121926]">
              Facebook (Organic) · Publikacja i śledzenie UTM
            </h2>
            <p className="text-sm text-[#414751] mt-1">
              Kanał nr 1 w strategii organicznej podrozowka.pl (Instagram API świadomie odłożony na później).
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {status?.connected ? (
              <>
                <button
                  type="button"
                  onClick={() => fetchPosts(status.selectedPageId || undefined)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#121926] bg-[#FAF6EA] hover:bg-[#FFF2CC] border border-[#E8E1D3] rounded-full transition-colors whitespace-nowrap shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Odśwież posty</span>
                </button>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#121926] bg-[#FAF6EA] hover:bg-[#FFF2CC] border border-[#E8E1D3] rounded-full transition-colors whitespace-nowrap shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Rozłącz</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleConnect}
                disabled={loadingStatus}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#121926] bg-[#FFBF00] hover:bg-[#F0B200] rounded-full transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Połącz stronę na Facebooku</span>
              </button>
            )}
          </div>
        </div>

        {status && !status.configured && (
          <div className="bg-[#FFF8E1] border border-[#FDE68A] rounded-xl p-4 text-xs text-[#78350F] space-y-2">
            <p className="font-semibold">
              Wymagana konfiguracja Meta for Developers w Settings &gt; Secrets
            </p>
            <p>
              Dodaj zmienne <code className="font-mono">FACEBOOK_APP_ID</code> oraz{' '}
              <code className="font-mono">FACEBOOK_APP_SECRET</code>, a w panelu Meta wpisz dokładny adres przekierowania OAuth:
            </p>
            <div className="flex flex-wrap items-center gap-2 bg-white border border-[#FDE68A] rounded-lg px-3 py-2 font-mono text-[11px]">
              <span className="break-all">{status.callbackUrl}</span>
              <button
                type="button"
                onClick={handleCopyCallback}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#FAF6EA] hover:bg-[#FFF2CC] border border-[#E8E1D3] rounded-full text-[#121926] font-sans font-medium shrink-0"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedCallback ? 'Skopiowano' : 'Kopiuj'}</span>
              </button>
            </div>
          </div>
        )}

        {status?.connected && status.pages.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[#F1ECE1] text-xs">
            <span className="font-medium text-[#646A75]">Aktywna strona Facebook:</span>
            <select
              value={status.selectedPageId || ''}
              onChange={(e) => handleSelectPage(e.target.value)}
              className="rounded-xl border border-[#E8E1D3] bg-[#FAF6EA] px-3 py-1.5 text-xs font-medium text-[#121926] focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
            >
              {status.pages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.id})
                </option>
              ))}
            </select>
          </div>
        )}
      </section>

      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-xs ${
            feedback.type === 'ok'
              ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#14532D]'
              : 'bg-[#FEF2F2] border-[#FECACA] text-[#7F1D1D]'
          }`}
        >
          {feedback.type === 'ok' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#15803D]" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-[#DC2626]" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Composer + UTM Builder */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-semibold text-[#121926]">
            Edytor posta organicznego (z kontrolą Antywzorców)
          </h3>

          <textarea
            rows={7}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Wpisz lub wklej wygenerowany przez Architekta Social post na Facebooka..."
            className="w-full rounded-xl border border-[#E8E1D3] bg-[#FAF6EA] px-3.5 py-2.5 text-sm text-[#121926] focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
          />

          {/* UTM Builder */}
          <div className="bg-[#FAF6EA] border border-[#E8E1D3] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-[#121926] cursor-pointer">
                <input
                  type="checkbox"
                  checked={attachShopLink}
                  onChange={(e) => setAttachShopLink(e.target.checked)}
                  className="rounded border-[#D5CCB8] accent-[#3B0754] focus:ring-[#FFBF00]"
                />
                <span>Dołącz link do sklepu z tagowaniem UTM (dla GA4)</span>
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-[#646A75] mb-1">
                  utm_campaign
                </label>
                <input
                  type="text"
                  value={utmCampaign}
                  onChange={(e) => setUtmCampaign(e.target.value)}
                  className="w-full rounded-lg border border-[#E8E1D3] bg-white px-2.5 py-1.5 text-xs font-mono text-[#121926] focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#646A75] mb-1">
                  utm_content
                </label>
                <input
                  type="text"
                  value={utmContent}
                  onChange={(e) => setUtmContent(e.target.value)}
                  className="w-full rounded-lg border border-[#E8E1D3] bg-white px-2.5 py-1.5 text-xs font-mono text-[#121926] focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
                />
              </div>
            </div>
            {attachShopLink && (
              <p className="text-[11px] font-mono text-[#646A75] break-all">{builtUtmLink}</p>
            )}
          </div>

          {lintFindings.length > 0 && (
            <div
              className={`rounded-xl border p-3 text-xs space-y-1 ${
                hasBlockingErrors
                  ? 'bg-[#FEF2F2] border-[#FECACA] text-[#7F1D1D]'
                  : 'bg-[#FFF8E1] border-[#FDE68A] text-[#78350F]'
              }`}
            >
              {lintFindings.map((f) => (
                <p key={f.id}>
                  • <strong>{f.term}:</strong> {f.reason}
                </p>
              ))}
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handlePublish}
              disabled={!status?.connected || publishing || !message.trim() || hasBlockingErrors}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-[#121926] bg-[#FFBF00] hover:bg-[#F0B200] rounded-full transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{publishing ? 'Publikowanie...' : 'Opublikuj na Facebooku'}</span>
            </button>
          </div>
        </section>

        {/* Published Posts List */}
        <section className="lg:col-span-5 bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-semibold text-[#121926]">
            Ostatnie posty strony
          </h3>

          {!status?.connected ? (
            <p className="text-xs text-[#646A75] leading-relaxed">
              Po połączeniu konta zobaczysz tutaj opublikowane posty ze strony Podróżówki wraz z liczbą reakcji, komentarzy i udostępnień.
            </p>
          ) : loadingPosts ? (
            <p className="text-xs text-[#646A75]">Ładowanie postów z Graph API...</p>
          ) : posts.length === 0 ? (
            <p className="text-xs text-[#646A75]">Brak postów na wybranej stronie.</p>
          ) : (
            <div className="divide-y divide-[#F1ECE1]">
              {posts.map((post) => (
                <div key={post.id} className="py-3 space-y-1.5 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2 text-[11px] text-[#646A75] font-mono tabular-nums">
                    <span>{new Date(post.createdTime).toLocaleDateString('pl-PL')}</span>
                    <span>
                      {post.reactions} reakcji · {post.comments} kom. · {post.shares} udost.
                    </span>
                  </div>
                  <p className="text-xs text-[#121926] line-clamp-3 leading-relaxed">
                    {post.message}
                  </p>
                  {post.permalinkUrl && (
                    <a
                      href={post.permalinkUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#5B2182] hover:text-[#3B0754] hover:underline"
                    >
                      <span>Zobacz na Facebooku</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
