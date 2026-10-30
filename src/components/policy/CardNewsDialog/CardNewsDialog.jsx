import { Link as RouterLink, useNavigate } from 'react-router-dom';
import AppIcon from '@/components/common/AppIcon';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import DdayBadge from '@/components/common/DdayBadge';
import { TOAST_MESSAGES } from '@/constants/messages';
import { buildPolicyDetailPath } from '@/constants/routes';
import { useToast } from '@/hooks/useToast';
import { getSubtypeTone, GRADIENTS, RADIUS, TONES } from '@/styles/theme';

const getTagTypography = (tag) => {
  const length = Array.from(tag).length;

  if (length >= 15) {
    return { fontSize: { xs: 15, sm: 16 }, letterSpacing: '-0.04em' };
  }

  if (length >= 9) {
    return { fontSize: { xs: 16, sm: 18 }, letterSpacing: '-0.03em' };
  }

  return { fontSize: { xs: 18, sm: 20 }, letterSpacing: '-0.02em' };
};

/** 장마다 다른 파스텔 색과 그림을 써서 4장이 한 장씩 넘기는 카드뉴스처럼 보이게 한다. 첫 장은 보라 그라데이션이다. */
const PANEL_STYLES = [
  { background: GRADIENTS.accent, fg: '#ffffff', sub: 'rgba(255, 255, 255, 0.82)', icon: 'home' },
  { background: TONES.sky.bg, fg: TONES.sky.fg, icon: 'account-outline' },
  { background: TONES.mint.bg, fg: TONES.mint.fg, icon: 'check-circle' },
  { background: TONES.peach.bg, fg: TONES.peach.fg, icon: 'bell-outline' },
];

function CardNewsPanel({ card, cardCount, children }) {
  const headingParts = card.heading?.split(/(\([^)]*\))/) ?? [];
  const panelStyle = PANEL_STYLES[(card.order - 1) % PANEL_STYLES.length];
  const isInverted = card.order === 1;

  return (
    <Stack
      sx={{
        position: 'relative',
        overflow: 'hidden',
        p: { xs: 2.5, sm: 3 },
        minHeight: { xs: 0, sm: 280, md: 0 },
        minWidth: 0,
        borderRadius: `${RADIUS.card}px`,
        background: panelStyle.background,
        color: isInverted ? panelStyle.fg : 'text.primary',
        // 첫 장(보라)에서는 본문·칩도 흰색 계열로 맞춘다.
        ...(isInverted && {
          '& .MuiTypography-root': { color: 'inherit' },
          '& .card-news-body': { color: panelStyle.sub },
        }),
      }}
    >
      <Box
        aria-hidden="true"
        sx={{
          position: 'absolute',
          right: -18,
          bottom: -18,
          color: panelStyle.fg,
          opacity: isInverted ? 0.16 : 0.12,
        }}
      >
        <AppIcon name={panelStyle.icon} size={132} />
      </Box>

      {/* 본문이 남은 높이를 모두 차지해, 액션은 카드 맨 아래에 붙는다. */}
      <Stack spacing={1.5} sx={{ position: 'relative', flexGrow: 1 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Typography
            aria-hidden="true"
            sx={{ fontSize: 30, lineHeight: 1, fontWeight: 800, color: panelStyle.fg }}
          >
            {String(card.order).padStart(2, '0')}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              px: 1.1,
              py: 0.4,
              borderRadius: 99,
              fontWeight: 700,
              color: isInverted ? 'inherit' : panelStyle.fg,
              bgcolor: isInverted ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.7)',
            }}
          >
            {card.order} / {cardCount}
            {card.label && ` · ${card.label}`}
          </Typography>
        </Stack>

        {card.heading && (
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: 20, sm: 22 },
              lineHeight: 1.35,
              wordBreak: 'keep-all',
              overflowWrap: 'break-word',
              textWrap: 'balance',
            }}
          >
            {headingParts.map((part) =>
              part.startsWith('(') ? (
                <Box
                  key={part}
                  component="span"
                  sx={{ whiteSpace: { xs: 'normal', md: 'nowrap' }, overflowWrap: 'anywhere' }}
                >
                  {part}
                </Box>
              ) : (
                part
              ),
            )}
          </Typography>
        )}

        {card.tags?.length > 0 && (
          <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
            {card.tags.map((tag) => (
              <Chip
                key={tag}
                label={
                  <Typography
                    component="span"
                    sx={{
                      ...getTagTypography(tag),
                      lineHeight: 1.35,
                      fontWeight: 700,
                      wordBreak: 'keep-all',
                      overflowWrap: 'break-word',
                    }}
                  >
                    {tag}
                  </Typography>
                }
                sx={{
                  height: 'auto',
                  maxWidth: '100%',
                  bgcolor: 'common.white',
                  color: panelStyle.fg,
                  '& .MuiChip-label': {
                    display: 'block',
                    py: 0.75,
                    px: 1.5,
                    whiteSpace: { xs: 'normal', sm: 'nowrap' },
                  },
                }}
              />
            ))}
          </Stack>
        )}

        {card.body && (
          <Typography
            variant="body1"
            color="text.secondary"
            className="card-news-body"
            sx={{
              fontSize: 15,
              lineHeight: 1.65,
              whiteSpace: 'pre-line',
              wordBreak: 'keep-all',
              overflowWrap: 'break-word',
              textWrap: 'pretty',
            }}
          >
            {card.body}
          </Typography>
        )}
      </Stack>

      {children && <Box sx={{ position: 'relative', pt: 3 }}>{children}</Box>}
    </Stack>
  );
}

/** isOpenedFromDetail은 정책 상세에서 열었다는 뜻이다. 이미 상세 화면이라 상세로 보내는 길을 두지 않는다. */
function CardNewsDialog({
  cardNews,
  onClose,
  isFavorite = false,
  onToggleFavorite,
  isOpenedFromDetail = false,
}) {
  const navigate = useNavigate();
  const { showError } = useToast();

  if (!cardNews) {
    return null;
  }

  const cards = cardNews.cards ?? [];
  const cardCount = cardNews.cardCount ?? cards.length;

  const handleApplyClick = () => {
    if (cardNews.applyUrl) {
      window.open(cardNews.applyUrl, '_blank', 'noopener');
      return;
    }

    // 신청 링크가 없어도 막다른 길이 되지 않게, 신청 방법이 적힌 정책 상세로 보낸다.
    showError(TOAST_MESSAGES.APPLY_LINK_MISSING);
    onClose();

    if (!isOpenedFromDetail) {
      navigate(buildPolicyDetailPath(cardNews.policyId));
    }
  };

  // 설계서 S-01: 마지막 장에서 바로 신청하거나 상세로 넘어갈 수 있어야 한다.
  const renderCardActions = (card) => {
    if (card.order !== cardCount) {
      return null;
    }

    return (
      <Stack spacing={1} sx={{ alignItems: 'flex-start' }}>
        <Button variant="contained" fullWidth onClick={handleApplyClick}>
          이 정책 신청하기 <AppIcon name="arrow-up-right" size={16} />
        </Button>
        {!isOpenedFromDetail && (
          <Link
            component={RouterLink}
            to={buildPolicyDetailPath(cardNews.policyId)}
            onClick={onClose}
            variant="body1"
          >
            정책 상세 보기 <AppIcon name="arrow-right" size={16} />
          </Link>
        )}
      </Stack>
    );
  };

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth={false}
      fullWidth
      slotProps={{
        paper: {
          sx: {
            width: {
              xs: 'calc(100vw - 24px)',
              sm: 'min(900px, calc(100vw - 48px))',
              md: 'min(1440px, calc(100vw - 48px))',
            },
            maxHeight: { xs: 'calc(100dvh - 24px)', sm: 'calc(100dvh - 48px)' },
            minHeight: { xs: 0, md: 'min(520px, calc(100dvh - 48px))' },
            m: { xs: 1.5, sm: 3 },
          },
        },
      }}
    >
      {/* 좁은 화면에서는 제목 묶음만 줄바꿈하고, 관심·닫기는 늘 오른쪽 위에 둔다. */}
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: 'flex-start', px: { xs: 2, sm: 3 }, pt: 2.5, pb: 0.5 }}
      >
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          sx={{ flex: 1, minWidth: 0, minHeight: 40, alignItems: 'center', flexWrap: 'wrap' }}
        >
          <Chip
            label={cardNews.subtypeName}
            size="small"
            sx={{
              flexShrink: 0,
              fontWeight: 700,
              bgcolor: getSubtypeTone(cardNews.subtypeName).bg,
              color: getSubtypeTone(cardNews.subtypeName).fg,
            }}
          />

          <Typography variant="h2" sx={{ flexGrow: 1, minWidth: 0, overflowWrap: 'anywhere' }}>
            {cardNews.title}
          </Typography>

          <DdayBadge
            applyPeriodType={cardNews.applyPeriodType}
            applyEndDate={cardNews.applyEndDate}
            remainingDays={cardNews.remainingDays}
          />
        </Stack>

        <Stack direction="row" sx={{ flexShrink: 0 }}>
          {onToggleFavorite && (
            <IconButton
              aria-label={isFavorite ? '관심 정책 해제' : '관심 정책 저장'}
              onClick={() => onToggleFavorite(cardNews.policyId)}
              sx={{ color: isFavorite ? 'favorite.main' : 'text.disabled' }}
            >
              <AppIcon name={isFavorite ? 'heart' : 'heart-outline'} size={20} />
            </IconButton>
          )}

          <IconButton onClick={onClose} aria-label="닫기">
            <AppIcon name="close" size={20} />
          </IconButton>
        </Stack>
      </Stack>

      <DialogContent sx={{ display: 'flex', px: { xs: 2, sm: 3 }, pb: 3 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'minmax(0, 1fr)',
              sm: 'repeat(2, minmax(0, 1fr))',
              md: 'repeat(4, minmax(0, 1fr))',
            },
            // 설명이 길어져도 그리드 행이 내용보다 작아지지 않게 한다.
            gridAutoRows: 'minmax(max-content, 1fr)',
            gap: { xs: 1.5, sm: 2 },
            flex: 1,
            minWidth: 0,
          }}
        >
          {cards.map((card) => (
            <CardNewsPanel key={card.order} card={card} cardCount={cardCount}>
              {renderCardActions(card)}
            </CardNewsPanel>
          ))}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default CardNewsDialog;
