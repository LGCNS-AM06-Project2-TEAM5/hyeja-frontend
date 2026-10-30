import { useEffect, useRef, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import AppIcon from '@/components/common/AppIcon';
import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import DdayBadge from '@/components/common/DdayBadge';
import ErrorState from '@/components/common/ErrorState';
import JudgeIcon from '@/components/common/JudgeIcon';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import CardNewsDialog from '@/components/policy/CardNewsDialog';
import TermText from '@/components/policy/TermText';
import { TOAST_MESSAGES } from '@/constants/messages';
import { JUDGE_RESULT_BY_GROUP } from '@/constants/policy';
import { buildMyPagePath, MY_PAGE_TABS, ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';
import { useFavoriteToggle } from '@/hooks/useFavoriteToggle';
import { useLoginDialog } from '@/hooks/useLoginDialog';
import { useCardNewsDetail, usePolicyDetail } from '@/hooks/usePolicies';
import { useTerms } from '@/hooks/useTerms';
import { useToast } from '@/hooks/useToast';
import {
  COLORS,
  getSubtypeTone,
  GRADIENTS,
  JUDGE_TONE,
  LAYOUT,
  RADIUS,
  SHADOWS,
  TONES,
} from '@/styles/theme';
import { formatDateRange } from '@/utils/formatDate';

/** 설계서 S-06 오른쪽 카드 폭 */
const DETAIL_ASIDE_WIDTH = 380;
/** 본문과 카드를 나란히 둘 만큼 넓은 화면. 더 좁으면 카드가 본문 아래로 내려간다. */
const SIDE_BY_SIDE = '@media (min-width:1024px)';

/** 설계서 S-06 오른쪽 카드 공통 틀: 폭 380 · 여백 24. 흰 바탕에 그림자를 둬 본문 위에 떠 보이게 한다. */
const ASIDE_CARD_SX = {
  width: '100%',
  minWidth: 0,
  p: 3,
  backgroundColor: 'background.paper',
  boxShadow: SHADOWS.card,
  borderColor: 'transparent',
};

/** 본문 블록마다 붙는 아이콘과 파스텔 색 */
const SECTION_ICONS = {
  '어떤 정책인가요': { icon: 'info-circle', tone: TONES.violet },
  '지원 내용': { icon: 'check-circle', tone: TONES.mint },
  '신청 기간': { icon: 'bell-outline', tone: TONES.peach },
  '신청 방법': { icon: 'arrow-up-right', tone: TONES.sky },
  '추가 자격': { icon: 'account-outline', tone: TONES.rose },
};

/** 비로그인 카드는 조건 표가 빠져도 조건 다섯 줄이 있던 때의 높이를 유지한다. */
const GUEST_CARD_MIN_HEIGHT = 469;

/** 설계서 S-06 로그인: 종합 판정과 조건별 판정을 보여 준다. */
function JudgementCard({ judgements, summary, group }) {
  return (
    <Card variant="outlined" sx={ASIDE_CARD_SX}>
      <Stack spacing={1.75}>
        <Typography variant="subtitle1">내 조건으로 확인해 봤어요</Typography>

        {summary && (
          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: 'center',
              px: 1.5,
              py: 1.25,
              borderRadius: `${RADIUS.toast}px`,
              backgroundColor: group
                ? JUDGE_TONE[JUDGE_RESULT_BY_GROUP[group]]?.bg
                : COLORS.accentTint,
            }}
          >
            {/* 옆 문장이 판정을 말해 주므로 아이콘은 화면 낭독기에 읽히지 않게 둔다. */}
            {group && (
              <Box component="span" aria-hidden="true" sx={{ display: 'inline-flex' }}>
                <JudgeIcon result={JUDGE_RESULT_BY_GROUP[group]} size={24} />
              </Box>
            )}
            <Typography variant="body2">{summary}</Typography>
          </Stack>
        )}

        <Stack divider={<Divider />} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          {judgements.map((judgement) => (
            <Stack
              key={judgement.conditionKey}
              direction="row"
              spacing={1.25}
              sx={{ alignItems: 'center', py: 1.25 }}
            >
              <JudgeIcon result={judgement.result} size={24} />
              <Typography variant="body2" sx={{ width: 52, flexShrink: 0 }}>
                {judgement.conditionName}
              </Typography>
              <Stack
                spacing={0.25}
                sx={{ flexGrow: 1, minWidth: 0, wordBreak: 'keep-all', overflowWrap: 'anywhere' }}
              >
                <Typography variant="caption" color="text.secondary">
                  조건: {judgement.requirement}
                </Typography>
                <Typography variant="caption">내 정보: {judgement.myValue}</Typography>
              </Stack>
            </Stack>
          ))}
        </Stack>

        <Typography variant="caption" color="text.disabled">
          <AppIcon name="check" size={12} /> 충족 · <AppIcon name="cross" size={12} /> 미충족 ·{' '}
          <AppIcon name="question" size={12} /> 확인 필요 — 나이·지역·소득·취업은 코드로,
          무주택·추가 자격은 AI가 판정해요
        </Typography>

        <Link
          component={RouterLink}
          to={buildMyPagePath(MY_PAGE_TABS.CONDITION)}
          variant="body2"
          underline="hover"
          sx={{ alignSelf: 'flex-start', fontWeight: 700 }}
        >
          내 조건 수정 <AppIcon name="arrow-right" size={16} />
        </Link>
      </Stack>
    </Card>
  );
}

/**
 * 설계서 S-06 비로그인. 비로그인 상세 응답에는 조건별 값이 없다(conditions가 빈 목록).
 * 조건 표 대신 로그인 안내를 제목 아래 남은 공간의 가운데에 크게 둔다.
 */
function GuestConditionsCard({ onLogin }) {
  return (
    <Card
      variant="outlined"
      sx={{
        ...ASIDE_CARD_SX,
        display: 'flex',
        flexDirection: 'column',
        minHeight: GUEST_CARD_MIN_HEIGHT,
      }}
    >
      <Stack spacing={0.5}>
        <Typography variant="subtitle1">신청 조건 (공고 원문)</Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ wordBreak: 'keep-all', overflowWrap: 'break-word' }}
        >
          로그인하면 내 조건과 비교한 신청 가능 여부를 확인할 수 있어요.
        </Typography>
      </Stack>

      <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', pt: 3 }}>
        <Stack
          spacing={2}
          sx={{
            width: '100%',
            alignItems: 'center',
            px: 3,
            py: 4,
            border: 1,
            borderColor: 'grey.500',
            borderRadius: `${RADIUS.toast}px`,
            backgroundColor: 'background.paper',
          }}
        >
          <Box
            aria-hidden="true"
            sx={{
              display: 'grid',
              placeItems: 'center',
              width: 48,
              height: 48,
              borderRadius: '50%',
              color: 'primary.dark',
              backgroundColor: 'grey.100',
            }}
          >
            <AppIcon name="lock-outline" size={24} />
          </Box>
          <Typography variant="subtitle1" align="center">
            로그인하고 1초만에 확인하기
          </Typography>
          <Button variant="contained" fullWidth onClick={() => onLogin()} sx={{ minHeight: 44 }}>
            로그인하고 확인하기
          </Button>
        </Stack>
      </Box>
    </Card>
  );
}

/** 설계서 S-06 본문 블록: 제목 15/22 굵게, 내용과 8px 간격. 왼쪽 아이콘 색으로 블록을 구분한다. */
function DetailSection({ label, children }) {
  const { icon, tone } = SECTION_ICONS[label] ?? SECTION_ICONS['어떤 정책인가요'];

  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{
        p: { xs: 2, sm: 2.5 },
        border: 1,
        borderColor: 'divider',
        borderRadius: `${RADIUS.card}px`,
      }}
    >
      <Box
        aria-hidden="true"
        sx={{
          display: 'grid',
          placeItems: 'center',
          width: 40,
          height: 40,
          flexShrink: 0,
          borderRadius: '12px',
          bgcolor: tone.bg,
          color: tone.fg,
        }}
      >
        <AppIcon name={icon} size={20} />
      </Box>
      <Stack spacing={1} sx={{ minWidth: 0, pt: 0.75 }}>
        <Typography variant="subtitle1">{label}</Typography>
        {typeof children === 'string' ? (
          <Typography
            variant="body1"
            sx={{ fontSize: 15, lineHeight: 1.7, whiteSpace: 'pre-line', wordBreak: 'keep-all' }}
          >
            {children}
          </Typography>
        ) : (
          children
        )}
      </Stack>
    </Stack>
  );
}

function PolicyDetailPage() {
  const { policyId } = useParams();
  const { isAuthenticated } = useAuth();
  const { openLoginDialog } = useLoginDialog();
  const { showError } = useToast();
  const { policy, isLoading, errorMessage, refetch } = usePolicyDetail(policyId);
  const { isFavorite, toggleFavorite } = useFavoriteToggle();
  const terms = useTerms();
  const wasAuthenticatedRef = useRef(isAuthenticated);
  const [cardNewsPolicyId, setCardNewsPolicyId] = useState(null);
  // 다른 정책 상세로 옮겨 가면 열어 둔 카드뉴스는 닫힌 것으로 본다.
  const requestedCardNewsId = cardNewsPolicyId === policyId ? policyId : null;
  const cardNewsState = useCardNewsDetail(requestedCardNewsId);

  useEffect(() => {
    if (!wasAuthenticatedRef.current && isAuthenticated) {
      refetch();
    }

    wasAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated, refetch]);

  // 카드뉴스를 못 불러오면 팝업 대신 오류 토스트로 알린다.
  useEffect(() => {
    if (cardNewsState.errorMessage) {
      showError(cardNewsState.errorMessage);
    }
  }, [cardNewsState.errorMessage, showError]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (errorMessage) {
    return <ErrorState message={errorMessage} onRetry={refetch} />;
  }

  if (!policy) {
    return null;
  }

  const handleApplyClick = () => {
    if (!policy.applyUrl) {
      showError(TOAST_MESSAGES.APPLY_LINK_MISSING);
      return;
    }

    window.open(policy.applyUrl, '_blank', 'noopener');
  };

  const handleCardNewsClick = () => {
    if (requestedCardNewsId && cardNewsState.errorMessage) {
      cardNewsState.refetch();
      return;
    }

    setCardNewsPolicyId(policyId);
  };

  const saved = isFavorite(policy.id, policy.isFavorite);
  const subtypeTone = getSubtypeTone(policy.subtypeName);

  return (
    <Stack spacing={4}>
      <Stack
        component="header"
        spacing={1.5}
        sx={{
          position: 'relative',
          overflow: 'hidden',
          px: { xs: 2.5, sm: 4, md: 5 },
          py: { xs: 3, sm: 4 },
          borderRadius: { xs: '24px', sm: '28px' },
          background: GRADIENTS.hero,
          border: `1px solid ${COLORS.accentLine}`,
        }}
      >
        <Box
          aria-hidden="true"
          sx={{
            position: 'absolute',
            right: { xs: -30, sm: 32 },
            bottom: { xs: -30, sm: -24 },
            color: 'rgba(101, 88, 211, 0.1)',
          }}
        >
          <AppIcon name="home" size={180} />
        </Box>
        <Breadcrumbs
          separator={<AppIcon name="chevron-right" size={14} />}
          sx={{ position: 'relative' }}
        >
          <Link
            component={RouterLink}
            to={ROUTES.HOME}
            variant="caption"
            color="text.secondary"
            underline="hover"
          >
            주거 정책
          </Link>
          <Typography variant="caption" color="text.secondary">
            {policy.subtypeName}
          </Typography>
        </Breadcrumbs>

        <Stack
          direction="row"
          spacing={1.5}
          useFlexGap
          sx={{ alignItems: 'center', flexWrap: 'wrap' }}
        >
          <Chip
            label={policy.subtypeName}
            size="small"
            sx={{ fontWeight: 700, bgcolor: subtypeTone.bg, color: subtypeTone.fg }}
          />
          <Typography
            variant="h1"
            sx={{
              minWidth: 0,
              fontSize: { xs: 24, sm: 32 },
              lineHeight: 1.3,
              overflowWrap: 'anywhere',
              wordBreak: 'keep-all',
            }}
          >
            {policy.title}
          </Typography>
          <DdayBadge applyPeriodType={policy.applyPeriodType} applyEndDate={policy.applyEndDate} />
        </Stack>

        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          sx={{ position: 'relative', flexWrap: 'wrap', pt: 1 }}
        >
          <Button variant="contained" size="large" onClick={handleApplyClick}>
            신청하러 가기 <AppIcon name="arrow-up-right" size={16} />
          </Button>

          <Button
            variant="outlined"
            size="large"
            startIcon={<AppIcon name={saved ? 'heart' : 'heart-outline'} size={20} />}
            onClick={() => toggleFavorite(policy.id, saved)}
            sx={{ '& .MuiButton-startIcon': { color: saved ? 'favorite.main' : 'inherit' } }}
          >
            {saved ? '관심 해제' : '관심 저장'}
          </Button>

          <Button
            variant="outlined"
            size="large"
            loading={Boolean(requestedCardNewsId) && cardNewsState.isLoading}
            onClick={handleCardNewsClick}
          >
            카드뉴스로 보기
          </Button>
        </Stack>
      </Stack>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          minWidth: 0,
          [SIDE_BY_SIDE]: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
        }}
      >
        <Stack spacing={1.5} sx={{ flex: 1, minWidth: 0, width: '100%' }}>
          <DetailSection label="어떤 정책인가요">{policy.description}</DetailSection>
          <DetailSection label="지원 내용">{policy.benefit}</DetailSection>
          <DetailSection label="신청 기간">
            {formatDateRange(policy.applyStartDate, policy.applyEndDate)}
          </DetailSection>
          <DetailSection label="신청 방법">{policy.applyMethod}</DetailSection>
          {policy.extraQualification && (
            <DetailSection label="추가 자격">
              <TermText text={policy.extraQualification} terms={terms} />
              <Typography variant="caption" color="text.disabled">
                밑줄 친 단어에 마우스를 올리면 쉬운 설명이 나와요
              </Typography>
            </DetailSection>
          )}
        </Stack>

        {(!isAuthenticated || policy.judgements?.length > 0) && (
          <Box
            sx={{
              width: '100%',
              flexShrink: 0,
              // 넓은 화면에서는 본문을 내려도 조건 카드가 헤더 아래에 붙어 따라온다.
              [SIDE_BY_SIDE]: {
                width: `min(${DETAIL_ASIDE_WIDTH}px, 36vw)`,
                position: 'sticky',
                top: LAYOUT.headerHeight + 24,
              },
            }}
          >
            {isAuthenticated ? (
              <JudgementCard
                judgements={policy.judgements}
                summary={policy.judgementSummary}
                group={policy.judgementGroup}
              />
            ) : (
              <GuestConditionsCard onLogin={openLoginDialog} />
            )}
          </Box>
        )}
      </Box>

      <CardNewsDialog
        cardNews={cardNewsState.cardNews}
        onClose={() => setCardNewsPolicyId(null)}
        isFavorite={saved}
        onToggleFavorite={() => toggleFavorite(policy.id, saved)}
        isOpenedFromDetail
      />
    </Stack>
  );
}

export default PolicyDetailPage;
