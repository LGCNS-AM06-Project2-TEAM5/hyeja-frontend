import axios from 'axios';

import { tokenStorage } from '@/utils/tokenStorage';

const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

httpClient.interceptors.request.use((config) => {
  const accessToken = tokenStorage.getAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

httpClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      tokenStorage.clear();
      // 토큰만 지우면 화면은 로그인 상태로 남는다. 세션을 함께 정리하도록 알린다.
      window.dispatchEvent(new CustomEvent('hyeja:unauthorized'));
    }

    return Promise.reject(error);
  },
);

export default httpClient;
