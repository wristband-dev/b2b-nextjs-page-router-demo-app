import { NextRequest, NextResponse } from 'next/server';

import { middlewareGetSession } from '@/session/iron-session';
import { wristbandAuth } from '@/wristband-auth';
import { HTTP_401_STATUS, UNAUTHORIZED } from '@/utils/constants';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const host = req.headers.get('host');
  const { pathname } = req.nextUrl;

  // Path matching here is crude -- replace with whatever matching algorithm your app needs.
  const isProtectedPage: boolean = pathname === '/settings';
  const isProtectedApiRoute: boolean = pathname.startsWith('/api/v1');

  // Simply return if the path is not meant to be protected
  if (!isProtectedPage && !isProtectedApiRoute) {
    return res;
  }

  const session = await middlewareGetSession(req, res);
  const { expiresAt, isAuthenticated, refreshToken } = session;

  const returnUrl = `http://${host}${pathname}`;
  const loginUrl = `http://${host}/api/auth/login?return_url=${returnUrl}`;

  // Send users to the login page if they attempt to access protected paths when unauthenticated.
  if (!isAuthenticated) {
    return isProtectedApiRoute ? NextResponse.json(UNAUTHORIZED, HTTP_401_STATUS) : NextResponse.redirect(loginUrl);
  }

  // Always verify the refresh token is not expired and touch the session timestamp for any protected paths.
  try {
    /* WRISTBAND_TOUCHPOINT - AUTHENTICATION */
    const tokenData = await wristbandAuth.refreshTokenIfExpired(refreshToken!, expiresAt);
    if (tokenData) {
      // Convert the "expiresIn" seconds into an expiration date with the format of milliseconds from the epoch.
      session.expiresAt = Date.now() + tokenData.expiresIn * 1000;
      session.accessToken = tokenData.accessToken;
      session.refreshToken = tokenData.refreshToken;
    }
    // Save and/or touch the session.
    await session.save();
  } catch (error) {
    console.log(`Token refresh failed: `, error);
    return isProtectedApiRoute ? NextResponse.json(UNAUTHORIZED, HTTP_401_STATUS) : NextResponse.redirect(loginUrl);
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
};
