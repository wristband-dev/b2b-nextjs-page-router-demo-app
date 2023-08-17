import type { NextApiRequest, NextApiResponse } from 'next';
import { withSessionRoute } from "@/utils/session/with-session";

export default withSessionRoute(sessionRoute);

async function sessionRoute(req: NextApiRequest, res: NextApiResponse) {
  const { session } = req;
  const isAuthenticated = session && session.accessToken && session.user;
  res.status(200).json({
    isAuthenticated, 
    user: isAuthenticated ? session.user : null,
    tenantDomainName: isAuthenticated ? session.tenantDomainName : null
  });
}
