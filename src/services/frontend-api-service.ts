import frontendApiClient from '@/client/frontend-api-client';

async function getSession() {
  const response = await frontendApiClient.get(`/session`, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });
  return response.data;
}

async function sayHello() {
  const response = await frontendApiClient.get(`/hello`);
  return response.data;
}

const frontendApiService = { getSession, sayHello };
export default frontendApiService;
