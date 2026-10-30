import { Link as RouterLink } from 'react-router-dom';
import AppIcon from '@/components/common/AppIcon';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import DdayBadge from '@/components/common/DdayBadge';
import JudgeChip from '@/components/common/JudgeChip';
import {
  JUDGE_RESULT_BY_GROUP,
  JUDGE_RESULT_COLOR,
  RECOMMENDATION_GROUP,
} from '@/constants/policy';
import { buildPolicyDetailPath } from '@/constants/routes';
import { getSubtypeTone, SHADOWS } from '@/styles/theme';

/** 화면에는 안 보이고 화면 낭독기에만 읽히는 글자 */
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

/**
 * 설계서 S-05 Card/ResultItem: 정책마다 "왜?" 한 문장과 조건별 판정을 함께 보여준다.
 * 왼쪽에 제목·이유·판정을, 오른쪽에 D-day·관심을 둔다. 카드 전체가 상세 링크다.
 */
function SearchResultCard({ policy, group, isFavorite = false, onToggleFavorite }) {
  const isImpossible = group === RECOMMENDATION_GROUP.IMPOSSIBLE;
  const reasonLabel = isImpossible ? '이유' : '왜?';
  const tone = getSubtypeTone(policy.subtypeName);

  return (
    <Card
      variant="outlined"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        // 좁은 화면에서는 D-day·관심을 아래로 내려 본문이 폭을 다 쓰게 한다.
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 1.5, sm: 3 },
        pl: { xs: 2.5, sm: 3.5 },
        pr: { xs: 2, sm: 3 },
        py: { xs: 2, sm: 2.5 },
        backgroundColor: isImpossible ? 'grey.100' : 'background.paper',
        transition: 'box-shadow 180ms ease, border-color 180ms ease',
        '&:hover': { boxShadow: SHADOWS.card, borderColor: 'transparent' },
        // 왼쪽 띠 색으로 어느 그룹 결과인지 한눈에 보이게 한다.
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 5,
          bgcolor: JUDGE_RESULT_COLOR[JUDGE_RESULT_BY_GROUP[group]].border,
        },
      }}
    >
      <Stack spacing={1.25} sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', minWidth: 0 }}>
          <Chip
            label={policy.subtypeName}
            size="small"
            sx={{ flexShrink: 0, fontWeight: 700, bgcolor: tone.bg, color: tone.fg }}
          />
          <Typography
            variant="subtitle1"
            color={isImpossible ? 'text.secondary' : 'text.primary'}
            sx={{ minWidth: 0, wordBreak: 'keep-all', overflowWrap: 'anywhere' }}
          >
            {policy.title}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'flex-start' }}>
          <Typography variant="subtitle1" sx={{ flexShrink: 0 }}>
            {reasonLabel}
          </Typography>
          <Typography
            variant="body1"
            sx={{ pt: '1px', minWidth: 0, wordBreak: 'keep-all', overflowWrap: 'anywhere' }}
          >
            {policy.reason}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap' }}>
          {(policy.judgements ?? []).map((judgement) => (
            <JudgeChip
              key={judgement.conditionKey}
              result={judgement.result}
              label={judgement.conditionName}
            />
          ))}
        </Stack>
      </Stack>

      <Stack
        direction={{ xs: 'row-reverse', sm: 'column' }}
        spacing={1.5}
        useFlexGap
        sx={{
          alignItems: { xs: 'center', sm: 'flex-end' },
          justifyContent: { xs: 'space-between', sm: 'flex-start' },
          flexShrink: 0,
        }}
      >
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
          <DdayBadge applyPeriodType={policy.applyPeriodType} applyEndDate={policy.applyEndDate} />
          <IconButton
            aria-label={isFavorite ? '관심 정책 해제' : '관심 정책 저장'}
            onClick={() => onToggleFavorite?.(policy.id)}
            sx={{
              // 카드 전체를 덮는 상세 링크 위로 올려, 하트는 따로 눌리게 한다.
              position: 'relative',
              zIndex: 1,
              width: 36,
              height: 36,
              color: isFavorite ? 'favorite.main' : 'text.secondary',
            }}
          >
            <AppIcon name={isFavorite ? 'heart' : 'heart-outline'} size={20} />
          </IconButton>
        </Stack>

        {/* 글자는 숨기고, 누르는 영역만 카드 전체로 넓혀 카드 어디를 눌러도 상세로 간다. */}
        <Link
          component={RouterLink}
          to={buildPolicyDetailPath(policy.id)}
          sx={{ '&::after': { content: '""', position: 'absolute', inset: 0 } }}
        >
          <Box component="span" sx={VISUALLY_HIDDEN_SX}>
            {policy.title} 상세 보기
          </Box>
        </Link>
      </Stack>
    </Card>
  );
}

export default SearchResultCard;
