import apiClient from '@/client/server-axios-client';
import { bearerToken } from '@/auth/server-auth';

// Basic Auth Config for fetch()
const BASIC_AUTH_CREDENTIALS = `${process.env.CLIENT_ID!}:${process.env.CLIENT_SECRET!}`;
const BASIC_AUTH_HEADER_VALUE = `Basic ${Buffer.from(BASIC_AUTH_CREDENTIALS).toString('base64')}`;
const BASIC_AUTH_FETCH_HEADERS = {
  'Content-Type': 'application/x-www-form-urlencoded',
  Accept: 'application/json;charset=UTF-8',
  Authorization: BASIC_AUTH_HEADER_VALUE,
};

// Basic Auth Config for axios()
const BASIC_AUTH_AXIOS_CONFIG = {
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  auth: {
    username: process.env.CLIENT_ID!,
    password: process.env.CLIENT_SECRET!,
  },
};

export async function exchangeAuthCodeForTokens(code: string, redirectUri: string, codeVerifier: string) {
  const authData = [
    'grant_type=authorization_code',
    `code=${code}`,
    `redirect_uri=${encodeURIComponent(redirectUri)}`,
    `code_verifier=${encodeURIComponent(codeVerifier)}`,
  ].join('&');
  const response = await apiClient.post('/oauth2/token', authData, BASIC_AUTH_AXIOS_CONFIG);
  return response.data;
}

export async function getUserinfo(accessToken: string) {
  const response = await apiClient.get('/oauth2/userinfo', bearerToken(accessToken));
  return response.data;
}

export async function revokeRefreshToken(refreshToken: string) {
  await apiClient.post(`/oauth2/revoke`, `token=${refreshToken}`, BASIC_AUTH_AXIOS_CONFIG);
}

/*
 * NOTE: We must use fetch() here instead of axios() as NextJS middleware combined with Iron Session
 * prevents us from leveraging any NodeJS libs that axios relies on under the hood.
 */
export async function refreshToken(refreshToken: string) {
  // This condition is here for local development when the Wristband platform is also local.  This
  // will never be the case in production.
  const protocol = process.env.NEXT_PUBLIC_TRUST_SELF_SIGNED_CERT ? 'http' : 'https';
  const res = await fetch(`${protocol}://${process.env.APPLICATION_DOMAIN}/api/v1/oauth2/token`, {
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

export async function getTenant(accessToken: string, tenantId: string) {
  const response = await apiClient.get(`/tenants/${tenantId}`, bearerToken(accessToken));
  return response.data;
}
