import crypto from 'crypto';
import { NextRequest } from 'next/server';

export const FB_SESSION_COOKIE = 'podrozowka_fb_session';

export interface FacebookPageSummary {
  id: string;
  name: string;
  category?: string;
  pictureUrl?: string;
  accessToken: string;
}

export interface FacebookSessionPayload {
  userAccessToken: string;
  userName?: string;
  pages: FacebookPageSummary[];
  selectedPageId?: string;
  updatedAt: string;
}

export function getFacebookCallbackUrl(req?: NextRequest): string {
  const envUrl = process.env.APP_URL?.trim();
  if (envUrl && envUrl.startsWith('http')) {
    return `${envUrl.replace(/\/+$/, '')}/api/facebook/callback`;
  }
  if (req) {
    const proto = req.headers.get('x-forwarded-proto') || 'https';
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    if (host) {
      return `${proto}://${host}/api/facebook/callback`;
    }
  }
  return 'http://localhost:3000/api/facebook/callback';
}

function getSigningSecret(): string {
  return (
    process.env.FACEBOOK_APP_SECRET ||
    process.env.GEMINI_API_KEY ||
    'podrozowka-dev-session-secret'
  );
}

export function encodeSessionCookie(payload: FacebookSessionPayload): string {
  const json = JSON.stringify(payload);
  const b64 = Buffer.from(json, 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', getSigningSecret())
    .update(b64)
    .digest('base64url');
  return `${b64}.${sig}`;
}

export function decodeSessionCookie(raw?: string): FacebookSessionPayload | null {
  if (!raw || !raw.includes('.')) return null;
  const [b64, sig] = raw.split('.');
  if (!b64 || !sig) return null;
  const expected = crypto
    .createHmac('sha256', getSigningSecret())
    .update(b64)
    .digest('base64url');
  if (sig !== expected) return null;
  try {
    const json = Buffer.from(b64, 'base64url').toString('utf8');
    return JSON.parse(json) as FacebookSessionPayload;
  } catch {
    return null;
  }
}

export function getIframeCookieOptions(maxAgeSeconds = 60 * 60 * 24 * 14) {
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'none' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  };
}
