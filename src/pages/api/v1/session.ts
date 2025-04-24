import type { NextApiRequest, NextApiResponse } from 'next';

import { getSession } from '@/session/iron-session';

export default async function sessionRoute(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  const session = await getSession(req, res);
  const { user } = session;
  const { email, tenantId } = user;

  res.status(200).json({ userId: undefined, tenantId, metadata: { email } });
}
