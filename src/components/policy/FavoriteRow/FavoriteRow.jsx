import { Link as RouterLink } from 'react-router-dom';
import AppIcon from '@/components/common/AppIcon';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import DdayBadge from '@/components/common/DdayBadge';
import { buildPolicyDetailPath } from '@/constants/routes';
import { COLORS, getSubtypeTone } from '@/styles/theme';
import { isApplyClosed } from '@/utils/formatDate';

/** 설계서 S-14: 행을 누르면 정책 상세(S-06)로 가고, ♥만 관심 해제로 동작한다. */
function FavoriteRow({ favorite, onRemove }) {
  const { policy } = favorite;
  const isClosed = isApplyClosed(policy);
  const tone = getSubtypeTone(policy.subtypeName);

  const handleRemoveClick = (event) => {
    event.preventDefault();
    onRemove(policy.id);
  };

  return (
    <Box
      component={RouterLink}
      to={buildPolicyDetailPath(policy.id)}
      sx={{
        display: 'grid',
        // 좁은 화면에서는 유형 칩을 제목 위로 올려 제목이 한 줄 폭을 다 쓰게 한다.
        gridTemplateColumns: {
          xs: 'minmax(0, 1fr) auto',
          sm: '96px minmax(0, 1fr) 110px',
        },
        gridTemplateAreas: {
          xs: '"chip actions" "title actions"',
          sm: '"chip title actions"',
        },
        alignItems: 'center',
        columnGap: { xs: 1, sm: 2 },
        rowGap: 0.75,
        px: { xs: 2, sm: 2.5 },
        py: 1.75,
        borderBottom: '1px solid',
        borderColor: 'divider',
        color: 'inherit',
        textDecoration: 'none',
        // 설계서 S-14: 마감된 정책도 목록에는 남기되 흐리게 둔다.
        backgroundColor: isClosed ? 'grey.100' : 'transparent',
        transition: 'background-color 150ms ease',
        '&:last-of-type': { borderBottom: 0 },
        '&:hover': { backgroundColor: COLORS.accentTint },
      }}
    >
      <Chip
        label={policy.subtypeName}
        size="small"
        sx={{
          gridArea: 'chip',
          width: { xs: 'auto', sm: '100%' },
          minWidth: 0,
          justifySelf: { xs: 'start', sm: 'center' },
          fontWeight: 700,
          bgcolor: tone.bg,
          color: tone.fg,
        }}
      />

      <Typography
        variant="subtitle1"
        color={isClosed ? 'text.secondary' : 'text.primary'}
        sx={{
          gridArea: 'title',
          minWidth: 0,
          wordBreak: 'keep-all',
          overflowWrap: 'break-word',
        }}
      >
        {policy.title}
        {isClosed && (
          <Typography component="span" variant="caption" color="text.disabled" sx={{ ml: 1 }}>
            신청 기간이 끝났어요
          </Typography>
        )}
      </Typography>

      <Stack
        direction="row"
        spacing={1}
        sx={{
          gridArea: 'actions',
          alignItems: 'center',
          width: '100%',
          justifyContent: 'flex-end',
        }}
      >
        <DdayBadge applyPeriodType={policy.applyPeriodType} applyEndDate={policy.applyEndDate} />

        <IconButton
          size="small"
          aria-label="관심 정책 해제"
          onClick={handleRemoveClick}
          sx={{ color: 'favorite.main' }}
        >
          <AppIcon name="heart" size={20} />
        </IconButton>
      </Stack>
    </Box>
  );
}

export default FavoriteRow;
