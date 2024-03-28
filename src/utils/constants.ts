export const IS_LOCALHOST = process.env.DOMAIN_FORMAT === 'LOCALHOST';
export const INVOTASTIC_HOST = IS_LOCALHOST ? 'localhost:6001' : 'business.invotastic.com:6001';
const authCallbackTenantDomain = IS_LOCALHOST ? '' : '{tenant_domain}.';

export const APPLICATION_LOGIN_URL = `https://${process.env.APPLICATION_DOMAIN}/login`;
export const AUTH_CALLBACK_URL = `http://${authCallbackTenantDomain}${INVOTASTIC_HOST}/api/auth/callback`;
export const LOGIN_STATE_COOKIE_PREFIX = 'login:';
export const LOGIN_STATE_COOKIE_SECRET = '7ffdbecc-ab7d-4134-9307-2dfcc52f7475';
export const SESSION_COOKIE_NAME = 'sid';
export const SESSION_COOKIE_SECRET = '96bf13d5-b5c1-463a-812c-0d8db87c0ec5';

export const JSON_MEDIA_TYPE = 'application/json;charset=UTF-8';
