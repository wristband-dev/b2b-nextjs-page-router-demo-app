import { createWristbandAuth } from '@wristband/nextjs-auth';

import { INVOTASTIC_HOST } from '@/utils/constants';

export const wristbandAuth = createWristbandAuth({
  clientId: process.env.CLIENT_ID!,
  clientSecret: process.env.CLIENT_SECRET!,
  // NOTE: If deploying your own app to production, do not disable secure cookies.
  dangerouslyDisableSecureCookies: true,
  loginStateSecret: '7ffdbecc-ab7d-4134-9307-2dfcc52f7475',
  loginUrl: `http://${INVOTASTIC_HOST}/api/auth/login`,
  redirectUri: `http://${INVOTASTIC_HOST}/api/auth/callback`,
  scopes: ['openid', 'offline_access', 'profile', 'email', 'roles'],
  useCustomDomains: false,
  useTenantSubdomains: false,
  wristbandApplicationDomain: process.env.APPLICATION_VANITY_DOMAIN!,
});
