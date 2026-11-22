import { NextRequest, NextResponse } from 'next/server';
import { decodeSessionCookie, FB_SESSION_COOKIE } from '@/lib/facebook';
import { lintPodrozowkaCopy } from '@/lib/lint-copy';

export async function POST(req: NextRequest) {
  const session = decodeSessionCookie(req.cookies.get(FB_SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json(
      { error: 'Połącz stronę na Facebooku przed publikacją posta.' },
      { status: 401 }
    );
  }

  try {
    const body = (await req.json()) as {
      pageId?: string;
      message?: string;
      link?: string;
    };
    const message = (body.message || '').trim();
    const link = (body.link || '').trim();

    if (!message) {
      return NextResponse.json({ error: 'Treść posta nie może być pusta.' }, { status: 400 });
    }

    const errors = lintPodrozowkaCopy(message).filter((f) => f.severity === 'error');
    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: `Blokada Antywzorców przed publikacją: ${errors.map((e) => e.term).join(', ')}`,
          lintFindings: errors,
        },
        { status: 422 }
      );
    }

    const page =
      session.pages.find((p) => p.id === (body.pageId || session.selectedPageId)) ||
      session.pages[0];
    if (!page) {
      return NextResponse.json({ error: 'Brak strony Facebook.' }, { status: 404 });
    }

    const params = new URLSearchParams({
      message,
      access_token: page.accessToken,
    });
    if (link) {
      params.set('link', link);
    }

    const fbRes = await fetch(
      `https://graph.facebook.com/v21.0/${encodeURIComponent(page.id)}/feed`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      }
    );

    const fbData = (await fbRes.json()) as { id?: string; error?: { message?: string } };
    if (!fbRes.ok || !fbData.id) {
      return NextResponse.json(
        { error: fbData.error?.message || 'Błąd publikacji posta na Facebooku.' },
        { status: fbRes.status || 500 }
      );
    }

    return NextResponse.json({ published: true, postId: fbData.id, pageName: page.name });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Błąd publikacji na Facebooku.' },
      { status: 500 }
    );
  }
}
