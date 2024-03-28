import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/utils/iron-session';

export default async function sessionRoute(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req, res);
  const { isAuthenticated, tenantDomainName, user } = session;
  res.status(200).json({
    isAuthenticated,
    user: isAuthenticated ? user : null,
    tenantDomainName: isAuthenticated ? tenantDomainName : null,
  });
}
