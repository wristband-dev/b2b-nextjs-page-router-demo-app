import type { NextApiRequest, NextApiResponse } from 'next';

import { getSession } from '@/session/iron-session';

type Data = { message: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  const session = await getSession(req, res);
  const { isAuthenticated } = session;

  /* WRISTBAND_TOUCHPOINT - AUTHENTICATION */
  if (!isAuthenticated) {
    return res.status(401).end();
  }

  return res.status(200).json({ message: 'Hello World!' });
}
