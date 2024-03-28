import type { NextApiRequest, NextApiResponse } from 'next';

import { login } from '@/utils/server-auth';

export default async function handleLogin(req: NextApiRequest, res: NextApiResponse) {
  try {
    /* WRISTBAND_TOUCHPOINT - AUTHENTICATION */
    // Redirect out to the Wristband authorize endpoint to start the login process via OAuth2/OIDC Auth Code flow.
    await login(req, res);
  } catch (error) {
    console.error(error);
  }
}
