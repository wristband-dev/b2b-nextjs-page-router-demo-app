export type Tenant = {
  id: string;
  applicationId: string;
  vanityDomain: string;
  domainName: string;
  displayName: string;
  description: string;
  signupEnabled: boolean;
  status: string;
  publicMetadata: object;
  restrictedMetadata: object;
  metadata: {
    version: number;
    lastModifiedTime: string;
    creationTime: string;
    activationTime: string;
    deactivationTime: string;
  };
};

export type Role = {
  id: string;
  name: string;
  displayName: string;
};

export type User = {
  id: string;
  tenantId: string;
  applicationId: string;
  identityProviderName: string;
  email: string;
  emailVerified: boolean;
  username: string | null;
  fullName: string | null;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  nickname: string | null;
  pictureURL: string | null;
  gender: string | null;
  birthdate: string | null;
  timezone: string | null;
  locale: string | null;
  updatedAt: string | null;
  roles: Role[];
};

export type Userinfo = {
  sub: string;
  tnt_id: string;
  app_id: string;
  idp_name: string;
  email: string;
  email_verified: boolean;
  preferred_username: string | null;
  name: string | null;
  given_name: string | null;
  middle_name: string | null;
  family_name: string | null;
  nickname: string | null;
  picture: string | null;
  gender: string | null;
  birthdate: string | null;
  zoneinfo: string | null;
  locale: string | null;
  updated_at: string | null;
  roles: Role[];
};

export type MySessionMetadata = {
  email: string;
};
