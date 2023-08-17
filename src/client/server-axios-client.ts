import axios from 'axios';
import Agent from 'agentkeepalive';
const HttpsAgent = Agent.HttpsAgent;

import { JSON_MEDIA_TYPE } from '@/utils/constants';

const apiClient = axios.create({
  baseURL: `https://${process.env.APPLICATION_DOMAIN}/api/v1`,
  httpAgent: new Agent({
    maxSockets: 100,
    maxFreeSockets: 10,
    timeout: 60000,
    freeSocketTimeout: 30000,
  }),
  httpsAgent: new HttpsAgent({ rejectUnauthorized: !process.env.NEXT_PUBLIC_TRUST_SELF_SIGNED_CERT }),
  headers: { 'Content-Type': JSON_MEDIA_TYPE, Accept: JSON_MEDIA_TYPE },
  maxRedirects: 0,
});

export default apiClient;
