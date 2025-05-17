import { getIronSession, IronSession, SessionOptions } from 'iron-session';
import * as http from 'http';

import { SESSION_COOKIE_NAME, SESSION_COOKIE_SECRET } from '@/utils/constants';
import { User } from '@/types/wristband-types';

type SessionData = {
  accessToken: string;
  csrfToken: string;
  expiresAt: number;
  isAuthenticated: boolean;
  refreshToken?: string;
  tenantCustomDomain?: string;
  tenantDomainName: string;
  user: User;
};

const sessionOptions: SessionOptions = {
  cookieName: SESSION_COOKIE_NAME,
  password: SESSION_COOKIE_SECRET,
  cookieOptions: {
    httpOnly: true,
    maxAge: 1800,
    path: '/',
    sameSite: 'lax',
    // NOTE: If deploying your own app to production, do not disable secure cookies.
    secure: false,
  },
};

export async function middlewareGetSession(req: Request, res: Response): Promise<IronSession<SessionData>> {
  return await getIronSession<SessionData>(req, res, sessionOptions);
}

export function getSession(req: http.IncomingMessage, res: http.ServerResponse): Promise<IronSession<SessionData>> {
  return getIronSession(req, res, sessionOptions);
}
