import { NextApiRequest, NextApiResponse } from 'next';
import Iron from '@hapi/iron';
import crypto from 'crypto';
import moment from 'moment';

import { INVOTASTIC_HOST, LOGIN_STATE_COOKIE_PREFIX, LOGIN_STATE_COOKIE_SECRET } from './constants';
import { Userinfo } from '@/types';

function base64URLEncode(strBufferToEncode: Buffer) {
  return strBufferToEncode.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function calculateExpTimeWithBuffer(expiresInSeconds: number) {
  // 5 minute safety buffer included for expiration checks
  const expiresInSecondsWithBuffer = expiresInSeconds - 300;
  const expiresInMilliseconds = expiresInSecondsWithBuffer * 1000;
  return Date.now() + expiresInMilliseconds;
}

export function createCodeChallenge(codeVerifier: string) {
  return base64URLEncode(crypto.createHash('sha256').update(codeVerifier).digest());
}

export function createUniqueCryptoStr() {
  return base64URLEncode(crypto.randomBytes(32));
}

export async function decryptLoginStateData(loginStateCookie: string) {
  const unsealedLoginStateData = await Iron.unseal(loginStateCookie, LOGIN_STATE_COOKIE_SECRET!, Iron.defaults);
  return unsealedLoginStateData;
}

export async function encryptLoginStateData(loginStateData: object) {
  const sealedLoginStateData = await Iron.seal(loginStateData, LOGIN_STATE_COOKIE_SECRET!, Iron.defaults);
  return sealedLoginStateData;
}

export function getDeleteValueForLoginStateCookieHeader(cookieName: string): string[] {
  return [[`${cookieName}=;`, 'Path=/;', `Expires=${new Date(0).toString()};`, 'Max-Age=-1;'].join(' ')];
}

export function isValidDomain(host: string = '', tenantDomainName: string = '') {
  return host === `${tenantDomainName}.${INVOTASTIC_HOST}`;
}

export function parseTenantDomainName(host: string = '') {
  return host.substring(0, host.indexOf('.'));
}

export function toQueryString(queryParams = {}) {
  const params = new URLSearchParams(queryParams);
  return params.toString();
}

export function updateLoginStateCookie(req: NextApiRequest, res: NextApiResponse, state: string, cookieData: string) {
  // The max amount of concurrent login state cookies we allow is 3.
  const responseCookieArray = [];
  const allLoginCookieNames = Object.keys(req.cookies).filter((cookieName) => {
    return cookieName.startsWith(`${LOGIN_STATE_COOKIE_PREFIX}`);
  });

  // Retain only the 2 cookies with the most recent timestamps.
  if (allLoginCookieNames.length >= 3) {
    const mostRecentTimestamps = allLoginCookieNames
      .map((cookieName: string) => {
        return cookieName.split(':')[2];
      })
      .sort((a: string, b: string) => {
        return +b - +a;
      })
      .slice(0, 2);

    allLoginCookieNames.forEach((cookieName) => {
      const timestamp = cookieName.split(':')[2];

      // If 3 cookies exist, then we delete the oldest one to make room for the new one.
      if (!mostRecentTimestamps.includes(timestamp)) {
        const staleCookieHeaderValue = getDeleteValueForLoginStateCookieHeader(cookieName);
        responseCookieArray.push(staleCookieHeaderValue);
      }
    });
  }

  // Now add the new login state cookie with a 1-hour expiration time.
  const newCookieName = `${LOGIN_STATE_COOKIE_PREFIX}${state}:${Date.now()}`;
  const newCookieHeaderValue = [
    `${newCookieName}=${cookieData};`,
    'HTTPOnly;',
    `Expires=${moment(Date.now()).add(1, 'hours').toDate().toString()};`,
    'Max-Age=3600;',
    'Path=/;',
    'SameSite=lax;',
  ].join(' ');

  responseCookieArray.push(newCookieHeaderValue);
  res.setHeader('Set-Cookie', responseCookieArray);
}

export function parseUserinfo(userinfo: Userinfo) {
  return {
    id: userinfo.sub,
    tenantId: userinfo.tnt_id,
    applicationId: userinfo.app_id,
    identityProviderName: userinfo.idp_name,
    email: userinfo.email,
    emailVerified: userinfo.email_verified,
    username: userinfo.preferred_username,
    fullName: userinfo.name,
    firstName: userinfo.given_name,
    middleName: userinfo.middle_name,
    lastName: userinfo.family_name,
    nickname: userinfo.nickname,
    pictureURL: userinfo.picture,
    gender: userinfo.gender,
    birthdate: userinfo.birthdate,
    timezone: userinfo.zoneinfo,
    locale: userinfo.locale,
    updatedAt: userinfo.updated_at,
    roles: userinfo.roles,
  };
}
