import React, { createContext, useEffect, useState } from 'react';

import { clientRedirectTologin, clientRedirectToLogout } from '@/auth/client-auth';
import { apiClient as axios } from '@/client/browser-axios-client';
import { User } from '@/types';

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
        const res = await axios.get('/api/auth/session', { baseURL: window.location.origin });
        const { isAuthenticated, user, tenantDomainName } = res.data;
        if (!isAuthenticated) {
          clientRedirectTologin(window.location.href);
        } else {
          setIsAuthenticated(true);
          setUser(user);
          setTenantDomainName(tenantDomainName);
        }
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
