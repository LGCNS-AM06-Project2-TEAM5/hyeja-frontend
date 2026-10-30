import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import AppIcon from '@/components/common/AppIcon';
import LandingHero from '@/components/landing/LandingHero';
import { ROUTES } from '@/constants/routes';

const STEPS = [
  {
    number: '01',
    title: '내 조건을 알려주세요',
    description: '나이와 지역, 소득, 주거 상황처럼 정책 판정에 필요한 조건을 등록해요.',
  },
  {
    number: '02',
    title: '맞는 혜택만 확인하세요',
    description: '신청할 수 있는 정책과 추가 확인이 필요한 정책을 구분해서 보여드려요.',
  },
  {
    number: '03',
    title: '관심 정책을 챙겨보세요',
    description: '저장해 둔 정책의 신청 마감이 다가오면 알림으로 놓치지 않게 도와드려요.',
  },
];

function LandingPage() {
  return (
    <Stack spacing={{ xs: 8, sm: 11, md: 14 }}>
      <LandingHero />

      <Box component="section" aria-labelledby="landing-steps-heading">
        <Stack sx={{ alignItems: 'center', textAlign: 'center' }}>
          <Typography
            sx={{
              fontSize: { xs: 12, sm: 13 },
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: '#6558d3',
            }}
          >
            혜자 사용법
          </Typography>
          <Typography
            id="landing-steps-heading"
            component="h2"
            sx={{
              mt: 1.25,
              fontSize: { xs: 26, sm: 32, md: 40 },
              lineHeight: 1.25,
              fontWeight: 800,
              letterSpacing: '-0.04em',
            }}
          >
            세 단계면 충분해요
          </Typography>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
            gap: { xs: 1.5, sm: 2 },
            mt: { xs: 3.5, sm: 5 },
          }}
        >
          {STEPS.map((step) => (
            <Box
              key={step.number}
              sx={{
                position: 'relative',
                minWidth: 0,
                p: { xs: 2.5, sm: 2.75, md: 3.5 },
                borderRadius: { xs: '20px', md: '24px' },
                bgcolor: '#f7f6fc',
              }}
            >
              <Typography
                sx={{
                  fontSize: { xs: 24, sm: 26, md: 30 },
                  lineHeight: 1,
                  fontWeight: 800,
                  color: '#c3bdf5',
                }}
              >
                {step.number}
              </Typography>
              <Typography
                component="h3"
                sx={{
                  mt: 2,
                  fontSize: { xs: 18, sm: 17, md: 20 },
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                }}
              >
                {step.title}
              </Typography>
              <Typography
                sx={{
                  mt: 1,
                  fontSize: { xs: 13, md: 14 },
                  lineHeight: 1.7,
                  color: 'text.secondary',
                  wordBreak: 'keep-all',
                }}
              >
                {step.description}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <Box
        component="section"
        sx={{
          position: 'relative',
          overflow: 'hidden',
          px: { xs: 2.5, sm: 5, md: 7 },
          py: { xs: 4.5, sm: 6 },
          borderRadius: { xs: '24px', sm: '32px' },
          bgcolor: '#231d45',
          color: '#fff',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            right: -70,
            top: -100,
            width: 270,
            height: 270,
            borderRadius: '50%',
            bgcolor: 'rgba(120, 108, 255, 0.32)',
          }}
        />
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={3}
          sx={{
            position: 'relative',
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Typography
              component="h2"
              sx={{
                fontSize: { xs: 25, sm: 31, md: 38 },
                lineHeight: 1.3,
                fontWeight: 800,
                letterSpacing: '-0.04em',
                wordBreak: 'keep-all',
              }}
            >
              내게 맞는 주거 혜택,
              <br />
              오늘부터 혜자와 찾아봐요.
            </Typography>
            <Typography sx={{ mt: 1.5, fontSize: { xs: 13, sm: 15 }, color: '#c9c5df' }}>
              복잡했던 정책 찾기를 더 쉽고 빠르게 시작하세요.
            </Typography>
          </Box>
          <Button
            component={RouterLink}
            to={ROUTES.HOME}
            variant="contained"
            endIcon={<AppIcon name="arrow-right" size={18} />}
            sx={{
              flexShrink: 0,
              height: 48,
              px: 2.5,
              bgcolor: '#fff',
              color: '#231d45',
              fontSize: { xs: 14, sm: 15 },
              fontWeight: 800,
              borderRadius: '10px',
              '&:hover': { bgcolor: '#eeeaff' },
            }}
          >
            혜택 둘러보기
          </Button>
        </Stack>
      </Box>
    </Stack>
  );
}

export default LandingPage;
