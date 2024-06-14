import axios, { AxiosError } from 'axios';
import Agent from 'agentkeepalive';
const HttpsAgent = Agent.HttpsAgent;

import { clientRedirectTologin } from '@/auth/client-auth';
import { JSON_MEDIA_TYPE } from '@/utils/constants';

// This interceptor redirect to the /login route when a 401 Unauthorized HTTP status is returned.
function unauthorizedAccessInterceptor(error: AxiosError) {
  if (error.response && error.response.status === 401) {
    clientRedirectTologin(window.location.href);
  }

  return Promise.reject(error);
}

const defaultOptions = {
  httpAgent: new Agent({
    maxSockets: 100,
    maxFreeSockets: 10,
    timeout: 60000,
    freeSocketTimeout: 30000,
  }),
  // NOTE: If deploying your own app to production (and using Axios), do not set rejectUnauthorized to false.
  httpsAgent: new HttpsAgent({ rejectUnauthorized: false }),
  headers: { 'Content-Type': JSON_MEDIA_TYPE, Accept: JSON_MEDIA_TYPE },
  maxRedirects: 0,
};

const apiClient = axios.create(defaultOptions);
apiClient.interceptors.response.use(undefined, unauthorizedAccessInterceptor);

export { apiClient };
