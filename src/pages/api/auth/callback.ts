import type { NextApiRequest, NextApiResponse } from 'next'

import { withSessionRoute } from "@/utils/session/with-session";
import * as wristbandService from '@/services/wristband-service';
import {
  calculateExpTimeWithBuffer, 
  decryptLoginStateData,
  getDeleteValueForLoginStateCookieHeader,
  parseUserinfo,
  setNoCacheHeaders
} from '@/utils/helpers';
import {
  APPLICATION_LOGIN_URL,
  AUTH_CALLBACK_URL,
  INVOTASTIC_HOST,
  IS_LOCALHOST,
  LOGIN_STATE_COOKIE_PREFIX
} from '@/utils/constants';

export default withSessionRoute(callbackRoute);

async function callbackRoute(req: NextApiRequest, res: NextApiResponse) {
  const { cookies, query } = req;
  const { code, state, error, error_description: errorDescription } = query;

  setNoCacheHeaders(res);

  // Grab the login state cookie.
  const matchingLoginCookieNames = Object.keys(cookies)
    .filter((cookieName) => cookieName.startsWith(`${LOGIN_STATE_COOKIE_PREFIX}${state}:`));
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
  const { access_token: accessToken, expires_in: expiresIn, refresh_token: refreshToken } = tokenData;

  /* WRISTBAND_TOUCHPOINT - RESOURCE API */
  // Get a minimal set of the user's data to store in their session data.
  const userinfo = await wristbandService.getUserinfo(accessToken);

  // Save the user's application session data into the session cookie.
  req.session.accessToken = accessToken;
  req.session.expiresAt = calculateExpTimeWithBuffer(expiresIn);
  req.session.refreshToken = refreshToken;
  req.session.tenantDomainName = tenantDomainName;
  req.session.user = parseUserinfo(userinfo);
  await req.session.save();

  // Send the user back to the Invotastic application.
  res.redirect(returnUrl || `http://${tenantDomain}${INVOTASTIC_HOST}`);
}
