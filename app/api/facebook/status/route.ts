import { NextRequest, NextResponse } from 'next/server';
import {
  decodeSessionCookie,
  FB_SESSION_COOKIE,
  getFacebookCallbackUrl,
} from '@/lib/facebook';

export async function GET(req: NextRequest) {
  const configured = Boolean(
    process.env.FACEBOOK_APP_ID?.trim() && process.env.FACEBOOK_APP_SECRET?.trim()
  );
  const callbackUrl = getFacebookCallbackUrl(req);
  const session = decodeSessionCookie(req.cookies.get(FB_SESSION_COOKIE)?.value);

  if (!session) {
    return NextResponse.json({
      configured,
      connected: false,
      callbackUrl,
      pages: [],
      selectedPageId: null,
    });
  }

  return NextResponse.json({
    configured,
    connected: true,
    callbackUrl,
    userName: session.userName ?? null,
    selectedPageId: session.selectedPageId ?? session.pages[0]?.id ?? null,
    pages: session.pages.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category ?? null,
      pictureUrl: p.pictureUrl ?? null,
    })),
  });
}
