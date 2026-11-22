import { NextRequest, NextResponse } from 'next/server';
import {
  decodeSessionCookie,
  encodeSessionCookie,
  FB_SESSION_COOKIE,
  getIframeCookieOptions,
} from '@/lib/facebook';

export async function POST(req: NextRequest) {
  const session = decodeSessionCookie(req.cookies.get(FB_SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: 'Brak aktywnej sesji Facebook.' }, { status: 401 });
  }
  const body = (await req.json()) as { pageId?: string };
  const exists = session.pages.some((p) => p.id === body.pageId);
  if (!exists || !body.pageId) {
    return NextResponse.json({ error: 'Nie znaleziono wybranej strony Facebook.' }, { status: 400 });
  }
  const updated = encodeSessionCookie({
    ...session,
    selectedPageId: body.pageId,
    updatedAt: new Date().toISOString(),
  });
  const res = NextResponse.json({ selectedPageId: body.pageId });
  res.cookies.set(FB_SESSION_COOKIE, updated, getIframeCookieOptions());
  return res;
}
