import React, { createContext, useEffect, useState } from 'react';

import { clientRedirectToLogin, clientRedirectToLogout } from '@/utils/helpers';
import { User } from '@/types/wristband-types';

type State = { isAuthenticated: boolean; user: User | null; tenantDomainName: string | null };
const AuthContext = createContext<State>({ isAuthenticated: false, user: null, tenantDomainName: null });

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [tenantDomainName, setTenantDomainName] = useState<string | null>(null);

  // Bootstrap the application with the authenticated user's session data.
  useEffect(() => {
    const fetchSession = async () => {
      try {
        /* WRISTBAND_TOUCHPOINT - AUTHENTICATION */
        const res = await fetch(`/api/auth/session`, { cache: 'no-store', method: 'GET' });

        if (res.status !== 200) {
          clientRedirectToLogout();
          return;
        }

        const data = await res.json();
        const { isAuthenticated, user, tenantDomainName } = data;

        if (!isAuthenticated) {
          // We want to preserve the page route that the user lands on when they com back after re-authentication.
          clientRedirectToLogin(window.location.href);
          return;
        }

        setIsAuthenticated(true);
        setUser(user);
        setTenantDomainName(tenantDomainName);
      } catch (error) {
        console.log(error);
        clientRedirectToLogout();
      }
    };

    fetchSession();
  }, []);

  return <AuthContext.Provider value={{ isAuthenticated, user, tenantDomainName }}>{children}</AuthContext.Provider>;
}

function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { AuthProvider, useAuth };
