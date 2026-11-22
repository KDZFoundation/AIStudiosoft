import { NextResponse } from 'next/server';
import { FB_SESSION_COOKIE, getIframeCookieOptions } from '@/lib/facebook';

export async function POST() {
  const res = NextResponse.json({ disconnected: true });
  res.cookies.set(FB_SESSION_COOKIE, '', getIframeCookieOptions(0));
  return res;
}
