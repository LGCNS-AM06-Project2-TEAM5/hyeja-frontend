import { Link as RouterLink } from 'react-router-dom';
import AppIcon from '@/components/common/AppIcon';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import DdayBadge from '@/components/common/DdayBadge';
import { buildPolicyDetailPath } from '@/constants/routes';
import { useIsTextTruncated } from '@/hooks/useIsTextTruncated';
import { COLORS, getSubtypeTone } from '@/styles/theme';
import { summarizePolicyRegions } from '@/utils/summarizePolicyRegions';

const VISUALLY_HIDDEN_SX = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  margin: '-1px',
  padding: 0,
  border: 0,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
};

function PolicyRow({ policy, isFavorite = false, onToggleFavorite, memberRegionCode = null }) {
  const regionSummary = summarizePolicyRegions({
    regions: policy.regions,
    nationwide: policy.nationwide,
    memberRegionCode,
  });
  const isRegionSummarized = regionSummary.regionLabels.length > 1;
  const { elementRef: regionRef, isTruncated: isRegionTruncated } = useIsTextTruncated(
    regionSummary.label,
  );

  const tone = getSubtypeTone(policy.subtypeName);

  const handleFavoriteClick = (event) => {
    event.preventDefault();
    onToggleFavorite?.(policy.id);
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
          sm: '96px minmax(0, 1fr) 200px 110px',
        },
        gridTemplateAreas: {
          xs: '"chip actions" "title actions" "region region"',
          sm: '"chip title region actions"',
        },
        alignItems: 'center',
        columnGap: { xs: 1, sm: 2 },
        rowGap: { xs: 0.75, sm: 1 },
        px: { xs: 2, sm: 2.5 },
        py: { xs: 1.75, sm: 1.75 },
        borderBottom: '1px solid',
        borderColor: 'divider',
        color: 'inherit',
        textDecoration: 'none',
        transition: 'background-color 150ms ease',
        '&:last-of-type': { borderBottom: 0 },
        '&:hover': { backgroundColor: COLORS.accentTint },
        '&:hover .policy-row-title': { color: 'primary.main' },
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
          bgcolor: tone.bg,
          color: tone.fg,
          fontWeight: 700,
        }}
      />

      <Typography
        variant="subtitle1"
        className="policy-row-title"
        sx={{
          gridArea: 'title',
          minWidth: 0,
          overflowWrap: 'anywhere',
          wordBreak: 'keep-all',
          transition: 'color 150ms ease',
        }}
      >
        {policy.title}
      </Typography>

      <Tooltip
        arrow
        describeChild
        title={regionSummary.label}
        disableHoverListener={!isRegionTruncated}
        disableFocusListener={!isRegionTruncated}
        disableTouchListener={!isRegionTruncated}
      >
        <Typography
          ref={regionRef}
          variant="body1"
          color="text.secondary"
          noWrap
          tabIndex={isRegionTruncated ? 0 : undefined}
          sx={{
            gridArea: 'region',
            width: '100%',
            textAlign: { xs: 'left', sm: 'right' },
          }}
        >
          {regionSummary.label}
          {isRegionSummarized && (
            <Box component="span" sx={VISUALLY_HIDDEN_SX}>
              대상 지역 전체: {regionSummary.regionLabels.join(', ')}
            </Box>
          )}
        </Typography>
      </Tooltip>

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
          aria-label={isFavorite ? '관심 정책 해제' : '관심 정책 저장'}
          onClick={handleFavoriteClick}
          sx={{ color: isFavorite ? 'favorite.main' : 'text.disabled' }}
        >
          <AppIcon name={isFavorite ? 'heart' : 'heart-outline'} size={20} />
        </IconButton>
      </Stack>
    </Box>
  );
}

export default PolicyRow;
