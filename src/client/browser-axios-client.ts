import axios from 'axios';
import Agent from 'agentkeepalive';
const HttpsAgent = Agent.HttpsAgent;

import { unauthorizedAccessInterceptor } from './unauthorized-access-interceptor';
import { JSON_MEDIA_TYPE } from '@/utils/constants';

const defaultOptions = {
  httpAgent: new Agent({
    maxSockets: 100,
    maxFreeSockets: 10,
    timeout: 60000,
    freeSocketTimeout: 30000,
  }),
  httpsAgent: new HttpsAgent({ rejectUnauthorized: !process.env.NEXT_PUBLIC_TRUST_SELF_SIGNED_CERT }),
  headers: { 'Content-Type': JSON_MEDIA_TYPE, Accept: JSON_MEDIA_TYPE },
  maxRedirects: 0,
};

const apiClient = axios.create(defaultOptions);

apiClient.interceptors.response.use(undefined, unauthorizedAccessInterceptor);

export { apiClient };
