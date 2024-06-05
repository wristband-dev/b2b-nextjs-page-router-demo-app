import type { NextApiRequest, NextApiResponse } from 'next';

import { getSession } from '@/session/iron-session';
import { refreshTokenIfExpired } from '@/auth/server-auth';

type Data = { message: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  const session = await getSession(req, res);
  const { expiresAt, isAuthenticated, refreshToken } = session;
  console.log('API VALUES: ', expiresAt);

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
    // Save the session in order to "touch" it (even if there is no new token data).
    await session.save();
    return res.status(200).json({ message: 'Hello World!' });
  } catch (error) {
    console.log(`Token refresh failed: `, error);
    return res.status(401).end('Unauthorized');
  }
}
