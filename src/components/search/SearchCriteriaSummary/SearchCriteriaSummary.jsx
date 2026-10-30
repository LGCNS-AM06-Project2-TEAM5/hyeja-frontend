import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { RADIUS } from '@/styles/theme';

/**
 * 설계서 S-05 Row/Applied: 검색창 바로 아래에 이번 검색의 유형과 판정에 쓴 내 조건을 보여 준다.
 * typeLabel은 해시태그 검색처럼 유형을 확실히 알 때만 준다. 자유 문장은 AI가 고른 유형을 응답에 주지 않는다.
 */
function SearchCriteriaSummary({ typeLabel, conditions, action }) {
  if (!typeLabel && conditions.length === 0) {
    return null;
  }

  return (
    <Stack
      direction="row"
      useFlexGap
      sx={{ alignItems: 'center', flexWrap: 'wrap', columnGap: 1.5, rowGap: 1 }}
    >
      {typeLabel && (
        <Chip
          label={typeLabel}
          variant="outlined"
          size="small"
          sx={{
            height: 24,
            borderRadius: `${RADIUS.dday}px`,
            backgroundColor: 'common.white',
            borderColor: 'rgba(101, 88, 211, 0.22)',
            color: 'primary.main',
            fontWeight: 700,
            '& .MuiChip-label': { px: 1.25 },
          }}
        />
      )}

      {conditions.length > 0 && (
        <Stack
          direction="row"
          useFlexGap
          sx={{ alignItems: 'baseline', flexWrap: 'wrap', columnGap: 1, minWidth: 0 }}
        >
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ wordBreak: 'keep-all', overflowWrap: 'break-word' }}
          >
            적용된 내 조건: {conditions.join(' · ')}
          </Typography>
          {action}
        </Stack>
      )}
    </Stack>
  );
}

export default SearchCriteriaSummary;
