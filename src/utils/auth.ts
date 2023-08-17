export function login (returnUrl?: string) {
  if (returnUrl) {
    const queryParams = new URLSearchParams({ return_url: encodeURI(returnUrl) }).toString();
    window.location.href = `${window.location.origin}/api/auth/login?${queryParams}`;
  } else {
    window.location.href = `${window.location.origin}/api/auth/login`;
  }
};

export function logout () {
  window.location.href = `${window.location.origin}/api/auth/logout`;
};

export function bearerToken (accessToken: string) {
  return { headers: { Authorization: `Bearer ${accessToken}` } };
};
