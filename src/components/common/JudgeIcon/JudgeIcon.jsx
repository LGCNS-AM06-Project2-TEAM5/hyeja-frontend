import Box from '@mui/material/Box';

import AppIcon from '@/components/common/AppIcon';
import { JUDGE_RESULT, JUDGE_RESULT_COLOR, JUDGE_RESULT_LABEL } from '@/constants/policy';

const ICON_NAME_BY_RESULT = {
  [JUDGE_RESULT.MET]: 'check',
  [JUDGE_RESULT.NOT_MET]: 'cross',
  [JUDGE_RESULT.NEED_CHECK]: 'question',
};

function JudgeIcon({ result, size = 24 }) {
  const iconName = ICON_NAME_BY_RESULT[result];

  if (!iconName) {
    return null;
  }

  const color = JUDGE_RESULT_COLOR[result];

  return (
    <Box
      component="span"
      role="img"
      aria-label={JUDGE_RESULT_LABEL[result]}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        // 옆 글이 길어져도 가로 배치에서 줄어들어 타원이 되지 않게 한다.
        flexShrink: 0,
        borderRadius: '50%',
        backgroundColor: color.fill,
        color: color.glyph,
      }}
    >
      <AppIcon name={iconName} size={size * 0.6} />
    </Box>
  );
}

export default JudgeIcon;
