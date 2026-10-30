import { useEffect, useRef, useState } from 'react';
import { Link as RouterLink, useLocation, useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import Illustration from '@/components/common/Illustration';
import JudgeIcon from '@/components/common/JudgeIcon';
import PolicySearchBar from '@/components/policy/PolicySearchBar';
import SearchCriteriaSummary from '@/components/search/SearchCriteriaSummary';
import SearchResultGroup from '@/components/search/SearchResultGroup';
import SearchResultSkeleton from '@/components/search/SearchResultSkeleton';
import { EMPTY_MESSAGES, LOGIN_NOTICE, TOAST_MESSAGES } from '@/constants/messages';
import {
  JUDGE_RESULT_BY_GROUP,
  POLICY_SEARCH_HASHTAGS,
  RECOMMENDATION_GROUP,
  RECOMMENDATION_GROUP_LABEL,
} from '@/constants/policy';
import { buildMyPagePath, MY_PAGE_TABS } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';
import { useFavoriteToggle } from '@/hooks/useFavoriteToggle';
import { useLoginDialog } from '@/hooks/useLoginDialog';
import { useMyConditions } from '@/hooks/useMyConditions';
import { usePolicySearch } from '@/hooks/usePolicySearch';
import { useToast } from '@/hooks/useToast';
import { COLORS, GRADIENTS, JUDGE_TONE } from '@/styles/theme';
import { withDirectionParticle } from '@/utils/koreanParticle';

const GROUP_ORDER = [
  RECOMMENDATION_GROUP.POSSIBLE,
  RECOMMENDATION_GROUP.NEED_CHECK,
  RECOMMENDATION_GROUP.IMPOSSIBLE,
];

/**
 * 백엔드는 "#월세"처럼 해시태그 그대로인 검색어만 AI 없이 그 유형으로 찾는다.
 * 이때만 검색 유형을 확실히 알 수 있다. 자유 문장은 AI가 고른 유형을 응답에 주지 않는다.
 */
const findSearchedHashtag = (query) =>
  POLICY_SEARCH_HASHTAGS.find((hashtag) => query.trim() === `#${hashtag}`);

function PolicySearchPage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('query') ?? '';
  const { isAuthenticated } = useAuth();
  const { openLoginNotice } = useLoginDialog();
  const { showInfo, showSuccess } = useToast();
  const [searchKeyword, setSearchKeyword] = useState(searchQuery);
  const [syncedQuery, setSyncedQuery] = useState(searchQuery);
  const searchInputRef = useRef(null);
  const {
    groups,
    groupCounts,
    totalCount,
    isIdle,
    isLoading,
    errorMessage,
    isNotHousing,
    refetch,
  } = usePolicySearch({ query: searchQuery }, { historyKey: location.key });
  const { isFavorite, toggleFavorite } = useFavoriteToggle();
  // 검색 API는 서버에 저장된 내 조건으로 판정한다. 요약·칩·조건 수정 기본값 모두 이 한 곳을 본다.
  const { conditions, appliedConditions } = useMyConditions({ redirectOnMissingProfile: false });

  // 뒤로·앞으로 가기로 주소의 검색어가 바뀌면 검색창도 그 검색어로 맞춘다.
  if (syncedQuery !== searchQuery) {
    setSyncedQuery(searchQuery);
    setSearchKeyword(searchQuery);
  }

  const isSearchedPolicyFavorite = (policyId) =>
    isFavorite(
      policyId,
      GROUP_ORDER.flatMap((group) => groups[group]).find(
        (policy) => String(policy.id) === String(policyId),
      )?.isFavorite,
    );

  // 설계서 S-05: 후보가 없으면 안내 toast를 함께 띄운다.
  useEffect(() => {
    if (!isIdle && !isLoading && !errorMessage && totalCount === 0) {
      showInfo(TOAST_MESSAGES.NO_CANDIDATE);
    }
  }, [isIdle, isLoading, errorMessage, totalCount, showInfo]);

  const handleSearch = (nextKeyword) => {
    const nextQuery = nextKeyword.trim();

    if (!nextQuery) {
      return;
    }

    // 같은 검색어는 URL이 그대로라 요청이 나가지 않는다. 실패했던 검색만 다시 요청한다.
    // 주거 검색이 아니라고 거절된 검색어는 다시 물어도 같으므로 요청하지 않는다.
    if (nextQuery === searchQuery) {
      if (isNotHousing) {
        showInfo(EMPTY_MESSAGES.SEARCH_NOT_HOUSING_DESCRIPTION);
      } else if (errorMessage) {
        refetch();
      } else {
        showSuccess(`${withDirectionParticle(nextQuery)} ${TOAST_MESSAGES.SEARCHED}`);
      }
      return;
    }

    setSearchParams({ query: nextQuery });
  };

  const focusSearchInput = () => {
    searchInputRef.current?.focus();
    searchInputRef.current?.select();
  };

  const searchedHashtag = findSearchedHashtag(searchQuery);
  const hasResult = !isIdle && !isLoading && !errorMessage;
  const canEditConditions = Boolean(conditions);

  return (
    <Stack spacing={4.5}>
      <Box
        component="section"
        sx={{
          position: 'relative',
          overflow: 'hidden',
          px: { xs: 2, sm: 4 },
          py: { xs: 2.5, sm: 3.5 },
          borderRadius: { xs: '24px', sm: '28px' },
          background: GRADIENTS.hero,
          border: `1px solid ${COLORS.accentLine}`,
        }}
      >
        <Illustration
          name="search"
          sx={{
            display: 'none',
            '@media (min-width:1100px)': { display: 'block' },
            position: 'absolute',
            right: 24,
            bottom: 8,
            width: 190,
          }}
        />
        <Stack
          spacing={1.5}
          sx={{
            position: 'relative',
            '@media (min-width:1100px)': { maxWidth: 'calc(100% - 220px)' },
          }}
        >
          <PolicySearchBar
            keyword={searchKeyword}
            onKeywordChange={setSearchKeyword}
            onSubmit={handleSearch}
            onRequestLogin={
              isAuthenticated ? undefined : () => openLoginNotice(LOGIN_NOTICE.SEARCH)
            }
            isResultPage
            inputRef={searchInputRef}
          />

          {!isIdle && !errorMessage && (
            <SearchCriteriaSummary
              typeLabel={searchedHashtag ? `‘${searchedHashtag}’ 유형으로 찾았어요` : ''}
              conditions={appliedConditions}
              action={
                canEditConditions && (
                  <Link
                    component={RouterLink}
                    to={buildMyPagePath(MY_PAGE_TABS.CONDITION)}
                    variant="body2"
                    color="text.primary"
                    underline="always"
                  >
                    조건 수정
                  </Link>
                )
              }
            />
          )}

          {hasResult && totalCount > 0 && (
            <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', gap: 1, pt: 0.5 }}>
              {GROUP_ORDER.map((group) => {
                const judgeResult = JUDGE_RESULT_BY_GROUP[group];

                // 누르면 그 그룹 결과로 바로 내려간다.
                return (
                  <Stack
                    key={group}
                    component="a"
                    href={`#result-group-${group}`}
                    direction="row"
                    spacing={0.75}
                    sx={{
                      alignItems: 'center',
                      pl: 0.75,
                      pr: 1.5,
                      py: 0.6,
                      borderRadius: 99,
                      bgcolor: 'common.white',
                      border: `1px solid ${COLORS.line}`,
                      color: 'text.primary',
                      textDecoration: 'none',
                      transition: 'border-color 150ms ease',
                      '&:hover': { borderColor: JUDGE_TONE[judgeResult].fg },
                    }}
                  >
                    <JudgeIcon result={judgeResult} size={20} />
                    <Typography variant="body2">{RECOMMENDATION_GROUP_LABEL[group]}</Typography>
                    <Typography
                      variant="body1"
                      sx={{ fontWeight: 800, color: JUDGE_TONE[judgeResult].fg }}
                    >
                      {groupCounts[group] ?? 0}건
                    </Typography>
                  </Stack>
                );
              })}
            </Stack>
          )}
        </Stack>
      </Box>

      {/* 설계서 S-05 로딩: AI 응답을 기다리는 동안 결과와 같은 뼈대를 보여 준다. */}
      {isLoading && <SearchResultSkeleton />}

      {/* 주거와 관계없는 검색어는 오류가 아니라 검색어를 바꾸면 되는 경우라, 다시 시도 대신 검색어 수정을 권한다. */}
      {!isLoading && isNotHousing && (
        <EmptyState
          isFramed
          illustration="empty"
          title={EMPTY_MESSAGES.SEARCH_NOT_HOUSING}
          description={EMPTY_MESSAGES.SEARCH_NOT_HOUSING_DESCRIPTION}
          action={
            <Button variant="outlined" onClick={focusSearchInput}>
              검색어 수정
            </Button>
          }
        />
      )}

      {!isLoading && errorMessage && !isNotHousing && (
        <ErrorState message={errorMessage} onRetry={refetch} />
      )}

      {isIdle && !isAuthenticated && (
        <Typography variant="body1" color="text.secondary">
          로그인하면 내 조건으로 판정해드려요
        </Typography>
      )}

      {hasResult && totalCount === 0 && (
        <EmptyState
          isFramed
          illustration="search"
          title={EMPTY_MESSAGES.SEARCH}
          description={EMPTY_MESSAGES.SEARCH_DESCRIPTION}
          action={
            <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
              {appliedConditions.length > 0 && (
                <Stack
                  direction="row"
                  spacing={0.5}
                  useFlexGap
                  aria-label="적용된 내 조건"
                  sx={{ justifyContent: 'center', flexWrap: 'wrap' }}
                >
                  {appliedConditions.map((condition) => (
                    <Chip key={condition} label={condition} variant="outlined" size="small" />
                  ))}
                </Stack>
              )}

              <Button
                component={RouterLink}
                to={buildMyPagePath(MY_PAGE_TABS.CONDITION)}
                variant="outlined"
                disabled={!canEditConditions}
              >
                내 조건 수정
              </Button>
              <Typography variant="caption" color="text.secondary">
                수정한 조건은 내 정보에도 반영돼요.
              </Typography>
            </Stack>
          }
        />
      )}

      {hasResult &&
        totalCount > 0 &&
        GROUP_ORDER.map((group) => (
          <SearchResultGroup
            key={group}
            group={group}
            policies={groups[group]}
            isFavorite={isSearchedPolicyFavorite}
            onToggleFavorite={(policyId) =>
              toggleFavorite(policyId, isSearchedPolicyFavorite(policyId))
            }
          />
        ))}
    </Stack>
  );
}

export default PolicySearchPage;
