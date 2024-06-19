export const IS_LOCALHOST: boolean = process.env.DOMAIN_FORMAT === 'LOCALHOST';
export const INVOTASTIC_HOST: string = IS_LOCALHOST ? 'localhost:6001' : 'business.invotastic.com:6001';
const authCallbackTenantDomain = IS_LOCALHOST ? '' : '{tenant_domain}.';

export const APPLICATION_LOGIN_URL: string = `https://${process.env.APPLICATION_DOMAIN}/login`;
export const AUTH_CALLBACK_URL: string = `http://${authCallbackTenantDomain}${INVOTASTIC_HOST}/api/auth/callback`;
export const FORM_URLENCOED_MEDIA_TYPE: string = 'application/x-www-form-urlencoded';
export const HTTP_401_STATUS = { status: 401 };
export const JSON_MEDIA_TYPE: string = 'application/json;charset=UTF-8';
export const LOGIN_REQUIRED_ERROR: string = 'login_required';
export const LOGIN_STATE_COOKIE_PREFIX: string = 'login:';
export const LOGIN_STATE_COOKIE_SECRET: string = '7ffdbecc-ab7d-4134-9307-2dfcc52f7475';
export const SESSION_COOKIE_NAME: string = 'sid';
export const SESSION_COOKIE_SECRET: string = '96bf13d5-b5c1-463a-812c-0d8db87c0ec5';
export const TENANT_DOMAIN_TOKEN: string = '{tenant_domain}';
export const UNAUTHORIZED = { statusText: 'Unauthorized' };
