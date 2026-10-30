import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Link from '@mui/material/Link';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';

import Illustration from '@/components/common/Illustration';
import CardHeroSection from '@/components/policy/CardHeroSection';
import CardNewsDialog from '@/components/policy/CardNewsDialog';
import PolicyFilterTabs from '@/components/policy/PolicyFilterTabs';
import PolicyList from '@/components/policy/PolicyList';
import PolicySearchBar from '@/components/policy/PolicySearchBar';
import { ERROR_MESSAGES, LOGIN_NOTICE, VALIDATION_MESSAGES } from '@/constants/messages';
import { POLICY_PAGE_SIZE, POLICY_SORT_OPTIONS, POLICY_SUBTYPES } from '@/constants/policy';
import { buildMyPagePath, MY_PAGE_TABS, ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';
import { useCardNews, useCardNewsDetail, usePolicies } from '@/hooks/usePolicies';
import { useFavoriteToggle } from '@/hooks/useFavoriteToggle';
import { useLoginDialog } from '@/hooks/useLoginDialog';
import { useMyConditions } from '@/hooks/useMyConditions';
import { useToast } from '@/hooks/useToast';
import { COLORS, GRADIENTS } from '@/styles/theme';

function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { openLoginDialog, openLoginNotice } = useLoginDialog();
  const { showError } = useToast();
  const [keyword, setKeyword] = useState('');
  const [subtype, setSubtype] = useState(POLICY_SUBTYPES[0].value);
  const [sort, setSort] = useState(POLICY_SORT_OPTIONS[0].value);
  const [onlyMatched, setOnlyMatched] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedCardNewsId, setSelectedCardNewsId] = useState(null);
  const [searchError, setSearchError] = useState('');

  const cardNewsState = useCardNews();
  const cardNewsDetailState = useCardNewsDetail(selectedCardNewsId);
  const { policies, totalCount, totalPages, isLoading, errorMessage, refetch } = usePolicies({
    subtype,
    sort,
    onlyMatched,
    page,
    size: POLICY_PAGE_SIZE,
  });
  const { isFavorite, toggleFavorite } = useFavoriteToggle();
  const { conditions, summary: conditionSummary } = useMyConditions({
    redirectOnMissingProfile: false,
  });

  const selectedCardNews = cardNewsDetailState.cardNews;
  const listAreaRef = useRef(null);
  const listAreaMaxHeightRef = useRef(0);

  // 지금까지 가장 컸던 목록 높이를 최소 높이로 잡는다. 창 크기를 크게 바꾸면 여백이 남을 수 있다.
  useLayoutEffect(() => {
    const listArea = listAreaRef.current;

    if (!listArea) {
      return;
    }

    listArea.style.minHeight = '';
    listAreaMaxHeightRef.current = Math.max(listAreaMaxHeightRef.current, listArea.offsetHeight);
    listArea.style.minHeight = `${listAreaMaxHeightRef.current}px`;
  }, [policies, isLoading, errorMessage]);

  const isPolicyFavorite = (policyId) =>
    isFavorite(
      policyId,
      policies.find((policy) => String(policy.id) === String(policyId))?.isFavorite,
    );

  const isCardNewsFavorite = (policyId) => isFavorite(policyId, selectedCardNews?.isFavorite);

  // 설계서 S-01: 목록이나 카드뉴스를 못 불러오면 오류 toast로 알린다.
  useEffect(() => {
    if (errorMessage || cardNewsState.errorMessage) {
      showError(ERROR_MESSAGES.POLICY_LOAD_FAILED);
    }
  }, [errorMessage, cardNewsState.errorMessage, showError]);

  const handleSearch = (searchKeyword) => {
    if (!isAuthenticated) {
      openLoginNotice(LOGIN_NOTICE.SEARCH);
      return;
    }

    if (!searchKeyword.trim()) {
      setSearchError(VALIDATION_MESSAGES.REQUIRED_SEARCH_KEYWORD);
      return;
    }

    setSearchError('');
    navigate(`${ROUTES.SEARCH}?query=${encodeURIComponent(searchKeyword)}`);
  };

  /** 목록 조건이 바뀌면 항상 첫 페이지부터 다시 본다. */
  const changeListOption = (apply) => {
    apply();
    setPage(1);
  };

  return (
    <Stack spacing={{ xs: 4, sm: 5, md: 6 }}>
      <Box
        component="section"
        sx={{
          position: 'relative',
          overflow: 'hidden',
          mx: { xs: -0.5, sm: 0 },
          px: { xs: 2, sm: 4 },
          pt: { xs: 4, sm: 5.5 },
          pb: { xs: 3, sm: 4.5 },
          borderRadius: { xs: '24px', sm: '32px' },
          background: GRADIENTS.hero,
          border: `1px solid ${COLORS.accentLine}`,
        }}
      >
        <Box
          aria-hidden="true"
          sx={{
            position: 'absolute',
            top: -90,
            left: -70,
            width: 240,
            height: 240,
            borderRadius: '50%',
            bgcolor: 'rgba(111, 93, 230, 0.07)',
          }}
        />
        <Illustration
          name="home-hero"
          sx={{
            display: 'none',
            // 가운데 검색창과 겹치지 않을 만큼 넓을 때만 오른쪽에 그림을 둔다.
            '@media (min-width:1100px)': { display: 'block' },
            position: 'absolute',
            right: 12,
            bottom: 6,
            width: 220,
          }}
        />

        <Stack spacing={2} sx={{ position: 'relative', alignItems: 'center' }}>
          <Stack
            direction="row"
            spacing={0.75}
            sx={{
              alignItems: 'center',
              px: 1.4,
              py: 0.6,
              borderRadius: 99,
              bgcolor: 'rgba(255, 255, 255, 0.8)',
              border: `1px solid ${COLORS.accentLine}`,
              color: 'primary.main',
            }}
          >
            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'primary.main' }} />
            <Typography sx={{ fontSize: 12, fontWeight: 800 }}>
              필요한 것만 말하면 혜자가 찾아요
            </Typography>
          </Stack>

          <Typography
            variant="h1"
            aria-label="받을 수 있는 주거 혜택, 한 번에 찾아요"
            sx={{
              fontSize: { xs: 28, sm: 36, md: 40 },
              lineHeight: 1.22,
              letterSpacing: '-0.045em',
              textAlign: 'center',
              wordBreak: 'keep-all',
            }}
          >
            받을 수 있는 주거 혜택,{' '}
            <Box
              component="span"
              sx={{ display: { xs: 'block', sm: 'inline' }, color: 'primary.main' }}
            >
              한 번에 찾아요
            </Box>
          </Typography>

          <PolicySearchBar
            keyword={keyword}
            onKeywordChange={(value) => {
              setKeyword(value);
              if (searchError) {
                setSearchError('');
              }
            }}
            onSubmit={handleSearch}
            errorMessage={searchError}
            onRequestLogin={
              isAuthenticated ? undefined : () => openLoginNotice(LOGIN_NOTICE.SEARCH)
            }
          />

          {isAuthenticated ? (
            conditionSummary && (
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                {conditionSummary} 기준으로 찾아요{' '}
                <Link component={RouterLink} to={buildMyPagePath(MY_PAGE_TABS.CONDITION)}>
                  조건 수정
                </Link>
              </Typography>
            )
          ) : (
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
              로그인하면 내 조건으로 판정해드려요{' '}
              <Link component="button" type="button" onClick={() => openLoginDialog()}>
                로그인
              </Link>
            </Typography>
          )}
        </Stack>
      </Box>

      <Box component="section">
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          sx={{ alignItems: { xs: 'flex-start', sm: 'baseline' }, mb: 2 }}
        >
          <Typography variant="h2">혜자가 추천해요</Typography>
          <Typography variant="caption" color="text.secondary">
            마감이 가깝고 많이 본 정책이에요 · 누르면 카드뉴스 4장을 한 번에 보여드려요
          </Typography>
        </Stack>

        <CardHeroSection
          cardNewsList={cardNewsState.cardNewsList}
          isLoading={cardNewsState.isLoading}
          errorMessage={cardNewsState.errorMessage}
          onSelect={(cardNews) => setSelectedCardNewsId(cardNews.policyId)}
          isPaused={selectedCardNewsId !== null}
        />
      </Box>

      <Box component="section">
        <Typography variant="h2" sx={{ mb: 2 }}>
          주거 정책
        </Typography>

        <PolicyFilterTabs
          subtype={subtype}
          onSubtypeChange={(nextSubtype) => changeListOption(() => setSubtype(nextSubtype))}
        />

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          sx={{
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            py: 2,
          }}
        >
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            <Select
              value={sort}
              size="small"
              onChange={(event) => changeListOption(() => setSort(event.target.value))}
              aria-label="정렬 기준"
              // 설계서 Select/Sort: 140 × 32 고정이라 고른 옵션에 따라 상자 크기가 달라지지 않는다.
              sx={{
                width: 140,
                height: 32,
                typography: 'body2',
                '& .MuiSelect-select': { pl: '12px' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'grey.500' },
              }}
            >
              {POLICY_SORT_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>

            {!isLoading && !errorMessage && (
              <Typography variant="body1" color="text.secondary">
                신청 중 {totalCount}건
              </Typography>
            )}
          </Stack>

          {isAuthenticated && (
            <FormControlLabel
              control={
                <Switch
                  checked={onlyMatched}
                  onChange={(event) => changeListOption(() => setOnlyMatched(event.target.checked))}
                />
              }
              label={<Typography variant="body1">나에게 맞는 것만</Typography>}
              labelPlacement="start"
            />
          )}
        </Stack>

        {/* 분류·페이지를 바꿔 목록이 짧아져도 문서 높이가 줄지 않게 해, 보던 위치가 위로 튀지 않는다. */}
        <Box ref={listAreaRef}>
          <PolicyList
            policies={policies}
            isLoading={isLoading}
            errorMessage={errorMessage}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            isFavorite={isPolicyFavorite}
            onToggleFavorite={(policyId) => toggleFavorite(policyId, isPolicyFavorite(policyId))}
            onRetry={refetch}
            memberRegionCode={conditions?.regionCode || null}
          />
        </Box>
      </Box>

      <CardNewsDialog
        cardNews={selectedCardNews}
        onClose={() => setSelectedCardNewsId(null)}
        isFavorite={selectedCardNews ? isCardNewsFavorite(selectedCardNews.policyId) : false}
        onToggleFavorite={(policyId) => toggleFavorite(policyId, isCardNewsFavorite(policyId))}
      />
    </Stack>
  );
}

export default HomePage;
