import type { NextApiRequest, NextApiResponse } from 'next'

import { withSessionRoute } from "@/utils/session/with-session";
import * as wristbandService from '@/services/wristband-service';
import { isValidDomain, setNoCacheHeaders } from '@/utils/helpers';
import { APPLICATION_LOGIN_URL, IS_LOCALHOST, SESSION_COOKIE_NAME } from '@/utils/constants';

export default withSessionRoute(logoutRoute);

async function logoutRoute(req: NextApiRequest, res: NextApiResponse) {
  const { headers, session } = req;
  const { host } = headers;

  setNoCacheHeaders(res);

  // Safety checks
  if (!session || !session.tenantDomainName) {
    console.warn(`No session found. Redirecting to application-level login.`);
    res.redirect(APPLICATION_LOGIN_URL);
    return;
  }

  const { tenantDomainName, refreshToken } = session;

  if (!IS_LOCALHOST && !isValidDomain(host, tenantDomainName)) {
    console.warn(`[${host}] has invalid domain. Redirecting to application-level login.`);
    res.redirect(APPLICATION_LOGIN_URL);
    return;
  } 

  // Revoke the refresh token only if present.
  if (refreshToken) {
    try {
      /* WRISTBAND_TOUCHPOINT - RESOURCE API */
      await wristbandService.revokeRefreshToken(refreshToken);
    } catch (error) {
      console.warn(`Revoking token during logout failed due to: ${error}`);
    }
  }

  // Always destroy session.
  session.destroy();

  /* WRISTBAND_TOUCHPOINT - AUTHENTICATION */
  // Always perform logout redirect to the Wristband logout endpoint.
  const hostname = `${tenantDomainName}-${process.env.APPLICATION_DOMAIN}`;
  res.redirect(`http://${hostname}/api/v1/logout?client_id=${process.env.CLIENT_ID}`);
}
