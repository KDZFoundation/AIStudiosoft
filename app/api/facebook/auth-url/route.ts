import { NextRequest, NextResponse } from 'next/server';
import { getFacebookCallbackUrl } from '@/lib/facebook';

export async function GET(req: NextRequest) {
  const appId = process.env.FACEBOOK_APP_ID?.trim();
  const appSecret = process.env.FACEBOOK_APP_SECRET?.trim();
  const redirectUri = getFacebookCallbackUrl(req);

  if (!appId || !appSecret) {
    return NextResponse.json(
      {
        configured: false,
        redirectUri,
        error:
          'Skonfiguruj zmienne FACEBOOK_APP_ID oraz FACEBOOK_APP_SECRET w Settings > Secrets, aby połączyć stronę na Facebooku.',
      },
      { status: 400 }
    );
  }

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'pages_show_list,pages_read_engagement,pages_manage_posts',
  });

  const url = `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;
  return NextResponse.json({ configured: true, url, redirectUri });
}
