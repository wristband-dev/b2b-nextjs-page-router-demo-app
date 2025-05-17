import { NextRequest, NextResponse } from 'next/server';

import { wristbandAuth } from '@/wristband-auth';
import { middlewareGetSession } from '@/session/iron-session';
import { CSRF_TOKEN_HEADER_NAME } from '@/utils/constants';
import { updateCsrfCookie } from '@/utils/csrf';

// NOTE: Replace with whatever path matching algorithm your app needs.
const PROTECTED_API_PATH_PREFIXES = ['/api/v1'];
const PROTECTED_PAGE_PATH_PREFIXES = ['/settings'];
const ALL_PROTECTED_PATH_PREFIXES = [...PROTECTED_API_PATH_PREFIXES, ...PROTECTED_PAGE_PATH_PREFIXES];

function isProtectedRequest(req: NextRequest) {
  return ALL_PROTECTED_PATH_PREFIXES.some((prefix) => req.nextUrl.pathname.startsWith(prefix));
}

function isCsrfValid(req: NextRequest, csrfToken: string = '') {
  // CSRF protection should only be applied to API endpoints, not page navigations.
  if (PROTECTED_PAGE_PATH_PREFIXES.some((prefix) => req.nextUrl.pathname.startsWith(prefix))) {
    return true;
  }
  return csrfToken && csrfToken === req.headers.get(CSRF_TOKEN_HEADER_NAME);
}

function createErrorResponse(req: NextRequest, status: number) {
  const host = req.headers.get('host');
  const { pathname } = req.nextUrl;
  const returnUrl = `http://${host}${pathname}`;
  const loginUrl = `http://${host}/api/auth/login?return_url=${returnUrl}`;
  return pathname.startsWith('/api/') ? new NextResponse(null, { status }) : NextResponse.redirect(loginUrl);
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Simply exit the middleware if the current request path does not need to be protected.
  if (!isProtectedRequest(req)) {
    return res;
  }

  const session = await middlewareGetSession(req, res);
  const { csrfToken, expiresAt, isAuthenticated, refreshToken } = session;

  // Make sure the user is authenticated before proceeding.
  if (!isAuthenticated) {
    return createErrorResponse(req, 401);
  }

  // Ensure that CSRF is valid for API requests.
  if (!isCsrfValid(req, csrfToken)) {
    return createErrorResponse(req, 403);
  }

  // "Touch" the CSRF Cookie
  await updateCsrfCookie(csrfToken, res);

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
    return createErrorResponse(req, 401);
  }

  // Always "touch" the session by saving it to update the expiration
  await session.save();

  // Update CSRF Token
  await updateCsrfCookie(csrfToken, res);

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
