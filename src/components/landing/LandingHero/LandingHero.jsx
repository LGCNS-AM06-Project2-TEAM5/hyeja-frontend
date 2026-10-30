import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import AppIcon from '@/components/common/AppIcon';
import { ROUTES } from '@/constants/routes';

const LANDING_FEATURES = [
  {
    icon: 'check-circle',
    eyebrow: '내 조건으로',
    title: '받을 수 있는 정책만',
    description: '나이, 지역, 소득과 주거 조건을 한 번 등록하면 나에게 맞는 정책을 골라드려요.',
    color: '#6558d3',
    background: '#efedff',
  },
  {
    icon: 'info-circle',
    eyebrow: '쉬운 말로',
    title: '핵심 정보만 빠르게',
    description: '긴 공고문에서 지원 내용과 신청 조건, 기간처럼 꼭 필요한 내용만 모아 보여드려요.',
    color: '#1877a8',
    background: '#e8f6ff',
  },
  {
    icon: 'bell-outline',
    eyebrow: '놓치지 않게',
    title: '관심 정책 마감 알림',
    description: '마음에 드는 정책을 저장해 두면 신청할 때를 놓치지 않도록 알림으로 챙겨드려요.',
    color: '#a05b16',
    background: '#fff2df',
  },
];

function PolicyArtwork() {
  return (
    <Box
      aria-hidden="true"
      sx={{
        position: 'relative',
        width: '100%',
        height: { xs: 238, sm: 340, md: 390 },
        minWidth: 0,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: { xs: 20, sm: 36 },
          right: { xs: '8%', sm: '3%' },
          width: { xs: 205, sm: 286, md: 326 },
          height: { xs: 205, sm: 286, md: 326 },
          borderRadius: '50%',
          background: 'linear-gradient(145deg, #786cff 0%, #4b39c7 100%)',
          boxShadow: '0 26px 70px rgba(65, 45, 174, 0.28)',
        }}
      />

      <Box
        sx={{
          position: 'absolute',
          top: { xs: 32, sm: 58, md: 64 },
          right: { xs: '18%', sm: '10%', md: '8%' },
          width: { xs: 176, sm: 246, md: 278 },
          p: { xs: 1.5, sm: 2.25 },
          borderRadius: { xs: '18px', sm: '24px' },
          backgroundColor: 'rgba(255, 255, 255, 0.96)',
          border: '1px solid rgba(255, 255, 255, 0.74)',
          boxShadow: '0 22px 50px rgba(34, 24, 93, 0.24)',
          transform: 'rotate(2deg)',
        }}
      >
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ fontSize: { xs: 9, sm: 12 }, fontWeight: 800, color: '#6558d3' }}>
            나에게 맞는 정책
          </Typography>
          <Box
            sx={{
              px: { xs: 0.75, sm: 1 },
              py: 0.4,
              borderRadius: 99,
              backgroundColor: '#fff0ef',
              color: '#d0473d',
              fontSize: { xs: 8, sm: 10 },
              fontWeight: 800,
            }}
          >
            D-5
          </Box>
        </Stack>

        <Typography
          sx={{
            mt: { xs: 1.25, sm: 2 },
            fontSize: { xs: 15, sm: 20, md: 22 },
            lineHeight: 1.35,
            fontWeight: 800,
            letterSpacing: '-0.04em',
          }}
        >
          청년 월세
          <br />
          한시 특별지원
        </Typography>
        <Typography
          sx={{ mt: 0.75, fontSize: { xs: 9, sm: 12 }, lineHeight: 1.55, color: 'text.secondary' }}
        >
          부모님과 떨어져 사는 청년의
          <br />
          월세 부담을 덜어드려요.
        </Typography>

        <Stack direction="row" spacing={0.75} sx={{ mt: { xs: 1.25, sm: 2 } }}>
          {['만 19~34세', '무주택'].map((label) => (
            <Box
              key={label}
              sx={{
                px: { xs: 0.75, sm: 1 },
                py: 0.5,
                borderRadius: 99,
                bgcolor: '#f3f2f8',
                fontSize: { xs: 8, sm: 10 },
                fontWeight: 700,
                color: 'text.secondary',
              }}
            >
              {label}
            </Box>
          ))}
        </Stack>
      </Box>

      <Box
        sx={{
          position: 'absolute',
          left: { xs: '4%', sm: '2%', md: 0 },
          bottom: { xs: 24, sm: 56, md: 66 },
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 0.75, sm: 1.25 },
          px: { xs: 1.25, sm: 1.75 },
          py: { xs: 1, sm: 1.4 },
          borderRadius: { xs: '14px', sm: '18px' },
          bgcolor: '#fff',
          boxShadow: '0 16px 38px rgba(34, 24, 93, 0.18)',
          transform: 'rotate(-4deg)',
        }}
      >
        <Box
          sx={{
            display: 'grid',
            placeItems: 'center',
            width: { xs: 27, sm: 36 },
            height: { xs: 27, sm: 36 },
            borderRadius: '50%',
            bgcolor: '#e8f8ef',
            color: '#09853f',
          }}
        >
          <AppIcon name="check" size={18} />
        </Box>
        <Box>
          <Typography
            sx={{ fontSize: { xs: 8, sm: 10 }, fontWeight: 700, color: 'text.secondary' }}
          >
            예상 지원 혜택
          </Typography>
          <Typography sx={{ fontSize: { xs: 12, sm: 16 }, fontWeight: 800 }}>
            월 최대 20만 원
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          position: 'absolute',
          right: { xs: '1%', sm: '-2%', md: '-3%' },
          bottom: { xs: 18, sm: 32, md: 40 },
          px: { xs: 1.1, sm: 1.5 },
          py: { xs: 0.8, sm: 1.1 },
          borderRadius: { xs: '12px', sm: '16px' },
          color: '#fff',
          background: 'linear-gradient(135deg, #27213f 0%, #171326 100%)',
          boxShadow: '0 14px 30px rgba(25, 19, 53, 0.22)',
        }}
      >
        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
          <AppIcon name="bell-outline" size={16} />
          <Typography sx={{ fontSize: { xs: 9, sm: 11 }, fontWeight: 700 }}>
            마감 전에 알려드려요
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}

function LandingHero() {
  return (
    <>
      <Box
        component="section"
        aria-labelledby="landing-heading"
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: { xs: '24px', sm: '32px', md: '40px' },
          px: { xs: 2, sm: 4, md: 7 },
          pt: { xs: 4.5, sm: 6, md: 8 },
          pb: { xs: 2.5, sm: 5, md: 7 },
          background:
            'radial-gradient(circle at 8% 0%, rgba(255,255,255,0.95) 0, rgba(255,255,255,0) 32%), linear-gradient(135deg, #f5f3ff 0%, #edf4ff 56%, #f7f5ff 100%)',
          border: '1px solid rgba(101, 88, 211, 0.10)',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -90,
            right: -80,
            width: 260,
            height: 260,
            borderRadius: '50%',
            bgcolor: 'rgba(111, 93, 230, 0.09)',
            filter: 'blur(2px)',
          }}
        />

        <Box
          sx={{
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: {
              xs: 'minmax(0, 1fr)',
              sm: 'minmax(0, 1.15fr) minmax(260px, 0.85fr)',
            },
            alignItems: 'center',
            columnGap: { sm: 3, md: 6 },
          }}
        >
          <Stack sx={{ minWidth: 0, alignItems: { xs: 'center', sm: 'flex-start' } }}>
            <Stack
              direction="row"
              spacing={0.75}
              sx={{
                alignItems: 'center',
                width: 'fit-content',
                px: 1.4,
                py: 0.8,
                borderRadius: 99,
                bgcolor: 'rgba(255, 255, 255, 0.78)',
                border: '1px solid rgba(101, 88, 211, 0.14)',
                color: '#5648c8',
              }}
            >
              <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#6558d3' }} />
              <Typography sx={{ fontSize: { xs: 11, sm: 12, md: 13 }, fontWeight: 800 }}>
                청년 주거 정책, 혜자로 한눈에
              </Typography>
            </Stack>

            <Typography
              id="landing-heading"
              component="h1"
              aria-label="받을 수 있는 주거 혜택, 한 번에 찾아요"
              sx={{
                mt: { xs: 2.25, sm: 2.75 },
                fontSize: { xs: 34, sm: 42, md: 54 },
                lineHeight: { xs: 1.22, sm: 1.18, md: 1.14 },
                fontWeight: 800,
                letterSpacing: '-0.052em',
                textAlign: { xs: 'center', sm: 'left' },
                wordBreak: 'keep-all',
              }}
            >
              받을 수 있는 주거 혜택,
              <Box component="span" sx={{ display: 'block', color: '#6558d3' }}>
                한 번에 찾아요
              </Box>
            </Typography>

            <Typography
              sx={{
                mt: { xs: 1.75, sm: 2.25 },
                maxWidth: 560,
                fontSize: { xs: 14, sm: 15, md: 17 },
                lineHeight: 1.75,
                color: 'text.secondary',
                textAlign: { xs: 'center', sm: 'left' },
                wordBreak: 'keep-all',
              }}
            >
              흩어진 청년 주거 정책을 일일이 찾지 마세요. 내 조건에 맞는 혜택부터 신청에 필요한
              정보까지 혜자가 쉽게 정리해드려요.
            </Typography>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.25}
              sx={{
                width: { xs: '100%', sm: 'auto' },
                mt: { xs: 3, sm: 3.5 },
              }}
            >
              <Button
                component={RouterLink}
                to={ROUTES.HOME}
                variant="contained"
                endIcon={<AppIcon name="arrow-right" size={18} />}
                sx={{
                  height: { xs: 46, sm: 48 },
                  px: 2.5,
                  bgcolor: '#6558d3',
                  color: '#fff',
                  fontSize: { xs: 14, sm: 15 },
                  fontWeight: 800,
                  borderRadius: '10px',
                  '&:hover': { bgcolor: '#5143bd' },
                }}
              >
                주거 정책 둘러보기
              </Button>
              <Button
                component={RouterLink}
                to={ROUTES.SIGNUP}
                variant="outlined"
                sx={{
                  height: { xs: 46, sm: 48 },
                  px: 2.5,
                  bgcolor: 'rgba(255, 255, 255, 0.64)',
                  borderColor: 'rgba(101, 88, 211, 0.28)',
                  fontSize: { xs: 14, sm: 15 },
                  fontWeight: 800,
                  borderRadius: '10px',
                }}
              >
                내 조건 등록하기
              </Button>
            </Stack>

            <Stack
              direction="row"
              spacing={0.75}
              sx={{ mt: 1.75, alignItems: 'center', color: 'text.secondary' }}
            >
              <AppIcon name="check-circle" size={16} />
              <Typography sx={{ fontSize: { xs: 11, sm: 12 } }}>
                회원가입 없이도 전체 정책을 둘러볼 수 있어요
              </Typography>
            </Stack>
          </Stack>

          <PolicyArtwork />
        </Box>
      </Box>

      <Box
        component="section"
        aria-labelledby="landing-features-heading"
        sx={{ pt: { xs: 7, sm: 9, md: 12 } }}
      >
        <Stack sx={{ alignItems: 'center', textAlign: 'center' }}>
          <Typography
            sx={{
              fontSize: { xs: 12, sm: 13 },
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: '#6558d3',
            }}
          >
            혜자가 도와드릴게요
          </Typography>
          <Typography
            id="landing-features-heading"
            component="h2"
            sx={{
              mt: 1.25,
              fontSize: { xs: 26, sm: 32, md: 40 },
              lineHeight: 1.25,
              fontWeight: 800,
              letterSpacing: '-0.04em',
              wordBreak: 'keep-all',
            }}
          >
            복잡한 주거 정책이 쉬워져요
          </Typography>
          <Typography
            sx={{
              mt: 1.5,
              maxWidth: 590,
              fontSize: { xs: 14, sm: 15, md: 16 },
              lineHeight: 1.7,
              color: 'text.secondary',
              wordBreak: 'keep-all',
            }}
          >
            정책을 찾고, 이해하고, 신청 시기를 챙기는 일을 한곳에서 해결하세요.
          </Typography>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
            gap: { xs: 1.5, sm: 2, md: 2.5 },
            mt: { xs: 3.5, sm: 5 },
          }}
        >
          {LANDING_FEATURES.map((feature) => (
            <Box
              key={feature.title}
              sx={{
                minWidth: 0,
                p: { xs: 2.5, sm: 2.5, md: 3.5 },
                borderRadius: { xs: '20px', md: '24px' },
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 18px 44px rgba(31, 28, 55, 0.08)',
                  borderColor: 'rgba(101, 88, 211, 0.22)',
                },
              }}
            >
              <Box
                sx={{
                  display: 'grid',
                  placeItems: 'center',
                  width: { xs: 42, md: 48 },
                  height: { xs: 42, md: 48 },
                  borderRadius: '14px',
                  color: feature.color,
                  bgcolor: feature.background,
                }}
              >
                <AppIcon name={feature.icon} size={24} />
              </Box>
              <Typography
                sx={{
                  mt: 2.25,
                  fontSize: { xs: 11, md: 12 },
                  fontWeight: 800,
                  color: feature.color,
                }}
              >
                {feature.eyebrow}
              </Typography>
              <Typography
                component="h3"
                sx={{
                  mt: 0.5,
                  fontSize: { xs: 18, sm: 17, md: 20 },
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                }}
              >
                {feature.title}
              </Typography>
              <Typography
                sx={{
                  mt: 1.25,
                  fontSize: { xs: 13, md: 14 },
                  lineHeight: 1.7,
                  color: 'text.secondary',
                  wordBreak: 'keep-all',
                }}
              >
                {feature.description}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </>
  );
}

export default LandingHero;
