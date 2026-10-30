import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { ELIGIBILITY_CONDITION_LABELS } from '@/constants/policy';
import { RADIUS } from '@/styles/theme';

/** 실제 결과가 채워질 자리와 같은 모양이라, 응답이 와도 화면이 덜컹거리지 않는다. */
const GROUP_SHAPES = [
  { key: 'POSSIBLE', titleWidth: 180, cardCount: 3 },
  { key: 'NEED_CHECK', titleWidth: 210, cardCount: 2 },
  { key: 'IMPOSSIBLE', titleWidth: 190, cardCount: 1 },
];

function CardSkeleton() {
  return (
    <Card
      variant="outlined"
      sx={{
        display: 'flex',
        gap: { xs: 1.5, sm: 3 },
        px: { xs: 2, sm: 3 },
        py: { xs: 2, sm: 2.5 },
      }}
    >
      <Stack spacing={1.25} sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
          <Skeleton
            variant="rounded"
            width={41}
            height={22}
            sx={{ borderRadius: `${RADIUS.chip}px` }}
          />
          <Skeleton variant="text" sx={{ flexGrow: 1, maxWidth: 260 }} />
        </Stack>

        <Skeleton variant="text" sx={{ maxWidth: 520 }} />

        <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap' }}>
          {Object.keys(ELIGIBILITY_CONDITION_LABELS).map((conditionKey) => (
            <Skeleton
              key={conditionKey}
              variant="rounded"
              width={62}
              height={28}
              sx={{ borderRadius: `${RADIUS.chip}px` }}
            />
          ))}
        </Stack>
      </Stack>

      <Stack spacing={1.5} sx={{ alignItems: 'flex-end', flexShrink: 0 }}>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
          <Skeleton
            variant="rounded"
            width={39}
            height={24}
            sx={{ borderRadius: `${RADIUS.dday}px` }}
          />
          <Skeleton variant="circular" width={36} height={36} />
        </Stack>
        <Skeleton variant="text" width={64} />
      </Stack>
    </Card>
  );
}

/** 설계서 S-05 로딩: AI 판정이 오는 동안 결과와 같은 뼈대를 먼저 보여 준다. */
function SearchResultSkeleton() {
  return (
    <Stack spacing={4.5} aria-busy="true" aria-live="polite">
      <Stack spacing={1}>
        <Typography variant="body1" color="text.secondary">
          AI가 내 조건으로 정책을 확인하고 있어요
        </Typography>
        <Stack direction="row" spacing={3}>
          {GROUP_SHAPES.map((group) => (
            <Skeleton key={group.key} variant="text" width={110} />
          ))}
        </Stack>
      </Stack>

      {GROUP_SHAPES.map((group) => (
        <Box key={group.key} component="section">
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.5 }}>
            <Skeleton variant="circular" width={20} height={20} />
            <Skeleton variant="text" width={group.titleWidth} height={28} />
          </Stack>

          <Stack spacing={1.5}>
            {Array.from({ length: group.cardCount }, (unused, index) => (
              <CardSkeleton key={`${group.key}-${index}`} />
            ))}
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}

export default SearchResultSkeleton;
