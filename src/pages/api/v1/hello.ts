import type { NextApiRequest, NextApiResponse } from 'next';

import { getSession } from '@/utils/iron-session';
import { refreshTokenIfExpired } from '@/utils/server-auth';

type Data = { message: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  const session = await getSession(req, res);
  const { expiresAt, isAuthenticated, refreshToken } = session;

  if (!isAuthenticated) {
    return res.status(401).end('Unauthorized');
  }

  /* WRISTBAND_TOUCHPOINT - AUTHENTICATION */
  try {
    const tokenData = await refreshTokenIfExpired(refreshToken!, expiresAt);
    if (tokenData) {
      session.accessToken = tokenData.accessToken;
      // Convert the "expiresIn" seconds into an expiration date with the format of milliseconds from the epoch.
      session.expiresAt = Date.now() + tokenData.expiresIn * 1000;
      session.refreshToken = tokenData.refreshToken;
    }
  } catch (error) {
    console.log(`Token refresh failed: `, error);
    return res.status(401).end('Unauthorized');
  }

  // Save the session in order to "touch" it (even if there is no new token data).
  await session.save();

  return res.status(200).json({ message: 'Hello World!' });
}
