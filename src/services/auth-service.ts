import { FORM_URLENCOED_MEDIA_TYPE, JSON_MEDIA_TYPE } from '@/utils/constants';

// Basic Auth Config for fetch()
const BASIC_AUTH_CREDENTIALS = `${process.env.CLIENT_ID!}:${process.env.CLIENT_SECRET!}`;
const BASIC_AUTH_HEADER_VALUE = `Basic ${Buffer.from(BASIC_AUTH_CREDENTIALS).toString('base64')}`;
const BASIC_AUTH_FETCH_HEADERS = {
  'Content-Type': FORM_URLENCOED_MEDIA_TYPE,
  Accept: JSON_MEDIA_TYPE,
  Authorization: BASIC_AUTH_HEADER_VALUE,
};

// Bearer Auth Config for fetch()
function bearerAuthFetchHeaders(accessToken: string) {
  return { 'Content-Type': JSON_MEDIA_TYPE, Accept: JSON_MEDIA_TYPE, Authorization: `Bearer ${accessToken}` };
}

// ////////////////////////////////////
//  EXPORTS
// ////////////////////////////////////

export async function exchangeAuthCodeForTokens(code: string, redirectUri: string, codeVerifier: string) {
  const authData = [
    'grant_type=authorization_code',
    `code=${code}`,
    `redirect_uri=${encodeURIComponent(redirectUri)}`,
    `code_verifier=${encodeURIComponent(codeVerifier)}`,
  ].join('&');
  const res = await fetch(`https://${process.env.APPLICATION_DOMAIN}/api/v1/oauth2/token`, {
    method: 'POST',
    headers: BASIC_AUTH_FETCH_HEADERS,
    body: authData,
    keepalive: true,
  });

  if (res.status !== 200) {
    throw new Error(`Auth code for token exchange failed. Status: [${res.status}], Message: [${res.statusText}]`);
  }

  const data = await res.json();
  return data;
}

export async function getUserinfo(accessToken: string) {
  const res = await fetch(`https://${process.env.APPLICATION_DOMAIN}/api/v1/oauth2/userinfo`, {
    method: 'GET',
    headers: bearerAuthFetchHeaders(accessToken),
    keepalive: true,
  });

  if (res.status !== 200) {
    throw new Error(`Fetch userinfo failed. Status: [${res.status}], Message: [${res.statusText}]`);
  }

  const data = await res.json();
  return data;
}

export async function refreshToken(refreshToken: string) {
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

export async function revokeRefreshToken(refreshToken: string) {
  const res = await fetch(`https://${process.env.APPLICATION_DOMAIN}/api/v1/oauth2/revoke`, {
    method: 'POST',
    headers: BASIC_AUTH_FETCH_HEADERS,
    body: `token=${refreshToken}`,
    keepalive: true,
  });

  if (res.status !== 200) {
    throw new Error(`Revoke token failed. Status: [${res.status}], Message: [${res.statusText}]`);
  }
}
