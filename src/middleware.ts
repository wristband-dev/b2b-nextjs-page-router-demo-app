import { NextRequest, NextResponse } from 'next/server';

import { wristbandAuth } from '@/wristband-auth';
import { getSession } from '@/session/iron-session';
import { HTTP_401_STATUS, UNAUTHORIZED } from '@/utils/constants';
import { isCsrfTokenValid, setCsrfTokenCookie } from '@/utils/csrf';

// NOTE: Replace with whatever path matching algorithm your app needs.
const PROTECTED_API_PATH_PREFIX = '/api/v1';
const PROTECTED_PAGE_PATHS = ['/settings'];

function resolveErrorResponse(req: NextRequest) {
  const host = req.headers.get('host');
  const { pathname } = req.nextUrl;

  const returnUrl = `http://${host}${pathname}`;
  const loginUrl = `http://${host}/api/auth/login?return_url=${returnUrl}`;

  return pathname.startsWith(PROTECTED_API_PATH_PREFIX)
    ? NextResponse.json(UNAUTHORIZED, HTTP_401_STATUS)
    : NextResponse.redirect(loginUrl);
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const { pathname } = req.nextUrl;

  // Simply exit the middleware if the current request path does not need to be protected.
  if (!PROTECTED_PAGE_PATHS.includes(pathname) && !pathname.startsWith(PROTECTED_API_PATH_PREFIX)) {
    return res;
  }

  const session = await getSession(req, res);
  const { csrfSecret, expiresAt, isAuthenticated, refreshToken } = session;

  // Send users to the login page if they attempt to access protected paths when unauthenticated.
  if (!isAuthenticated) {
    return resolveErrorResponse(req);
  }

  // Ensure that CSRF valid.
  const isValidCsrf = await isCsrfTokenValid(req, csrfSecret);
  if (!isValidCsrf && pathname.startsWith(PROTECTED_API_PATH_PREFIX)) {
    return resolveErrorResponse(req);
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
  } catch (error) {
    console.log(`Token refresh failed: `, error);
    return resolveErrorResponse(req);
  }

  // Always touch the session by saving it to update the expiration
  await session.save();

  // Update CSRF Token
  await setCsrfTokenCookie(csrfSecret, res);

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
