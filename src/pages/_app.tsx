import type { AppProps } from 'next/app';
import { WristbandAuthProvider } from '@wristband/react-client-auth';

import '@/styles/globals.css';

import Layout from '@/components/root-layout';
import { MySessionMetadata } from '@/types/wristband-types';

export default function App({ Component, pageProps }: AppProps) {
  return (
    /* WRISTBAND_TOUCHPOINT - AUTHENTICATION */
    <WristbandAuthProvider<MySessionMetadata>
      loginUrl="/api/auth/login"
      logoutUrl="/api/auth/logout"
      sessionUrl="/api/v1/session"
    >
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </WristbandAuthProvider>
  );
}
