import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';

import App from '@/App';
import theme from '@/styles/theme';
import '@/styles/global.css';

// notice: 백엔드 없이 화면을 확인할 때만 목 API를 붙인다.
// notice: 배포 빌드의 기본값은 .env.production에서 false로 고정한다.
if (import.meta.env.VITE_USE_MOCK === 'true') {
  const [{ enableMockApi }, { default: httpClient }] = await Promise.all([
    import('@/mocks'),
    import('@/api/httpClient'),
  ]);

  enableMockApi(httpClient);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
);
