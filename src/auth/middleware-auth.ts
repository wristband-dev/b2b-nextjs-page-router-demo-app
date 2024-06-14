import retry from 'async-retry';

import { TokenData, TokenResponse } from '@/types';

const BASIC_AUTH_CREDENTIALS = `${process.env.CLIENT_ID!}:${process.env.CLIENT_SECRET!}`;
const BASIC_AUTH_HEADER_VALUE = `Basic ${Buffer.from(BASIC_AUTH_CREDENTIALS).toString('base64')}`;
const BASIC_AUTH_FETCH_HEADERS = {
  'Content-Type': 'application/x-www-form-urlencoded',
  Accept: 'application/json;charset=UTF-8',
  Authorization: BASIC_AUTH_HEADER_VALUE,
};

// NOTE: We must use fetch() in the Middleware here instead of axios() due to NextJS's edge runtime limitations.
async function performTokenRefresh(refreshToken: string) {
  const res = await fetch(`https://${process.env.APPLICATION_DOMAIN}/api/v1/oauth2/token`, {
    method: 'POST',
    headers: BASIC_AUTH_FETCH_HEADERS,
    body: `grant_type=refresh_token&refresh_token=${refreshToken}`,
    keepalive: true,
  });

  if (res.status !== 200) {
    throw new Error(`Token refresh failed. Status: [${res.status}], Message: [${res.statusText}]`);
  }

  const data = await res.json();
  return data;
}

export async function refreshTokenIfExpired(refreshToken: string, expiresAt: number): Promise<TokenData | null> {
  // Safety checks
  if (!refreshToken) {
    throw new TypeError('Refresh token must be a valid string');
  }
  if (!expiresAt || expiresAt < 0) {
    throw new TypeError('The expiresAt field must be an integer greater than 0');
  }

  if (Date.now().valueOf() <= expiresAt) {
    return null;
  }

  // Try up to 3 times to perform a token refresh.
  let tokenResponse: TokenResponse | null = null;
  await retry(
    async () => {
      tokenResponse = await performTokenRefresh(refreshToken);
    },
    { retries: 2, minTimeout: 100, maxTimeout: 100 }
  );

  if (tokenResponse) {
    const {
      access_token: accessToken,
      id_token: idToken,
      expires_in: expiresIn,
      refresh_token: responseRefreshToken,
    } = tokenResponse;
    return { accessToken, idToken, refreshToken: responseRefreshToken, expiresIn };
  }

  // [Safety check] Errors during the refresh API call should bubble up, so this should never happen.
  throw new Error('Token response was null');
}
