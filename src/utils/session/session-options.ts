import { IronSessionOptions } from "iron-session";

import { SESSION_COOKIE_NAME } from "@/utils/constants";

export const sessionOptions: IronSessionOptions  = {
  cookieName: SESSION_COOKIE_NAME,
  password: process.env.SESSION_COOKIE_SECRET!,
  cookieOptions: {
    httpOnly: true,
    // NOTE: Have to add 60s to counter Iron-session's max age logic.
    maxAge: 1860,
    path: '/',
    sameSite: 'lax',
    // secure: true should be used in production (HTTPS) but can't be used in development (HTTP)
    secure: process.env.NODE_ENV === "production",
  },
};
