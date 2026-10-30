import { useNavigate } from 'react-router-dom';
import AppIcon from '@/components/common/AppIcon';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import DdayBadge from '@/components/common/DdayBadge';
import { buildPolicyDetailPath } from '@/constants/routes';
import { COLORS } from '@/styles/theme';
import { formatRelativeTime } from '@/utils/formatDate';

/**
 * 설계서 S-09: 안 읽은 알림은 점과 배경으로 구분하고, 행을 누르면 정책 상세로 간다.
 * onSelect는 행을 눌렀을 때 함께 부른다. 헤더 알림 창은 이걸로 창을 닫는다.
 */
function NotificationItem({ notification, onRead, onDelete, onSelect }) {
  const navigate = useNavigate();

  const handleClick = () => {
    // 이미 읽은 알림은 다시 읽음 요청을 보내지 않는다.
    if (!notification.isRead) {
      onRead?.(notification.id);
    }

    onSelect?.(notification);

    if (notification.policyId) {
      navigate(buildPolicyDetailPath(notification.policyId));
    }
  };

  return (
    <Stack
      direction="row"
      spacing={1.5}
      sx={{
        position: 'relative',
        alignItems: { xs: 'flex-start', sm: 'center' },
        px: 2,
        py: 1.5,
        borderRadius: '14px',
        backgroundColor: notification.isRead ? 'transparent' : COLORS.accentTint,
        transition: 'background-color 150ms ease',
        '&:hover': { backgroundColor: COLORS.accentSoft },
      }}
    >
      <Box
        sx={{
          width: 8,
          height: 8,
          flexShrink: 0,
          borderRadius: '50%',
          backgroundColor: notification.isRead ? 'transparent' : 'primary.main',
        }}
      />

      <Box
        component="button"
        type="button"
        onClick={handleClick}
        sx={{
          flexGrow: 1,
          minWidth: 0,
          textAlign: 'left',
          border: 0,
          background: 'none',
          p: 0,
          cursor: 'pointer',
        }}
      >
        <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>
          {notification.title}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
          {notification.body}
        </Typography>
        <Typography
          variant="caption"
          color="text.disabled"
          sx={{ display: { xs: 'block', sm: 'none' }, mt: 0.5 }}
        >
          {formatRelativeTime(notification.createdAt)}
        </Typography>
      </Box>

      <DdayBadge
        applyPeriodType={notification.applyPeriodType}
        applyEndDate={notification.applyEndDate}
      />

      <Typography
        variant="caption"
        color="text.disabled"
        sx={{ display: { xs: 'none', sm: 'block' }, width: 68, textAlign: 'right', flexShrink: 0 }}
      >
        {formatRelativeTime(notification.createdAt)}
      </Typography>

      {onDelete && (
        <IconButton
          size="small"
          aria-label="알림 삭제"
          onClick={() => onDelete(notification.id)}
          sx={{ flexShrink: 0, mt: { xs: -0.5, sm: 0 } }}
        >
          <AppIcon name="close" size={16} />
        </IconButton>
      )}
    </Stack>
  );
}

export default NotificationItem;
