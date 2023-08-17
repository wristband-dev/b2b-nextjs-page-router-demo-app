import * as React from 'react';

import { login } from '@/utils/auth';
import { apiClient as axios } from '@/client/browser-axios-client';

type Action = { type: string; isAuthenticated: boolean; user: User | null; tenantDomainName: string | null };
type Dispatch = (action: Action) => void;
type State = { isAuthenticated: boolean; user: User | null; tenantDomainName: string | null };
type AuthProviderProps = { children: React.ReactNode };

const initialState = { isAuthenticated: false, user: null, tenantDomainName: null };
const UPDATE_AUTH_STATE = 'UPDATE_AUTH_STATE';

const AuthStateContext = React.createContext<State | undefined>(undefined);
const AuthDispatchContext = React.createContext<Dispatch | undefined>(undefined);

function AuthReducer(state: State, action: Action) {
  switch (action.type) {
    case UPDATE_AUTH_STATE:
      return {
        ...state,
        isAuthenticated: action.isAuthenticated,
        user: action.user,
        tenantDomainName: action.tenantDomainName
      };
    default: {
      throw new Error(`Unhandled action type: ${action.type}`);
    }
  }
}

function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = React.useReducer(AuthReducer, initialState);

  // Bootstrap the application with the authenticated user's session data.
  React.useEffect(() => {
    axios.get('/api/auth/session', { baseURL: window.location.origin })
      .then((res: any) => {
        const { isAuthenticated, user, tenantDomainName } = res.data;

        if (!isAuthenticated) {
          login(window.location.href);
        } else {
          dispatch({ type: UPDATE_AUTH_STATE, isAuthenticated, user, tenantDomainName });
        }
      })
      .catch((error: any) => {
        console.log(error);
      });
  }, []);

  return (
    <AuthStateContext.Provider value={state}>
      <AuthDispatchContext.Provider value={dispatch}>{children}</AuthDispatchContext.Provider>
    </AuthStateContext.Provider>
  );
}

function useSession() {
  const context = React.useContext(AuthStateContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a AuthProvider');
  }
  return context;
}

export { AuthProvider, useSession };
