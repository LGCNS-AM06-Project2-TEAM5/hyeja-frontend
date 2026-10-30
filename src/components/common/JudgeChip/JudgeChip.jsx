import Chip from '@mui/material/Chip';

import JudgeIcon from '@/components/common/JudgeIcon';
import { JUDGE_RESULT_COLOR, JUDGE_RESULT_LABEL } from '@/constants/policy';

/** 설계서 Chip/Judge: 높이 28 · 왼쪽 4 · 오른쪽 10 · 아이콘 20과 글자 사이 6 */
function JudgeChip({ result, label }) {
  return (
    <Chip
      variant="outlined"
      icon={<JudgeIcon result={result} size={20} />}
      label={label ?? JUDGE_RESULT_LABEL[result]}
      sx={{
        height: 28,
        pl: 0.5,
        borderColor: JUDGE_RESULT_COLOR[result]?.border,
        color: 'text.primary',
        fontSize: 12,
        fontWeight: 700,
        '& .MuiChip-icon': { mx: 0 },
        '& .MuiChip-label': { pl: 0.75, pr: 1.25 },
      }}
    />
  );
}

export default JudgeChip;
