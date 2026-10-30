import { FAVORITE_STATUS } from '@/constants/policy';
import { NOTIFICATIONS } from '@/mocks/data/notifications';
import { USERS } from '@/mocks/data/users';

const STORAGE_KEY = 'hyejaMockStore';

const buildInitialState = () => ({
  users: USERS.map((user) => ({ ...user, profile: { ...user.profile } })),
  favorites: {
    1: [
      { policyId: 2, status: FAVORITE_STATUS.PREPARING, savedAt: '2026-09-19' },
      { policyId: 1, status: FAVORITE_STATUS.INTEREST, savedAt: '2026-09-19' },
      { policyId: 4, status: FAVORITE_STATUS.INTEREST, savedAt: '2026-09-18' },
      { policyId: 8, status: FAVORITE_STATUS.APPLIED, savedAt: '2026-09-17' },
      { policyId: 3, status: FAVORITE_STATUS.INTEREST, savedAt: '2026-09-16' },
    ],
    2: [],
  },
  notifications: { 1: NOTIFICATIONS.map((item) => ({ ...item })), 2: [] },
  emailVerifications: {},
  revokedTokens: [],
  lastUserId: 2,
  lastNotificationId: 3,
});

const readState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    return saved ? JSON.parse(saved) : buildInitialState();
  } catch {
    return buildInitialState();
  }
};

let state = readState();

const persist = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 저장 공간을 못 쓰면 이번 세션 동안만 상태를 유지한다.
  }
};

export const mockStore = {
  getState() {
    return state;
  },

  update(updater) {
    state = updater(state) ?? state;
    persist();

    return state;
  },

  reset() {
    state = buildInitialState();
    persist();

    return state;
  },
};

const encodeTokenPart = (value) =>
  btoa(JSON.stringify(value)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

export const buildAccessToken = (userId, role = 'USER') =>
  `${encodeTokenPart({ alg: 'none', typ: 'JWT' })}.${encodeTokenPart({ sub: String(userId), role })}.mock-signature`;

export const findUserByToken = (authorization) => {
  const token = authorization?.replace('Bearer ', '');
  let userId;

  if (!token || (state.revokedTokens ?? []).includes(token)) {
    return null;
  }

  try {
    const payload = token?.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/');
    userId = Number(JSON.parse(atob(payload)).sub);
  } catch {
    return null;
  }

  return state.users.find((user) => user.id === userId && !user.deletedAt) ?? null;
};
