import { NextRequest, NextResponse } from 'next/server';
import { decodeSessionCookie, FB_SESSION_COOKIE } from '@/lib/facebook';

export async function GET(req: NextRequest) {
  const session = decodeSessionCookie(req.cookies.get(FB_SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: 'Połącz stronę na Facebooku, aby pobrać posty.' }, { status: 401 });
  }

  const pageId = req.nextUrl.searchParams.get('pageId') || session.selectedPageId;
  const page = session.pages.find((p) => p.id === pageId) || session.pages[0];
  if (!page) {
    return NextResponse.json({ error: 'Brak podłączonej strony Facebook.' }, { status: 404 });
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${encodeURIComponent(
        page.id
      )}/published_posts?fields=id,message,created_time,permalink_url,shares,reactions.summary(true),comments.summary(true)&limit=10&access_token=${encodeURIComponent(
        page.accessToken
      )}`,
      { cache: 'no-store' }
    );
    const data = (await res.json()) as {
      data?: Array<{
        id: string;
        message?: string;
        created_time?: string;
        permalink_url?: string;
        shares?: { count?: number };
        reactions?: { summary?: { total_count?: number } };
        comments?: { summary?: { total_count?: number } };
      }>;
      error?: { message?: string };
    };
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error?.message || 'Błąd odczytu postów strony Facebook.' },
        { status: res.status }
      );
    }

    const posts = (data.data ?? []).map((p) => ({
      id: p.id,
      message: p.message || '(Post bez tekstu)',
      createdTime: p.created_time || '',
      permalinkUrl: p.permalink_url || null,
      reactions: p.reactions?.summary?.total_count ?? 0,
      comments: p.comments?.summary?.total_count ?? 0,
      shares: p.shares?.count ?? 0,
    }));

    return NextResponse.json({ pageId: page.id, pageName: page.name, posts });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Błąd pobierania postów.' },
      { status: 500 }
    );
  }
}
