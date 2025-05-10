import type { NextApiRequest, NextApiResponse } from 'next';

import { getSession } from '@/session/iron-session';
import { CSRF_TOKEN_COOKIE_NAME, SESSION_COOKIE_NAME } from '@/utils/constants';
import { wristbandAuth } from '@/wristband-auth';

export default async function logoutRoute(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req, res);
  const { refreshToken, tenantCustomDomain, tenantDomainName } = session;

  // Always destroy session and CSRF cookies.
  res.setHeader('Set-Cookie', [`${SESSION_COOKIE_NAME}=; Max-Age=0; Path=/`]);
  res.setHeader('Set-Cookie', [`${CSRF_TOKEN_COOKIE_NAME}=; Max-Age=0; Path=/`]);
  session.destroy();

  try {
    /* WRISTBAND_TOUCHPOINT - AUTHENTICATION */
    const logoutUrl = await wristbandAuth.pageRouter.logout(req, res, {
      refreshToken,
      tenantCustomDomain,
      tenantDomainName,
    });
    res.redirect(logoutUrl);
  } catch (error: unknown) {
    console.error(error);
  }
}
