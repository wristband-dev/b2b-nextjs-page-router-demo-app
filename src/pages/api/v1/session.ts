import type { NextApiRequest, NextApiResponse } from 'next';

import { getSession } from '@/session/iron-session';

export default async function sessionRoute(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  const session = await getSession(req, res);
  const { isAuthenticated, tenantDomainName, user } = session;

  /* WRISTBAND_TOUCHPOINT - AUTHENTICATION */
  if (!isAuthenticated) {
    return res.status(401).end();
  }

  res.status(200).json({ user, tenantDomainName });
}
