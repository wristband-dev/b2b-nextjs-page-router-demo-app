/**
 * Represents the configuration for login.
 * @typedef {Object} LoginConfig
 * @property {Object.<string, unknown>} [customState] - Custom state data for the login request.
 */
export type LoginConfig = {
  customState?: { [key: string]: unknown };
};

/**
 * Represents all possible state for the current login request, which is stored in the login state cookie.
 * @typedef {Object} LoginState
 * @property {string} codeVerifier - The code verifier for PKCE.
 * @property {Object.<string, any>} [customState] - Custom state data for the login state.
 * @property {string} redirectUri - The redirect URI for callback after authentication.
 * @property {string} [returnUrl] - The URL to return to after authentication.
 * @property {string} state - The state of the login process.
 * @property {string} [tenantDomainName] - The domain name of the tenant the user belongs to.
 */
export type LoginState = {
  codeVerifier: string;
  customState?: { [key: string]: unknown };
  redirectUri: string;
  returnUrl?: string;
  state: string;
  tenantDomainName?: string;
};

/**
 * Represents the configuration for the map which is stored in login state cookie.
 * @typedef {Object} LoginStateMapConfig
 * @property {Object.<string, unknown>} [customState] - Custom state data for the login state map.
 * @property {string} [tenantDomainName] - The domain name of the tenant the user belongs to.
 */
export type LoginStateMapConfig = {
  customState?: { [key: string]: unknown };
  tenantDomainName?: string;
};

/**
 * Enum representing different possible results from the execution of the callback handler.
 */
export enum CallbackResultType {
  /**
   * Indicates that the callback is successfully completed and data is available for creating a session.
   */
  COMPLETED = 'COMPLETED',
  /**
   * Indicates that a redirect is required, generally to a login route or page.
   */
  REDIRECT_REQUIRED = 'REDIRECT_REQUIRED',
}

/**
 * Represents the result of the callback execution after authentication. It can be the set of callback
 * data necessary for creating an authenticated session, or it can be a redirect URL.
 * @typedef {Object} CallbackResult
 * @property {CallbackData} [callbackData] - The callback data received after authentication (COMPLETED only).
 * @property {string} [redirectUrl] - The URL where the user should be redirected to (REDIRECT_REQUIRED only).
 * @property {CallbackResultType} [result] - Enum representing the end result of callback execution.
 */
export type CallbackResult = {
  callbackData?: CallbackData;
  redirectUrl?: string;
  result: CallbackResultType;
};

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
