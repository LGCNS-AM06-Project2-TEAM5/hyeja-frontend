import { Link as RouterLink } from 'react-router-dom';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import Illustration from '@/components/common/Illustration';
import { ROUTES } from '@/constants/routes';

function NotFoundPage() {
  return (
    <Stack spacing={2} sx={{ alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <Illustration name="not-found" sx={{ width: { xs: 220, sm: 280 } }} />
      <Typography variant="h1" color="primary.main">
        404
      </Typography>
      <Typography variant="body2" color="text.secondary">
        페이지를 찾을 수 없어요
      </Typography>
      <Button component={RouterLink} to={ROUTES.HOME} variant="contained" size="large">
        홈으로 가기
      </Button>
    </Stack>
  );
}

export default NotFoundPage;
