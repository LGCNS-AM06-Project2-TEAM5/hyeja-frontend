import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import AppIcon from '@/components/common/AppIcon';
import Illustration from '@/components/common/Illustration';
import { GRADIENTS, SHADOWS } from '@/styles/theme';

/** 안내 영역과 폼을 나란히 둘 만큼 넓은 화면 */
const WIDE = '@media (min-width:1024px)';

const BENEFITS = [
  { icon: 'check-circle', text: '생년월일·거주지로 받을 수 있는 정책만 골라요' },
  { icon: 'info-circle', text: '비워 둔 조건은 "확인이 필요해요"로 알려드려요' },
  { icon: 'bell-outline', text: '관심 정책은 마감 7일 전에 알려드려요' },
];

/**
 * 회원가입·내 조건 등록처럼 긴 입력 폼 화면의 틀.
 * 넓은 화면에서는 왼쪽에 보라 안내 영역을, 오른쪽에 폼을 둔다. 좁은 화면에서는 폼만 보여 준다.
 */
function FormPageLayout({ children }) {
  return (
    <Card
      elevation={0}
      sx={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr)',
        width: '100%',
        maxWidth: 620,
        [WIDE]: { gridTemplateColumns: '360px minmax(0, 1fr)', maxWidth: 1040 },
        mx: 'auto',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: SHADOWS.card,
      }}
    >
      <Stack
        aria-hidden="true"
        sx={{
          display: 'none',
          [WIDE]: { display: 'flex' },
          position: 'relative',
          overflow: 'hidden',
          p: 4.5,
          color: 'common.white',
          background: GRADIENTS.accent,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            right: -80,
            top: -80,
            width: 240,
            height: 240,
            borderRadius: '50%',
            bgcolor: 'rgba(255, 255, 255, 0.08)',
          }}
        />
        <Typography sx={{ fontSize: 13, fontWeight: 800, opacity: 0.8 }}>
          혜자와 시작하기
        </Typography>
        <Typography
          sx={{
            mt: 1.5,
            fontSize: 28,
            lineHeight: 1.3,
            fontWeight: 800,
            letterSpacing: '-0.04em',
            wordBreak: 'keep-all',
          }}
        >
          내 조건은 한 번만,
          <br />
          혜택은 푸짐하게
        </Typography>

        <Stack spacing={1.5} sx={{ mt: 3.5 }}>
          {BENEFITS.map((benefit) => (
            <Stack key={benefit.text} direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
              <Box
                sx={{
                  display: 'grid',
                  placeItems: 'center',
                  width: 32,
                  height: 32,
                  flexShrink: 0,
                  borderRadius: '10px',
                  bgcolor: 'rgba(255, 255, 255, 0.16)',
                }}
              >
                <AppIcon name={benefit.icon} size={18} />
              </Box>
              <Typography sx={{ fontSize: 14, lineHeight: 1.5, opacity: 0.92 }}>
                {benefit.text}
              </Typography>
            </Stack>
          ))}
        </Stack>

        <Box
          sx={{
            mt: 'auto',
            pt: 4,
            mx: -1,
            p: 1.5,
            borderRadius: '20px',
            bgcolor: 'rgba(255, 255, 255, 0.94)',
          }}
        >
          <Illustration name="profile" sx={{ width: '100%' }} />
        </Box>
      </Stack>

      <Box sx={{ minWidth: 0, p: { xs: 2.5, sm: 4 }, [WIDE]: { p: 5 } }}>{children}</Box>
    </Card>
  );
}

export default FormPageLayout;
