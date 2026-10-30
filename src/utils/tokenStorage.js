import { STORAGE_KEYS } from '@/constants/storageKeys';

const decodePayload = (token) => {
  try {
    const payload = token.split('.')[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');

    return JSON.parse(atob(normalized));
  } catch {
    return null;
  }
};

export const tokenStorage = {
  getAccessToken() {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  getRefreshToken() {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  getMemberId() {
    const subject = decodePayload(this.getAccessToken() ?? '')?.sub;
    const memberId = Number(subject);

    return Number.isInteger(memberId) && memberId > 0 ? memberId : null;
  },

  getRole(accessToken = this.getAccessToken()) {
    const role = decodePayload(accessToken ?? '')?.role;

    return typeof role === 'string' ? role : null;
  },

  setTokens({ accessToken, refreshToken }) {
    if (accessToken) {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    }
    if (refreshToken) {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    }
  },

  clear() {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  },
};
