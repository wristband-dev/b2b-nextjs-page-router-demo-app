import { NextApiRequest, NextApiResponse } from 'next';
import retry from 'async-retry';
import { IncomingMessage } from 'http';

import { CallbackData, LogoutConfig, TokenData, TokenResponse } from '@/types';
import * as wristbandService from '@/services/wristband-service';
import {
  APPLICATION_LOGIN_URL,
  AUTH_CALLBACK_URL,
  INVOTASTIC_HOST,
  IS_LOCALHOST,
  LOGIN_STATE_COOKIE_PREFIX,
} from './constants';
import {
  createCodeChallenge,
  createUniqueCryptoStr,
  decryptLoginStateData,
  encryptLoginStateData,
  getDeleteValueForLoginStateCookieHeader,
  isValidDomain,
  parseTenantDomainName,
  toQueryString,
  updateLoginStateCookie,
} from './helpers';

export function bearerToken(accessToken: string) {
  return { headers: { Authorization: `Bearer ${accessToken}` } };
}

/* ****************/
/* SDK CANDIDATES */
/* ****************/

export function serverRedirectToLogin(req: IncomingMessage) {
  const { headers, url } = req;
  const returnUrl = `http://${headers.host}${url}`;
  return {
    redirect: {
      destination: `http://${headers.host}/api/auth/login?return_url=${returnUrl}`,
      permanent: true,
    },
  };
}

export async function login(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');

  const { headers, query } = req;
  const { host } = headers;
  const { tenant_domain: tenantDomain, return_url: returnUrl, login_hint: loginHint } = query;

  const tenantDomainParam: string = Array.isArray(tenantDomain) ? tenantDomain[0] : tenantDomain || '';
  const tenantDomainName = IS_LOCALHOST ? tenantDomainParam : parseTenantDomainName(host);

  // Make sure domain is valid before attempting OAuth2 Auth Code flow for tenant-level login.
  if (!tenantDomainName) {
    console.error(`Tenant domain not found. Redirecting to application-level login.`);
    res.redirect(APPLICATION_LOGIN_URL);
    return;
  }
  if (!IS_LOCALHOST && !isValidDomain(host, tenantDomainName)) {
    console.error(`[${host}] has invalid domain suffix. Redirecting to application-level login.`);
    res.redirect(APPLICATION_LOGIN_URL);
    return;
  }

  const state = createUniqueCryptoStr();
  const codeVerifier = createUniqueCryptoStr();
  const loginStateData = { state, tenantDomainName, codeVerifier, returnUrl };

  // Store this auth request in a cookie for later when Wristband redirects to the callback endpoint.
  const sealedLoginStateData = await encryptLoginStateData(loginStateData);
  updateLoginStateCookie(req, res, state, sealedLoginStateData);

  const authorizeQuery = toQueryString({
    client_id: process.env.CLIENT_ID,
    response_type: 'code',
    redirect_uri: AUTH_CALLBACK_URL,
    state,
    scope: `openid offline_access profile email roles`,
    code_challenge: createCodeChallenge(codeVerifier),
    code_challenge_method: 'S256',
    nonce: createUniqueCryptoStr(),
    ...(loginHint && { login_hint: loginHint }),
  });

  /* WRISTBAND_TOUCHPOINT - AUTHENTICATION */
  // Redirect out to the Wristband authorize endpoint to start the login process via OAuth2 Auth Code flow.
  const hostname = `${tenantDomainName}-${process.env.APPLICATION_DOMAIN}`;
  res.redirect(`https://${hostname}/api/v1/oauth2/authorize?${authorizeQuery}`);
}

export async function callback(req: NextApiRequest, res: NextApiResponse): Promise<CallbackData | void> {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');

  const { cookies, query } = req;
  const { code, state, error, error_description: errorDescription } = query;

  // Grab the login state cookie.
  const matchingLoginCookieNames = Object.keys(cookies).filter((cookieName) =>
    cookieName.startsWith(`${LOGIN_STATE_COOKIE_PREFIX}${state}:`)
  );
  const cookieName = matchingLoginCookieNames[0];
  const loginStateCookie = cookies[cookieName];

  if (!loginStateCookie) {
    console.warn(`Login state cookie not found. Redirecting to application-level login.`);
    res.redirect(APPLICATION_LOGIN_URL);
    return;
  }

  // Delete the login state cookie.
  res.setHeader('Set-Cookie', getDeleteValueForLoginStateCookieHeader(cookieName));

  const unsealedLoginStateData = await decryptLoginStateData(loginStateCookie);
  const { codeVerifier, returnUrl, state: cookieState, tenantDomainName } = unsealedLoginStateData;
  // Tenant domain is only used for vanity domain URL format
  const tenantDomain = IS_LOCALHOST ? '' : `${tenantDomainName}.`;
  const tenantLoginUrl = `http://${tenantDomain}${INVOTASTIC_HOST}/api/auth/login`;

  // Safety check
  if (state !== cookieState) {
    console.warn(`Cookie state [${cookieState}] not equal to query state [${state}]`);
    res.redirect(tenantLoginUrl);
    return;
  }

  if (error) {
    if (error === 'login_required') {
      res.redirect(tenantLoginUrl);
      return;
    }

    throw new Error(`${error}: ${errorDescription}`);
  }

  if (!code || typeof code !== 'string') {
    console.warn(`Authorization code not found.`);
    res.redirect(tenantLoginUrl);
    return;
  }

  /* WRISTBAND_TOUCHPOINT - AUTHENTICATION */
  // Now exchange the auth code for a new access token.
  const tokenData = await wristbandService.exchangeAuthCodeForTokens(code, AUTH_CALLBACK_URL, codeVerifier);
  const {
    access_token: accessToken,
    expires_in: expiresIn,
    id_token: idToken,
    refresh_token: refreshToken,
  } = tokenData;

  /* WRISTBAND_TOUCHPOINT - RESOURCE API */
  // Get a minimal set of the user's data to store in their session data.
  const userinfo = await wristbandService.getUserinfo(accessToken);

  return {
    accessToken,
    expiresIn,
    idToken,
    ...(!!refreshToken && { refreshToken }),
    ...(!!returnUrl && { returnUrl }),
    tenantDomainName,
    userinfo,
  };
}

export async function logout(req: NextApiRequest, res: NextApiResponse, config: LogoutConfig = {}): Promise<void> {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');

  const { host } = req.headers;

  // Revoke the refresh token only if present.
  if (config.refreshToken) {
    try {
      /* WRISTBAND_TOUCHPOINT - RESOURCE API */
      await wristbandService.revokeRefreshToken(config.refreshToken);
    } catch (error) {
      // No need to block logout execution if revoking fails
      console.debug(`Revoking the refresh token failed during logout`);
    }
  }

  // Safety checks
  if (!config.tenantDomainName) {
    console.warn(`No session found. Redirecting to application-level login.`);
    res.redirect(APPLICATION_LOGIN_URL);
    return;
  }
  if (!IS_LOCALHOST && !isValidDomain(host, config.tenantDomainName)) {
    console.warn(`[${host}] has invalid domain. Redirecting to application-level login.`);
    res.redirect(APPLICATION_LOGIN_URL);
    return;
  }

  // The client ID is always required by the Wristband Logout Endpoint.
  const redirectUrl = config.redirectUrl ? `&redirect_url=${config.redirectUrl}` : '';
  const query = `client_id=${process.env.CLIENT_ID}${redirectUrl}`;
  const hostname = `${config.tenantDomainName}-${process.env.APPLICATION_DOMAIN}`;

  /* WRISTBAND_TOUCHPOINT - AUTHENTICATION */
  // Always perform logout redirect to the Wristband logout endpoint.
  res.redirect(`http://${hostname}/api/v1/logout?${query}`);
}

export async function refreshTokenIfExpired(refreshToken: string, expiresAt: number): Promise<TokenData | null> {
  // Safety checks
  if (!refreshToken) {
    throw new TypeError('Refresh token must be a valid string');
  }
  if (!expiresAt || expiresAt < 0) {
    throw new TypeError('The expiresAt field must be an integer greater than 0');
  }

  if (Date.now().valueOf() < expiresAt) {
    return null;
  }

  // Try up to 3 times to perform a token refresh.
  let tokenResponse: TokenResponse | null = null;
  await retry(
    async () => {
      tokenResponse = await wristbandService.refreshToken(refreshToken);
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
