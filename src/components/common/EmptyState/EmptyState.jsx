import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import Illustration from '@/components/common/Illustration';
import { COLORS, RADIUS } from '@/styles/theme';

/**
 * isFramed는 설계서 S-05 "후보 0건"의 점선 박스를 쓴다는 뜻이다.
 * illustration을 주면 제목 위에 public/illustrations의 그림을 함께 보여 준다.
 */
function EmptyState({ title, description, action, isFramed = false, illustration }) {
  return (
    <Box
      sx={{
        textAlign: 'center',
        py: 6,
        px: isFramed ? 4 : 2,
        ...(isFramed && {
          border: '1.5px dashed',
          borderColor: 'grey.500',
          borderRadius: `${RADIUS.card}px`,
          bgcolor: COLORS.accentTint,
        }),
      }}
    >
      {illustration && <Illustration name={illustration} sx={{ width: 180, mx: 'auto', mb: 2 }} />}

      <Typography variant={isFramed ? 'subtitle1' : 'body2'} color="text.primary">
        {title}
      </Typography>

      {description && (
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mt: isFramed ? 1.25 : 1, wordBreak: 'keep-all', overflowWrap: 'break-word' }}
        >
          {description}
        </Typography>
      )}

      {action && <Box sx={{ mt: isFramed ? 2.25 : 2.5 }}>{action}</Box>}
    </Box>
  );
}

export default EmptyState;
