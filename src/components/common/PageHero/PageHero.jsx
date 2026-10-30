import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import Illustration from '@/components/common/Illustration';
import { COLORS, GRADIENTS } from '@/styles/theme';

/**
 * 화면 맨 위 머리 영역. 랜딩 첫 화면과 같은 옅은 보라 바탕에 제목과 그림을 둔다.
 * children은 제목·설명 아래에 붙는다(검색창, 요약 문구 등).
 */
function PageHero({ title, description, illustration, eyebrow, children, titleId }) {
  return (
    <Box
      component="section"
      aria-labelledby={titleId}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'minmax(0, 1fr) 200px' },
        alignItems: 'center',
        columnGap: 3,
        px: { xs: 2.5, sm: 4, md: 5 },
        py: { xs: 3, sm: 3.5 },
        borderRadius: { xs: '24px', sm: '28px' },
        background: GRADIENTS.hero,
        border: `1px solid ${COLORS.accentLine}`,
      }}
    >
      <Box
        aria-hidden="true"
        sx={{
          position: 'absolute',
          top: -80,
          right: -60,
          width: 220,
          height: 220,
          borderRadius: '50%',
          bgcolor: 'rgba(111, 93, 230, 0.08)',
        }}
      />

      <Box sx={{ position: 'relative', minWidth: 0 }}>
        {eyebrow && (
          <Typography
            sx={{
              mb: 1,
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: '0.04em',
              color: 'primary.main',
            }}
          >
            {eyebrow}
          </Typography>
        )}
        <Typography id={titleId} variant="h1" component="h1" sx={{ wordBreak: 'keep-all' }}>
          {title}
        </Typography>
        {description && (
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 1, fontSize: { xs: 14, sm: 15 }, lineHeight: 1.6, wordBreak: 'keep-all' }}
          >
            {description}
          </Typography>
        )}
        {children && <Box sx={{ mt: 2 }}>{children}</Box>}
      </Box>

      {illustration && (
        <Illustration
          name={illustration}
          sx={{ display: { xs: 'none', sm: 'block' }, position: 'relative', width: 200, my: -1 }}
        />
      )}
    </Box>
  );
}

export default PageHero;
