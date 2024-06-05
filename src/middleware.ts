import { NextRequest, NextResponse } from 'next/server';

import { getSession } from '@/session/iron-session';
import { refreshTokenIfExpired } from './auth/middleware-auth';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const { nextUrl, headers } = req;
  const { pathname } = nextUrl;
  // The boolean logic here should change depending on your SSR page convention.
  const isSsrPage: boolean = pathname === '/settings';

  // This determines which routes in your app are protected by tokens and have session access.
  // Path matching here is crude -- replace with whatever matching algorithm your app needs.
  if (!pathname.startsWith('/api/v1') && !isSsrPage) {
    return res;
  }

  const session = await getSession(req, res);
  const { accessToken, expiresAt, refreshToken } = session;

  // For browser-side React calls to API routes, React should handle a 401 response by redirecting
  // to the login page. For SSR pages, the redirect needs to happen directly here in the middleware.
  const isAuthenticated = !!accessToken && !!expiresAt && !!refreshToken;
  if (!isAuthenticated) {
    const returnUrl = `http://${headers.get('host')}${pathname}`;
    return isSsrPage
      ? NextResponse.redirect(`http://${headers.get('host')}/api/auth/login?return_url=${returnUrl}`)
      : NextResponse.json({ statusText: 'Unauthorized' }, { status: 401 });
  }

  // Attempt to refresh the token up to 3 times before returning a 401.
  /* WRISTBAND_TOUCHPOINT - AUTHENTICATION */
  try {
    const tokenData = await refreshTokenIfExpired(refreshToken!, expiresAt);
    if (tokenData) {
      console.log('MIDDLEWARE VALUES: ', expiresAt, tokenData.expiresIn);
      session.accessToken = tokenData.accessToken;
      // Convert the "expiresIn" seconds into an expiration date with the format of milliseconds from the epoch.
      session.expiresAt = Date.now() + tokenData.expiresIn * 1000;
      session.refreshToken = tokenData.refreshToken;
    }

    // Save the session in order to "touch" it (even if there is no new token data).
    await session.save();
    return res;
  } catch (error) {
    console.log(`Token refresh failed: `, error);
    const returnUrl = `http://${headers.get('host')}${pathname}`;
    return isSsrPage
      ? NextResponse.redirect(`http://${headers.get('host')}/api/auth/login?return_url=${returnUrl}`)
      : NextResponse.json({ statusText: 'Unauthorized' }, { status: 401 });
  }
}

export const config = {
  /*
   * Match all paths except for:
   * 1. /_next (Next.js internals)
   * 2. /fonts (inside /public)
   * 3. /examples (inside /public)
   * 4. all root files inside /public (e.g. /favicon.ico)
   */
  matcher: ['/((?!_next|fonts|examples|[\\w-]+\\.\\w+).*)'],
};
