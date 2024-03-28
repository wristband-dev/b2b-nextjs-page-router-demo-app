/**
 * Represents the callback data received after authentication.
 * @typedef {TokenData} CallbackData
 * @property {Object.<string, any>} [customState] - Custom state data received in the callback.
 * @property {string} [returnUrl] - The URL to return to after authentication.
 * @property {string} [tenantDomainName] - The domain name of the tenant the user belongs to.
 * @property {Userinfo} userinfo - User information received in the callback.
 */
export type CallbackData = TokenData & {
  customState?: { [key: string]: unknown };
  returnUrl?: string;
  tenantDomainName: string;
  userinfo: Userinfo;
};

/**
 * Represents the token data received after authentication.
 * @typedef {Object} TokenData
 * @property {string} accessToken - The access token.
 * @property {number} expiresIn - The durtaion from the current time until the access token is expired (in seconds).
 * @property {string} idToken - The ID token.
 * @property {string} [refreshToken] - The refresh token.
 */
export type TokenData = {
  accessToken: string;
  expiresIn: number;
  idToken: string;
  refreshToken?: string;
};

/**
 * Represents the configuration for logout.
 * @typedef {Object} LogoutConfig
 * @property {string} [refreshToken] - The refresh token to revoke during logout.
 * @property {string} [tenantDomainName] - The domain name of the tenant the user belongs to.
 * @property {string} [redirectUrl] - Optional URL that the logout endpoint will redirect to after completing the
 * logout operation.
 */
export type LogoutConfig = {
  refreshToken?: string;
  tenantDomainName?: string;
  redirectUrl?: string;
};
