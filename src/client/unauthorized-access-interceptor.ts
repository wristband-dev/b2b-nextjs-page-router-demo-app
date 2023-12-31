import { login } from '@/utils/auth';
import { AxiosError } from 'axios';

/**
 * This response interceptor will trigger a redirect to the login route in the event that
 * a 401 Unauthorized HTTP status is returned.
 */
export const unauthorizedAccessInterceptor = (error: AxiosError) => {
  if (error.response && error.response.status === 401) {
    login(window.location.href);
  }

  return Promise.reject(error);
};
