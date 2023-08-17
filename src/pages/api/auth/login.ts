import type { NextApiRequest, NextApiResponse } from 'next'

import {
  createCodeChallenge,
  createUniqueCryptoStr,
  encryptLoginStateData,
  isValidDomain,
  parseTenantDomainName,
  setNoCacheHeaders,
  toQueryString,
  updateLoginStateCookie
} from '@/utils/helpers';
import { APPLICATION_LOGIN_URL, AUTH_CALLBACK_URL, IS_LOCALHOST } from '@/utils/constants';

export default async function handleLogin(req: NextApiRequest, res: NextApiResponse) {
  const { headers, query } = req;
  const { host } = headers;
  const { tenant_domain: tenantDomain, return_url: returnUrl, login_hint: loginHint } = query;

  setNoCacheHeaders(res);

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
