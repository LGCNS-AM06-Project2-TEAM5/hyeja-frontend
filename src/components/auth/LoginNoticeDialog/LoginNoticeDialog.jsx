import AppIcon from '@/components/common/AppIcon';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { LOGIN_NOTICE } from '@/constants/messages';

/** 설계서 S-06 "로그인 안내 창". 닫기는 우측 상단 X, 확인을 누르면 로그인 모달이 열린다. */
function LoginNoticeDialog({ notice, onClose, onConfirm }) {
  if (!notice) {
    return null;
  }

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <Stack direction="row" sx={{ justifyContent: 'flex-end', px: 1.5, pt: 1.5 }}>
        <IconButton onClick={onClose} aria-label="닫기" size="small">
          <AppIcon name="close" size={20} />
        </IconButton>
      </Stack>

      <DialogContent sx={{ pt: 0 }}>
        <Stack spacing={1}>
          <Typography variant="h2">{notice.title}</Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ wordBreak: 'keep-all', overflowWrap: 'break-word' }}
          >
            {notice.description}
          </Typography>
        </Stack>

        <Button variant="contained" fullWidth onClick={onConfirm} sx={{ mt: 3 }}>
          {LOGIN_NOTICE.CONFIRM_LABEL}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export default LoginNoticeDialog;
