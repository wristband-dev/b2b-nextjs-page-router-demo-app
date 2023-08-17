export const IS_LOCALHOST = process.env.DOMAIN_FORMAT === 'LOCALHOST';
export const INVOTASTIC_HOST = IS_LOCALHOST ? 'localhost:6001' : 'business.invotastic.com:6001';
const authCallbackTenantDomain = IS_LOCALHOST ? '' : '{tenant_domain}.';

export const APPLICATION_LOGIN_URL = `https://${process.env.APPLICATION_DOMAIN}/login`;
export const AUTH_CALLBACK_URL = `http://${authCallbackTenantDomain}${INVOTASTIC_HOST}/api/auth/callback`;
export const LOGIN_STATE_COOKIE_PREFIX = 'login:';
export const SESSION_COOKIE_NAME = 'sid';

export const JSON_MEDIA_TYPE = 'application/json;charset=UTF-8';
