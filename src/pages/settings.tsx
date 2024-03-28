import { GetServerSideProps, GetServerSidePropsContext } from 'next';

import * as wristbandService from '@/services/wristband-service';
import { useAuth } from '@/context/auth-context';
import { getSession } from '@/utils/iron-session';
import { Tenant } from '@/types';
import { serverRedirectToLogin, refreshTokenIfExpired } from '@/utils/server-auth';

type SettingsPageProps = {
  tenant: Tenant;
};

export default function SettingsPage({ tenant }: SettingsPageProps) {
  const { isAuthenticated, user } = useAuth();
  const { id, applicationId, vanityDomain, domainName, displayName, description, signupEnabled, status } = tenant;

  return (
    <section>
      <div style={{ margin: '0 auto' }}>
        <h1 className="text-3xl font-bold underline">Settings</h1>
      </div>

      <div style={{ margin: '2rem auto' }}>
        <h3>Who is authenticated?</h3>
        <h4>{user ? `${user.email}` : 'Noboby'}</h4>
      </div>

      {isAuthenticated && (
        <div style={{ margin: '2rem auto' }}>
          <h3>Tenant Info</h3>
          <p>ID: {id}</p>
          <p>Application ID: {applicationId}</p>
          <p>Vanity Domain: {vanityDomain}</p>
          <p>Domain Name: {domainName}</p>
          <p>Display Name: {displayName}</p>
          <p>Description: {description}</p>
          <p>Tenant Signup Enabled: {signupEnabled ? 'Yes' : 'No'}</p>
          <p>Status: {status}</p>
        </div>
      )}
    </section>
  );
}

export const getServerSideProps: GetServerSideProps = async function (context: GetServerSidePropsContext) {
  const { req, res } = context;
  const session = await getSession(req, res);
  const { expiresAt, isAuthenticated, refreshToken, user } = session;

  /* WRISTBAND_TOUCHPOINT - AUTHENTICATION */
  if (!isAuthenticated) {
    return serverRedirectToLogin(req);
  }

  /* WRISTBAND_TOUCHPOINT - AUTHENTICATION */
  try {
    const tokenData = await refreshTokenIfExpired(refreshToken!, expiresAt);
    if (tokenData) {
      session.accessToken = tokenData.accessToken;
      // Convert the "expiresIn" seconds into an expiration date with the format of milliseconds from the epoch.
      session.expiresAt = Date.now() + tokenData.expiresIn * 1000;
      session.refreshToken = tokenData.refreshToken;
    }
  } catch (error) {
    console.log(`Token refresh failed: `, error);
    return serverRedirectToLogin(req);
  }

  // Save the session in order to "touch" it (even if there is no new token data).
  await session.save();

  try {
    const tenant = await wristbandService.getTenant(session.accessToken, user.tenantId);
    return { props: { tenant } };
  } catch (err: unknown) {
    console.log(err);
    throw err;
  }
};
