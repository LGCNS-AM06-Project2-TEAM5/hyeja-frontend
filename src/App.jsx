import { BrowserRouter } from 'react-router-dom';

import AuthProvider from '@/contexts/AuthProvider';
import LoginDialogProvider from '@/contexts/LoginDialogProvider';
import NotificationProvider from '@/contexts/NotificationProvider';
import ToastProvider from '@/contexts/ToastProvider';
import Router from '@/routes/Router';

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <NotificationProvider>
            <LoginDialogProvider>
              <Router />
            </LoginDialogProvider>
          </NotificationProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
