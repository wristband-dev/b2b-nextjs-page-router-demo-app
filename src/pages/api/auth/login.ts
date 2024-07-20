import type { NextApiRequest, NextApiResponse } from 'next';

import { wristbandAuth } from '@/wristband-auth';

export default async function handleLogin(req: NextApiRequest, res: NextApiResponse) {
  try {
    /* WRISTBAND_TOUCHPOINT - AUTHENTICATION */
    // Redirect out to the Wristband authorize endpoint to start the login process via OAuth2/OIDC Auth Code flow.
    await wristbandAuth.pageRouter.login(req, res);
  } catch (error) {
    console.error(error);
  }
}
