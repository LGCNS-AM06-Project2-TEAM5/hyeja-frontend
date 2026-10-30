import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import AppIcon from '@/components/common/AppIcon';
import { LAYOUT, RADIUS } from '@/styles/theme';

/** 로고 SVG(673 × 262) 비율. 단색 마스크로 그릴 때 폭을 높이에 맞춘다. */
const LOGO_RATIO = 673 / 262;
const LOGO_HEIGHT = { xs: 36, md: 44 };

function Footer() {
  return (
    // 위쪽 여백은 투명하게 두어, 본문이 짧을 때도 긴 때도 어두운 면과 한 호흡 떨어져 시작한다.
    <Box component="footer" sx={{ mt: 'auto', pt: { xs: 5, md: 8 } }}>
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          bgcolor: 'brandDeep.main',
          color: 'brandDeep.contrastText',
          borderTop: '1px solid',
          borderColor: 'brandDeep.line',
        }}
      >
        <Box
          aria-hidden="true"
          sx={{
            position: 'absolute',
            top: -160,
            right: { xs: -140, md: -60 },
            width: 360,
            height: 360,
            borderRadius: '50%',
            bgcolor: (theme) => theme.alpha(theme.vars.palette.primary.main, 0.18),
            filter: 'blur(48px)',
            pointerEvents: 'none',
          }}
        />

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 3, sm: 4, md: 6 }}
          sx={{
            position: 'relative',
            alignItems: { xs: 'stretch', sm: 'center' },
            justifyContent: 'space-between',
            maxWidth: LAYOUT.containerMaxWidth,
            mx: 'auto',
            px: LAYOUT.pageGutter,
            py: { xs: 5, md: 6 },
          }}
        >
          <Stack spacing={1.5} sx={{ minWidth: 0 }}>
            <AppIcon
              name="hyeja_for_logo_main"
              sx={{
                height: LOGO_HEIGHT,
                width: {
                  xs: LOGO_HEIGHT.xs * LOGO_RATIO,
                  md: LOGO_HEIGHT.md * LOGO_RATIO,
                },
              }}
            />
            <Typography variant="body2" sx={{ color: 'brandDeep.textSecondary' }}>
              혜자 · 청년 주거 정책 추천 서비스
            </Typography>
          </Stack>

          <Stack
            direction="row"
            spacing={1.25}
            sx={{
              alignItems: 'flex-start',
              maxWidth: { sm: 420, md: 560 },
              px: 2,
              py: 1.75,
              borderRadius: `${RADIUS.card}px`,
              border: '1px solid',
              borderColor: 'brandDeep.line',
              bgcolor: (theme) => theme.alpha(theme.vars.palette.primary.main, 0.14),
            }}
          >
            <AppIcon name="info-circle" size={20} sx={{ mt: '1px', color: 'primary.light' }} />
            <Typography variant="body2" sx={{ wordBreak: 'keep-all', textWrap: 'balance' }}>
              정책 정보는 각 기관 공고를 기준으로 하며, 신청 전 원문 확인이 필요해요
            </Typography>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}

export default Footer;
