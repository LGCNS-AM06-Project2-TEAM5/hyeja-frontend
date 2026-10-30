import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import * as authApi from '@/api/authApi';
import { useToast } from '@/hooks/useToast';
import { getErrorMessage } from '@/utils/getErrorMessage';

function FindEmailPage() {
  const { showError } = useToast();
  const [nickname, setNickname] = useState('');
  const [birth, setBirth] = useState('');
  const [foundAccount, setFoundAccount] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFoundAccount(null);

    try {
      const data = await authApi.findEmail({ nickname, birth });
      setFoundAccount(data);
    } catch (error) {
      showError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Stack spacing={3} sx={{ maxWidth: 440, mx: 'auto' }}>
      <Typography variant="h1">이메일 찾기</Typography>

      <Stack component="form" spacing={2} onSubmit={handleSubmit}>
        <TextField
          label="닉네임"
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          required
          fullWidth
        />

        <TextField
          label="생년월일"
          type="date"
          value={birth}
          onChange={(event) => setBirth(event.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          required
          fullWidth
        />

        <Button type="submit" variant="contained" disabled={isSubmitting} fullWidth>
          이메일 찾기
        </Button>
      </Stack>

      {foundAccount && (
        <Alert severity="success">
          가입된 이메일은 {foundAccount.email} 이에요
          <br />
          가입일: {foundAccount.joinedAt}
        </Alert>
      )}
    </Stack>
  );
}

export default FindEmailPage;
