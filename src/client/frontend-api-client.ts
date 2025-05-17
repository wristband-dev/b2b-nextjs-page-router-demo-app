import axios from 'axios';

import { CSRF_TOKEN_COOKIE_NAME, CSRF_TOKEN_HEADER_NAME, JSON_MEDIA_TYPE } from '@/utils/constants';

const defaultOptions = {
  // Set up baseURL based on whether this is server-side or client-side
  baseURL: typeof window !== 'undefined' ? `${window.location.origin}/api/v1` : undefined,
  headers: { 'Content-Type': JSON_MEDIA_TYPE, Accept: JSON_MEDIA_TYPE },
  xsrfCookieName: CSRF_TOKEN_COOKIE_NAME,
  xsrfHeaderName: CSRF_TOKEN_HEADER_NAME,
};

const frontendApiClient = axios.create(defaultOptions);

export default frontendApiClient;
