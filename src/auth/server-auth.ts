import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingMessage } from 'http';

import {
  CallbackData,
  CallbackResult,
  CallbackResultType,
  LoginConfig,
  LoginState,
  LogoutConfig,
  TokenResponse,
  Userinfo,
} from '@/types';
import * as authService from '@/services/auth-service';
import {
  APPLICATION_LOGIN_URL,
  AUTH_CALLBACK_URL,
  INVOTASTIC_HOST,
  IS_LOCALHOST,
  LOGIN_REQUIRED_ERROR,
  LOGIN_STATE_COOKIE_SECRET,
} from '@/utils/constants';
import {
  createLoginState,
  createLoginStateCookie,
  decryptLoginState,
  encryptLoginState,
  getAndClearLoginStateCookie,
  getAuthorizeUrl,
  parseTenantSubdomain,
  resolveTenantDomain,
} from '@/utils/helpers';
import { WristbandError } from '@/error';

/* ****************/
/* SDK CANDIDATES */
/* ****************/

export function serverRedirectToLogin(req: IncomingMessage) {
  const { headers, url } = req;
  const returnUrl = `http://${headers.host}${url}`;
  return {
    redirect: {
      destination: `http://${headers.host}/api/auth/login?return_url=${returnUrl}`,
      permanent: false,
    },
  };
}

export async function login(req: NextApiRequest, res: NextApiResponse, config: LoginConfig = {}): Promise<void> {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');

  // Make sure a valid tenantDomainName exists for multi-tenant apps.
  let tenantDomainName: string = '';
  tenantDomainName = resolveTenantDomain(req, !IS_LOCALHOST, INVOTASTIC_HOST);
  if (!tenantDomainName) {
    res.redirect(APPLICATION_LOGIN_URL);
    return;
  }

  // Create the login state which will be cached in a cookie so that it can be accessed in the callback.
  const customState = !!config.customState && !!Object.keys(config.customState).length ? config.customState : undefined;
  const loginState: LoginState = createLoginState(req, AUTH_CALLBACK_URL, { tenantDomainName, customState });

  // Clear any stale login state cookies and add a new one for the current request.
  const encryptedLoginState: string = await encryptLoginState(loginState, LOGIN_STATE_COOKIE_SECRET);
  createLoginStateCookie(req, res, loginState.state, encryptedLoginState, true);

  // Create the Wristband Authorize Endpoint URL which the user will get redirectd to.
  const authorizeUrl: string = getAuthorizeUrl(req, {
    wristbandApplicationDomain: process.env.APPLICATION_DOMAIN!,
    useCustomDomains: false,
    clientId: process.env.CLIENT_ID!,
    redirectUri: AUTH_CALLBACK_URL,
    state: loginState.state,
    codeVerifier: loginState.codeVerifier,
    scopes: ['openid', 'offline_access', 'profile', 'email', 'roles'],
    tenantDomainName,
  });

  // Perform the redirect to Wristband's Authorize Endpoint.
  res.redirect(authorizeUrl);
  return;
}

export async function callback(req: NextApiRequest, res: NextApiResponse): Promise<CallbackResult> {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');

  // Safety checks -- Wristband backend should never send bad query params
  const { code, state: paramState, error, error_description: errorDescription } = req.query;
  if (!paramState || typeof paramState !== 'string') {
    throw new TypeError('Invalid query parameter [state] passed from Wristband during callback');
  }
  if (!!code && typeof code !== 'string') {
    throw new TypeError('Invalid query parameter [code] passed from Wristband during callback');
  }
  if (!!error && typeof error !== 'string') {
    throw new TypeError('Invalid query parameter [error] passed from Wristband during callback');
  }
  if (!!errorDescription && typeof errorDescription !== 'string') {
    throw new TypeError('Invalid query parameter [error_description] passed from Wristband during callback');
  }

  const appLoginUrl: string = APPLICATION_LOGIN_URL;
  const tenantSubdomain: string = !IS_LOCALHOST ? parseTenantSubdomain(req, INVOTASTIC_HOST) : '';
  let tenantLoginUrl: string =
    !IS_LOCALHOST && !!tenantSubdomain ? `http://${tenantSubdomain}${INVOTASTIC_HOST}/api/auth/login` : '';

  // Make sure the login state cookie exists, extract it, and set it to be cleared by the server.
  const loginStateCookie: string = getAndClearLoginStateCookie(req, res);
  if (!loginStateCookie) {
    console.warn(`Login state cookie not found. Redirecting to login.`);
    return { redirectUrl: tenantLoginUrl || appLoginUrl, result: CallbackResultType.REDIRECT_REQUIRED };
  }

  const loginState: LoginState = await decryptLoginState(loginStateCookie, LOGIN_STATE_COOKIE_SECRET);
  const { codeVerifier, customState, returnUrl, state: cookieState, tenantDomainName } = loginState;

  // Ensure there is a proper tenantDomain
  if (IS_LOCALHOST && !tenantDomainName) {
    return { redirectUrl: appLoginUrl, result: CallbackResultType.REDIRECT_REQUIRED };
  }
  if (!IS_LOCALHOST && tenantSubdomain !== tenantDomainName) {
    return {
      redirectUrl: `http://${tenantDomainName}.${INVOTASTIC_HOST}/api/auth/login`,
      result: CallbackResultType.REDIRECT_REQUIRED,
    };
  }

  tenantLoginUrl = !IS_LOCALHOST
    ? tenantLoginUrl
    : `http://${INVOTASTIC_HOST}/api/auth/login?tenant_domain=${tenantDomainName}`;

  // Check for any potential error conditions
  if (paramState !== cookieState) {
    return { redirectUrl: tenantLoginUrl, result: CallbackResultType.REDIRECT_REQUIRED };
  }
  if (error) {
    if (error.toLowerCase() === LOGIN_REQUIRED_ERROR) {
      return { redirectUrl: tenantLoginUrl, result: CallbackResultType.REDIRECT_REQUIRED };
    }
    throw new WristbandError(error, errorDescription);
  }

  /* WRISTBAND_TOUCHPOINT - AUTHENTICATION */
  // Exchange the authorization code for tokens
  if (!code) {
    throw new TypeError('Invalid query parameter [code] passed from Wristband during callback');
  }
  const tokenResponse: TokenResponse = await authService.exchangeAuthCodeForTokens(
    code,
    AUTH_CALLBACK_URL,
    codeVerifier
  );
  const {
    access_token: accessToken,
    id_token: idToken,
    refresh_token: refreshToken,
    expires_in: expiresIn,
  } = tokenResponse;

  /* WRISTBAND_TOUCHPOINT - RESOURCE API */
  // Get a minimal set of the user's data to store in their session data.
  // Fetch the userinfo for the user logging in.
  const userinfo: Userinfo = await authService.getUserinfo(accessToken);
  const callbackData: CallbackData = {
    accessToken,
    ...(!!customState && { customState }),
    expiresIn,
    idToken,
    ...(!!refreshToken && { refreshToken }),
    ...(!!returnUrl && { returnUrl }),
    tenantDomainName: tenantDomainName!,
    userinfo,
  };
  return { callbackData, result: CallbackResultType.COMPLETED };
}

export async function logout(req: NextApiRequest, res: NextApiResponse, config: LogoutConfig = {}): Promise<void> {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');

  const { host } = req.headers;

  // Revoke the refresh token only if present.
  if (config.refreshToken) {
    try {
      /* WRISTBAND_TOUCHPOINT - RESOURCE API */
      await authService.revokeRefreshToken(config.refreshToken);
    } catch (error) {
      // No need to block logout execution if revoking fails
      console.debug(`Revoking the refresh token failed during logout`);
    }
  }

  // The client ID is always required by the Wristband Logout Endpoint.
  const redirectUrl: string = config.redirectUrl ? `&redirect_url=${config.redirectUrl}` : '';
  const query: string = `client_id=${process.env.CLIENT_ID}${redirectUrl}`;

  // Construct the appropriate Logout Endpoint URL that the user will get redirected to.
  const appLoginUrl: string = APPLICATION_LOGIN_URL;
  if (!IS_LOCALHOST && host!.substring(host!.indexOf('.') + 1) !== INVOTASTIC_HOST) {
    console.warn(`No session found. Redirecting to application-level login.`);
    res.redirect(appLoginUrl);
    return;
  }
  if (IS_LOCALHOST && !config.tenantDomainName) {
    console.warn(`[${host}] has invalid domain. Redirecting to application-level login.`);
    res.redirect(appLoginUrl);
    return;
  }

  /* WRISTBAND_TOUCHPOINT - AUTHENTICATION */
  // Always perform logout redirect to the Wristband logout endpoint.
  const tenantDomain = !IS_LOCALHOST ? host!.substring(0, host!.indexOf('.')) : config.tenantDomainName;
  // const separator = this.useCustomDomains ? '.' : '-';
  const separator = '-';
  const logoutUrl = `https://${tenantDomain}${separator}${process.env.APPLICATION_DOMAIN}/api/v1/logout?${query}`;
  res.redirect(logoutUrl);
  return;
}
