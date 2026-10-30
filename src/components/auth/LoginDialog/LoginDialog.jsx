import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import AppIcon from '@/components/common/AppIcon';
import FieldError from '@/components/common/FieldError';
import Illustration from '@/components/common/Illustration';
import PasswordField from '@/components/common/PasswordField';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';

import { ROUTES } from '@/constants/routes';
import { VALIDATION_MESSAGES } from '@/constants/messages';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { GRADIENTS } from '@/styles/theme';

const INITIAL_FORM = { email: '', password: '' };

const FOOTER_LINKS = [
  { label: '이메일 찾기', to: ROUTES.FIND_EMAIL },
  { label: '회원가입', to: ROUTES.SIGNUP },
];

function LoginDialog({ isOpen, onClose, onLoggedIn }) {
  const { login } = useAuth();
  const { showError } = useToast();
  const [form, setForm] = useState(INITIAL_FORM);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const resetAndClose = () => {
    setForm(INITIAL_FORM);
    setErrorMessage('');
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.email) {
      setErrorMessage(VALIDATION_MESSAGES.REQUIRED_EMAIL);
      return;
    }
    if (!form.password) {
      setErrorMessage(VALIDATION_MESSAGES.REQUIRED_PASSWORD);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const authenticatedUser = await login(form);
      setForm(INITIAL_FORM);
      // 설계서 S-02: 모달만 닫고, 원래 하려던 동작을 이어서 실행한다.
      onLoggedIn(authenticatedUser);
    } catch (error) {
      const message = getErrorMessage(error);
      setErrorMessage(message);
      showError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={resetAndClose} maxWidth="xs" fullWidth>
      <Box sx={{ background: GRADIENTS.hero, pt: 2.5, px: 3 }}>
        <Illustration name="home-hero" sx={{ width: 190, mx: 'auto' }} />
      </Box>
      <DialogTitle
        sx={{
          typography: 'h2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        로그인
        <IconButton onClick={resetAndClose} aria-label="닫기" size="small">
          <AppIcon name="close" size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Stack component="form" spacing={2} onSubmit={handleSubmit} sx={{ pt: 1 }}>
          <TextField
            label="이메일"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="example@email.com"
            error={Boolean(errorMessage)}
            fullWidth
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <AppIcon name="account-outline" size={20} />
                  </InputAdornment>
                ),
              },
            }}
          />

          <PasswordField
            label="비밀번호"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="비밀번호 입력"
            error={Boolean(errorMessage)}
            helperText={errorMessage ? <FieldError>{errorMessage}</FieldError> : ' '}
            fullWidth
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <AppIcon name="lock-outline" size={20} />
                  </InputAdornment>
                ),
              },
            }}
          />

          <Button type="submit" variant="contained" size="large" disabled={isSubmitting} fullWidth>
            로그인
          </Button>

          <Stack
            direction="row"
            spacing={1.5}
            divider={<Divider orientation="vertical" flexItem />}
            sx={{ justifyContent: 'center' }}
          >
            {FOOTER_LINKS.map((item) => (
              <Link
                key={item.to}
                component={RouterLink}
                to={item.to}
                onClick={resetAndClose}
                variant="caption"
              >
                {item.label}
              </Link>
            ))}
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

export default LoginDialog;
