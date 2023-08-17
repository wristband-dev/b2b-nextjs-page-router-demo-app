import { NextRequest, NextResponse } from 'next/server';
import retry from 'async-retry';

import * as wristbandService from '@/services/wristband-service';
import { getSessionMiddleware } from './utils/session/session-middleware';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const { nextUrl, headers } = req;
  const { pathname } = nextUrl;
  // The boolean logic here should change depending on your SSR page convention.
  const isSsrPage: boolean = pathname === '/settings';
 
  // This determines which routes in your app are protected by tokens and have session access.
  // Path matching here is crude -- replace with whatever matching algorithm your app needs.
  if (pathname.startsWith('/api/v1') || isSsrPage) {
    const session = await getSessionMiddleware(req, res);
    const { accessToken, expiresAt, refreshToken } = session;

    // First check that we have our token data in our session.
    const isAuthenticated = !!accessToken && !!expiresAt && !!refreshToken;
    if (!isAuthenticated) {
      // For browser-side React calls to API routes, React should handle a 401 response by redirecting
      // to the login page. For SSR pages, the redirect needs to happen directly here in the server.
      const returnUrl = `http://${headers.get('host')}${pathname}`;
      return isSsrPage
        ? NextResponse.redirect(`http://${headers.get('host')}/api/auth/login?return_url=${returnUrl}`)
        : NextResponse.json({ statusText: 'Unauthorized' }, { status: 401 });
    }

    // Make sure the access token is not expired.
    if (Date.now() < expiresAt) {
      // Touch the session if user is still authenticated
      await session.save();
      return res;
    }

    // Attempt to refresh the token up to 3 times with a 1 second delay
    // between each attempt before returning a 401.
    try {
      await retry(
        async () => {
          const tokenData = await wristbandService.tokenRefresh(refreshToken);
          const { access_token, expires_in, refresh_token } = tokenData;
          session.accessToken = access_token;
          session.refreshToken = refresh_token;
          // 5 minute safety buffer included for expiration checks
          const expiresInMillisecondsWithBuffer = (expires_in - 300) * 1000;
          session.expiresAt = Date.now() + expiresInMillisecondsWithBuffer;
          await session.save();
        },
        {
          retries: 2,
          minTimeout: 1000,
          maxTimeout: 1000
        }
      );

      return res;
    } catch (error) {
      console.log(`Token refresh failed: `, error);
      const returnUrl = `http://${headers.get('host')}${pathname}`;
      return isSsrPage
        ? NextResponse.redirect(`http://${headers.get('host')}/api/auth/login?return_url=${returnUrl}`)
        : NextResponse.json({ statusText: 'Unauthorized' }, { status: 401 });
    }
  }

  return res;
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
}
