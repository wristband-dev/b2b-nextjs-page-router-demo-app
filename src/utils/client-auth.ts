export function clientRedirectTologin(returnUrl?: string) {
  if (!!window) {
    if (returnUrl) {
      const queryParams = new URLSearchParams({ return_url: encodeURI(returnUrl) }).toString();
      window.location.href = `${window.location.origin}/api/auth/login?${queryParams}`;
    } else {
      window.location.href = `${window.location.origin}/api/auth/login`;
    }
  }
}

export function clientRedirectToLogout() {
  if (!!window) {
    window.location.href = `${window.location.origin}/api/auth/logout`;
  }
}
