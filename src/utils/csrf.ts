import { NextApiResponse } from 'next';

import { CSRF_TOKEN_COOKIE_NAME } from './constants';

export function createCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function updateCsrfCookie(csrfToken: string, res: Response | NextApiResponse) {
  const cookieValue = `${CSRF_TOKEN_COOKIE_NAME}=${csrfToken}; Path=/; SameSite=Strict; Max-Age=1800`;

  if (res instanceof Response) {
    // For Edge runtime, append the cookie header using Response's headers.
    res.headers.append('Set-Cookie', cookieValue);
  } else if ('setHeader' in res) {
    // For Node runtime, handle cookies with ServerResponse.
    let existingCookies = res.getHeader('Set-Cookie') || [];

    if (!Array.isArray(existingCookies)) {
      existingCookies = [existingCookies.toString()];
    }

    res.setHeader('Set-Cookie', [...existingCookies, cookieValue]);
  } else {
    throw new Error('Unsupported response object: Unable to set cookies');
  }
}
