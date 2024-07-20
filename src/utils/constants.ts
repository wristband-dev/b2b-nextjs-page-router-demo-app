export const IS_LOCALHOST: boolean = process.env.DOMAIN_FORMAT === 'LOCALHOST';
export const INVOTASTIC_HOST: string = IS_LOCALHOST ? 'localhost:6001' : 'business.invotastic.com:6001';

export const HTTP_401_STATUS = { status: 401 };
export const JSON_MEDIA_TYPE: string = 'application/json;charset=UTF-8';
export const SESSION_COOKIE_NAME: string = 'session';
export const SESSION_COOKIE_SECRET: string = '96bf13d5-b5c1-463a-812c-0d8db87c0ec5';
export const UNAUTHORIZED = { statusText: 'Unauthorized' };
