import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import JudgeIcon from '@/components/common/JudgeIcon';
import SearchResultCard from '@/components/search/SearchResultCard';
import {
  JUDGE_RESULT_BY_GROUP,
  RECOMMENDATION_GROUP_DESCRIPTION,
  RECOMMENDATION_GROUP_LABEL,
} from '@/constants/policy';
import { COLORS, RADIUS } from '@/styles/theme';

function SearchResultGroup({ group, policies = [], isFavorite, onToggleFavorite }) {
  return (
    <Box component="section" id={`result-group-${group}`} sx={{ scrollMarginTop: 88 }}>
      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        sx={{ alignItems: 'center', flexWrap: 'wrap', columnGap: 1.5, mb: 1.5 }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <JudgeIcon result={JUDGE_RESULT_BY_GROUP[group]} size={24} />
          <Typography variant="h2">
            {RECOMMENDATION_GROUP_LABEL[group]} · {policies.length}건
          </Typography>
        </Stack>
        <Typography variant="body1" color="text.secondary" sx={{ wordBreak: 'keep-all' }}>
          {RECOMMENDATION_GROUP_DESCRIPTION[group]}
        </Typography>
      </Stack>

      {policies.length === 0 ? (
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            py: 2.5,
            textAlign: 'center',
            borderRadius: `${RADIUS.card}px`,
            border: '1.5px dashed',
            borderColor: 'divider',
            bgcolor: COLORS.accentTint,
          }}
        >
          해당하는 정책이 없어요
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {policies.map((policy) => (
            <SearchResultCard
              key={policy.id}
              policy={policy}
              group={group}
              isFavorite={isFavorite?.(policy.id) ?? false}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}

export default SearchResultGroup;
