import { NextRequest, NextResponse } from 'next/server';
import {
  encodeSessionCookie,
  FacebookPageSummary,
  FB_SESSION_COOKIE,
  getFacebookCallbackUrl,
  getIframeCookieOptions,
} from '@/lib/facebook';

function popupHtml(payload: { ok: boolean; error?: string }) {
  const safeMsg = payload.error
    ? payload.error.replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    : '';
  return `<!DOCTYPE html>
<html lang="pl">
<head><meta charset="utf-8" /><title>Autoryzacja Facebook</title></head>
<body style="font-family:sans-serif;padding:24px;color:#1e293b;">
  <script>
    if (window.opener) {
      window.opener.postMessage(${JSON.stringify({
        type: payload.ok ? 'FACEBOOK_OAUTH_SUCCESS' : 'FACEBOOK_OAUTH_ERROR',
        error: payload.error || null,
      })}, '*');
      window.close();
    }
  </script>
  <p>${payload.ok ? 'Połączono stronę na Facebooku. Możesz zamknąć to okno.' : `Błąd autoryzacji Facebooka: ${safeMsg}`}</p>
</body>
</html>`;
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const errorDesc =
    req.nextUrl.searchParams.get('error_description') ||
    req.nextUrl.searchParams.get('error_message');

  if (errorDesc) {
    return new NextResponse(popupHtml({ ok: false, error: errorDesc }), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const appId = process.env.FACEBOOK_APP_ID?.trim();
  const appSecret = process.env.FACEBOOK_APP_SECRET?.trim();
  if (!appId || !appSecret || !code) {
    return new NextResponse(
      popupHtml({
        ok: false,
        error: 'Brak kodu autoryzacyjnego lub konfiguracji FACEBOOK_APP_ID / FACEBOOK_APP_SECRET.',
      }),
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  try {
    const redirectUri = getFacebookCallbackUrl(req);
    const tokenParams = new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: redirectUri,
      code,
    });

    const tokenRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?${tokenParams.toString()}`,
      { cache: 'no-store' }
    );
    const tokenData = (await tokenRes.json()) as {
      access_token?: string;
      error?: { message?: string };
    };
    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error(tokenData.error?.message || 'Nie udało się wymienić kodu na token Facebooka.');
    }

    const userAccessToken = tokenData.access_token;

    const [meRes, pagesRes] = await Promise.all([
      fetch(
        `https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${encodeURIComponent(
          userAccessToken
        )}`,
        { cache: 'no-store' }
      ),
      fetch(
        `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,category,access_token,picture{url}&access_token=${encodeURIComponent(
          userAccessToken
        )}`,
        { cache: 'no-store' }
      ),
    ]);

    const meData = (await meRes.json()) as { name?: string };
    const pagesData = (await pagesRes.json()) as {
      data?: Array<{
        id: string;
        name: string;
        category?: string;
        access_token: string;
        picture?: { data?: { url?: string } };
      }>;
    };

    const pages: FacebookPageSummary[] = (pagesData.data ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      pictureUrl: p.picture?.data?.url,
      accessToken: p.access_token,
    }));

    const preferred =
      pages.find((p) => p.name.toLowerCase().includes('podr')) || pages[0];

    const cookieValue = encodeSessionCookie({
      userAccessToken,
      userName: meData.name,
      pages,
      selectedPageId: preferred?.id,
      updatedAt: new Date().toISOString(),
    });

    const response = new NextResponse(popupHtml({ ok: true }), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
    response.cookies.set(FB_SESSION_COOKIE, cookieValue, getIframeCookieOptions());
    return response;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Błąd autoryzacji Facebooka.';
    return new NextResponse(popupHtml({ ok: false, error: msg }), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}
