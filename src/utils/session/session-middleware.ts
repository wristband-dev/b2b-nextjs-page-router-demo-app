import { getIronSession } from 'iron-session/edge';
import * as http from 'http';

import { sessionOptions } from './session-options';

export function getSessionMiddleware(req: http.IncomingMessage | Request, res: http.ServerResponse | Response) {
  return getIronSession(req, res, sessionOptions);
}
