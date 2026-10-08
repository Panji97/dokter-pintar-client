/**
 * Storage helpers — pola yang sama dengan hris-client-sakai
 * (helpers/localstorage.ts + helpers/cookies.ts).
 *
 * JWT disimpan ganda:
 * - localStorage 'jwt'  -> dibaca fetcher client-side
 * - cookie 'jwt'         -> dibaca middleware SSR / route guard
 * User object hanya di localStorage 'user'.
 */

export const setLocalStorage = (key: string, value: string) => {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      console.error('Error accessing localStorage:', error);
    }
  }
};

export const getLocalStorage = (key: string): string | null => {
  if (typeof window !== 'undefined') {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      return null;
    }
  }
  return null;
};

export const removeLocalStorage = (key: string) => {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error('Error accessing localStorage:', error);
    }
  }
};

export const clearLocalStorage = () => {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.clear();
    } catch (error) {
      console.error('Error accessing localStorage:', error);
    }
  }
};

export const setCookie = (name: string, value: string, days: number) => {
  if (typeof document !== 'undefined') {
    let expires = '';
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = `; expires=${date.toUTCString()}`;
    }
    document.cookie = `${name}=${value || ''}${expires}; path=/`;
  }
};

export const getCookie = (name: string) => {
  if (typeof document !== 'undefined') {
    const nameEQ = `${name}=`;
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
  }
  return null;
};

export const eraseCookie = (name: string) => {
  if (typeof document !== 'undefined') {
    document.cookie = `${name}=; Max-Age=-99999999; path=/`;
  }
};

export const setSessionStorage = (key: string, value: string) => {
  if (typeof window !== 'undefined') {
    try {
      window.sessionStorage.setItem(key, value);
    } catch {
      /* abaikan */
    }
  }
};

export const getSessionStorage = (key: string): string | null => {
  if (typeof window !== 'undefined') {
    try {
      return window.sessionStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return null;
};

export const removeSessionStorage = (key: string) => {
  if (typeof window !== 'undefined') {
    try {
      window.sessionStorage.removeItem(key);
    } catch {
      /* abaikan */
    }
  }
};

export const clearSessionStorage = () => {
  if (typeof window !== 'undefined') {
    try {
      window.sessionStorage.clear();
    } catch {
      /* abaikan */
    }
  }
};

/** Hapus sesi Strapi (mirror AppTopbar logout di HRIS). */
export function clearStrapiSession() {
  eraseCookie('jwt');
  removeLocalStorage('jwt');
  removeLocalStorage('user');
  clearSessionStorage();
}
