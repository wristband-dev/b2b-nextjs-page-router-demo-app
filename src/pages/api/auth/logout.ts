import type { NextApiRequest, NextApiResponse } from 'next';

import { getSession } from '@/utils/iron-session';
import { SESSION_COOKIE_NAME } from '@/utils/constants';
import { logout } from '@/utils/server-auth';

export default async function logoutRoute(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req, res);
  const { tenantDomainName, refreshToken } = session;

  // Always destroy session.
  res.setHeader('Set-Cookie', `${SESSION_COOKIE_NAME}=; Max-Age=0; Path=/`);
  session.destroy();

  try {
    /* WRISTBAND_TOUCHPOINT - AUTHENTICATION */
    await logout(req, res, { tenantDomainName, refreshToken });
  } catch (error: unknown) {
    console.error(error);
  }
}
