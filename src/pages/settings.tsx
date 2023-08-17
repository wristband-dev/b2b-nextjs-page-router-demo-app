import { GetServerSideProps, GetServerSidePropsContext } from 'next';

import * as wristbandService from '@/services/wristband-service';
import { useSession } from '@/context/auth-context'
import { withSessionSsr } from '@/utils/session/with-session';

type SettingsPageProps = {
  tenant: Tenant;
}

export default function SettingsPage({ tenant }: SettingsPageProps) {
  const { isAuthenticated, user } = useSession();
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
  )
}

export const getServerSideProps: GetServerSideProps = withSessionSsr(
  async function (context: GetServerSidePropsContext) {
    const { req } = context;
    const { session } = req;
    const { accessToken, user } = session;

    let tenant;
    try {
      tenant = await wristbandService.getTenant(accessToken, user.tenantId);
    } catch (err: any) {
      console.log(err);
      throw err;
    }
  
    return {
      props: { tenant },
    };
  }
);
