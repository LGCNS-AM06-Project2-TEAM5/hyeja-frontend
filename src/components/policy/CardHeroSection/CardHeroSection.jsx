import { useState } from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { keyframes } from '@mui/material/styles';

import AppIcon from '@/components/common/AppIcon';
import DdayBadge from '@/components/common/DdayBadge';
import ErrorState from '@/components/common/ErrorState';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { COLORS, SHADOWS, TONES } from '@/styles/theme';

/** 한 장을 보여 주는 시간. 이 시간이 지나면 다음 카드뉴스로 넘어간다. */
const SLIDE_DURATION_MS = 5000;

/** 배너와 오른쪽 목록을 나란히 둘 만큼 넓은 화면 */
const WIDE = '@media (min-width:1024px)';

/** 장마다 바탕색을 돌려 써서, 어느 한 장만 튀지 않고 넘길 때마다 새 카드처럼 보이게 한다. */
const SLIDE_THEMES = [
  { tone: TONES.violet, background: 'linear-gradient(135deg, #f3f0ff 0%, #e4defe 100%)' },
  { tone: TONES.sky, background: 'linear-gradient(135deg, #eef8ff 0%, #d9efff 100%)' },
  { tone: TONES.mint, background: 'linear-gradient(135deg, #effbf5 0%, #d8f3e5 100%)' },
  { tone: TONES.peach, background: 'linear-gradient(135deg, #fff6ea 0%, #ffe8cc 100%)' },
];

/** 모든 카드뉴스가 같은 4장 구성이라, 배너 오른쪽에 어떤 순서로 설명하는지 미리 보여 준다. */
const CARD_PREVIEW_LABELS = [
  '무슨 정책인가요',
  '누가 받을 수 있나요',
  '무엇을 받나요',
  '어떻게 신청하나요',
];

const fillProgress = keyframes`
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
`;

const slideIn = keyframes`
  from { opacity: 0; transform: translateX(16px); }
  to { opacity: 1; transform: translateX(0); }
`;

function CardPreviewGrid({ tone }) {
  return (
    <Box
      aria-hidden="true"
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 132px)',
        gap: 1.25,
        alignContent: 'center',
        flexShrink: 0,
      }}
    >
      {CARD_PREVIEW_LABELS.map((label, index) => (
        <Stack
          key={label}
          spacing={0.75}
          sx={{
            p: 1.5,
            minHeight: 92,
            borderRadius: '16px',
            bgcolor: 'rgba(255, 255, 255, 0.86)',
            boxShadow: SHADOWS.soft,
          }}
        >
          <Typography sx={{ fontSize: 20, lineHeight: 1, fontWeight: 800, color: tone.fg }}>
            {String(index + 1).padStart(2, '0')}
          </Typography>
          <Typography
            sx={{ fontSize: 12, lineHeight: 1.4, fontWeight: 700, color: 'text.secondary' }}
          >
            {label}
          </Typography>
        </Stack>
      ))}
    </Box>
  );
}

/**
 * 홈 "혜자가 추천해요" 카드뉴스 배너. 5초마다 다음 정책으로 넘어가고,
 * 마우스를 올리거나 키보드로 들어오면 멈춘다. 배너를 누르면 카드뉴스 4장 팝업을 연다.
 * isPaused는 팝업이 열려 있는 동안처럼 바깥에서 멈춰야 할 때 준다.
 */
function CardHeroSection({ cardNewsList, isLoading, errorMessage, onSelect, isPaused = false }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isStopped, setIsStopped] = useState(false);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (errorMessage) {
    return <ErrorState message={errorMessage} />;
  }

  if (cardNewsList.length === 0) {
    return null;
  }

  const slideCount = cardNewsList.length;
  // 목록이 줄어들어도 없는 장을 가리키지 않게 맞춘다.
  const currentIndex = activeIndex % slideCount;
  const current = cardNewsList[currentIndex];
  const theme = SLIDE_THEMES[currentIndex % SLIDE_THEMES.length];
  const hasMany = slideCount > 1;
  const isPlaying = hasMany && !isStopped && !isPaused && !isHovered && !isFocused;

  const goTo = (index) => setActiveIndex((index + slideCount) % slideCount);

  return (
    <Box
      role="region"
      aria-roledescription="carousel"
      aria-label="혜자가 추천하는 카드뉴스"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      // 키보드로 들어왔을 때만 멈춘다. 마우스로 버튼을 누른 뒤 남은 포커스로는 멈추지 않는다.
      onFocus={(event) => setIsFocused(event.target.matches(':focus-visible'))}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsFocused(false);
        }
      }}
      sx={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr)',
        gap: 2,
        [WIDE]: { gridTemplateColumns: 'minmax(0, 1fr) 340px' },
      }}
    >
      <Card
        elevation={0}
        aria-live={isPlaying ? 'off' : 'polite'}
        sx={{ position: 'relative', minHeight: { xs: 0, sm: 300 }, background: theme.background }}
      >
        <CardActionArea
          key={currentIndex}
          onClick={() => onSelect(current)}
          aria-roledescription="slide"
          sx={{
            height: '100%',
            display: 'flex',
            alignItems: 'stretch',
            justifyContent: 'space-between',
            gap: 2,
            p: { xs: 2.5, sm: 4 },
            pb: { xs: 8, sm: 8 },
            animation: `${slideIn} 360ms ease`,
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
          }}
        >
          <Stack sx={{ minWidth: 0, alignItems: 'flex-start' }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Box
                component="span"
                sx={{
                  px: 1.25,
                  py: 0.5,
                  borderRadius: 99,
                  bgcolor: 'rgba(255, 255, 255, 0.8)',
                  color: theme.tone.fg,
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                추천 {currentIndex + 1} / {slideCount}
              </Box>
              <DdayBadge
                applyPeriodType={current.applyPeriodType}
                applyEndDate={current.applyEndDate}
              />
            </Stack>

            <Typography
              variant="h1"
              sx={{
                mt: 2,
                fontSize: { xs: 24, sm: 30 },
                lineHeight: 1.3,
                wordBreak: 'keep-all',
                overflowWrap: 'anywhere',
              }}
            >
              {current.title}
            </Typography>

            <Typography
              sx={{
                mt: 1.25,
                fontSize: 15,
                lineHeight: 1.65,
                color: 'text.secondary',
                wordBreak: 'keep-all',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {current.summary}
            </Typography>

            <Stack
              component="span"
              direction="row"
              spacing={0.75}
              sx={{
                mt: 'auto',
                pt: 3,
                alignItems: 'center',
                color: theme.tone.fg,
                fontSize: 14,
                fontWeight: 800,
              }}
            >
              <span>카드뉴스 {current.cardCount}장 보기</span>
              <AppIcon name="arrow-right" size={16} />
            </Stack>
          </Stack>

          <Box sx={{ display: { xs: 'none', sm: 'flex' } }}>
            <CardPreviewGrid tone={theme.tone} />
          </Box>
        </CardActionArea>

        {hasMany && (
          <>
            <Stack
              direction="row"
              spacing={0.5}
              sx={{
                position: 'absolute',
                left: { xs: 12, sm: 24 },
                bottom: 14,
                alignItems: 'center',
              }}
            >
              <IconButton
                size="small"
                aria-label="이전 카드뉴스"
                onClick={() => goTo(currentIndex - 1)}
                sx={{ bgcolor: 'rgba(255, 255, 255, 0.8)' }}
              >
                <AppIcon name="chevron-left" size={18} />
              </IconButton>
              <IconButton
                size="small"
                aria-label={isStopped ? '자동 넘김 시작' : '자동 넘김 멈추기'}
                onClick={() => setIsStopped((previous) => !previous)}
                sx={{ bgcolor: 'rgba(255, 255, 255, 0.8)' }}
              >
                <AppIcon name={isStopped ? 'play' : 'pause'} size={16} />
              </IconButton>
              <IconButton
                size="small"
                aria-label="다음 카드뉴스"
                onClick={() => goTo(currentIndex + 1)}
                sx={{ bgcolor: 'rgba(255, 255, 255, 0.8)' }}
              >
                <AppIcon name="chevron-right" size={18} />
              </IconButton>

              <Stack direction="row" spacing={0.75} sx={{ pl: 1, [WIDE]: { display: 'none' } }}>
                {cardNewsList.map((cardNews, index) => (
                  <Box
                    key={cardNews.policyId}
                    component="button"
                    type="button"
                    aria-label={`${index + 1}번째 카드뉴스 보기`}
                    onClick={() => goTo(index)}
                    sx={{
                      width: index === currentIndex ? 20 : 8,
                      height: 8,
                      p: 0,
                      border: 0,
                      borderRadius: 99,
                      cursor: 'pointer',
                      bgcolor: index === currentIndex ? theme.tone.fg : 'rgba(35, 29, 69, 0.18)',
                      transition: 'width 200ms ease',
                    }}
                  />
                ))}
              </Stack>
            </Stack>

            {/* 진행 막대가 끝까지 차면 다음 장으로 넘어간다. 멈춘 동안에는 막대도 멈춘다. */}
            <Box
              aria-hidden="true"
              sx={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: 4,
                bgcolor: 'rgba(35, 29, 69, 0.08)',
              }}
            >
              <Box
                key={currentIndex}
                onAnimationEnd={() => goTo(currentIndex + 1)}
                sx={{
                  height: '100%',
                  bgcolor: theme.tone.fg,
                  transformOrigin: 'left',
                  animation: `${fillProgress} ${SLIDE_DURATION_MS}ms linear forwards`,
                  animationPlayState: isPlaying ? 'running' : 'paused',
                  '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
                }}
              />
            </Box>
          </>
        )}
      </Card>

      {/* 넓은 화면에서는 전체 추천 목록을 옆에 두어, 지금 몇 번째인지와 다음 정책을 함께 보여 준다. */}
      <Stack spacing={1} sx={{ display: 'none', [WIDE]: { display: 'flex' } }}>
        {cardNewsList.map((cardNews, index) => {
          const itemTone = SLIDE_THEMES[index % SLIDE_THEMES.length].tone;
          const isActive = index === currentIndex;

          return (
            <ButtonBase
              key={cardNews.policyId}
              onClick={() => goTo(index)}
              aria-current={isActive ? 'true' : undefined}
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 1.5,
                px: 2,
                py: 1.25,
                textAlign: 'left',
                borderRadius: '16px',
                border: '1px solid',
                borderColor: isActive ? itemTone.fg : COLORS.line,
                bgcolor: isActive ? itemTone.bg : 'background.paper',
                transition: 'background-color 150ms ease, border-color 150ms ease',
                '&:hover': { borderColor: itemTone.fg },
              }}
            >
              <Box
                sx={{
                  display: 'grid',
                  placeItems: 'center',
                  width: 36,
                  height: 36,
                  flexShrink: 0,
                  borderRadius: '12px',
                  bgcolor: isActive ? 'common.white' : itemTone.bg,
                  color: itemTone.fg,
                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                {index + 1}
              </Box>
              <Typography
                variant="body2"
                sx={{
                  flexGrow: 1,
                  minWidth: 0,
                  fontWeight: isActive ? 800 : 500,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  wordBreak: 'keep-all',
                }}
              >
                {cardNews.title}
              </Typography>
              <DdayBadge
                applyPeriodType={cardNews.applyPeriodType}
                applyEndDate={cardNews.applyEndDate}
              />
            </ButtonBase>
          );
        })}
      </Stack>
    </Box>
  );
}

export default CardHeroSection;
