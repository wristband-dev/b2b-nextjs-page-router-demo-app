import React, { createContext, useEffect, useState } from 'react';

import { clientRedirectToLogin, clientRedirectToLogout, isUnauthorizedError } from '@/utils/helpers';
import { User } from '@/types/wristband-types';
import frontendApiService from '@/services/frontend-api-service';

type State = { isAuthenticated: boolean; isLoading: boolean; user: User | null; tenantDomainName: string | null };
const AuthContext = createContext<State>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  tenantDomainName: null,
});

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [tenantDomainName, setTenantDomainName] = useState<string | null>(null);

  // Bootstrap the application with the authenticated user's session data.
  useEffect(() => {
    const fetchSession = async () => {
      try {
        /* WRISTBAND_TOUCHPOINT - AUTHENTICATION */
        const sessionData = await frontendApiService.getSession();
        const { user, tenantDomainName } = sessionData;

        setIsLoading(false);
        setIsAuthenticated(true);
        setUser(user);
        setTenantDomainName(tenantDomainName);
      } catch (error) {
        console.log(error);

        if (isUnauthorizedError(error)) {
          // We want to preserve the page route that the user lands on when they come back after re-authentication.
          clientRedirectToLogin(window.location.href);
        } else {
          clientRedirectToLogout();
        }
      }
    };

    fetchSession();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, tenantDomainName }}>
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { AuthProvider, useAuth };
