import { useCallback, useEffect } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import AppIcon from '@/components/common/AppIcon';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import ListPagination from '@/components/common/ListPagination';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import PageHero from '@/components/common/PageHero';
import FavoriteRow from '@/components/policy/FavoriteRow';
import PolicySearchField from '@/components/policy/PolicySearchField';
import { EMPTY_MESSAGES } from '@/constants/messages';
import { POLICY_PAGE_SIZE } from '@/constants/policy';
import { ROUTES } from '@/constants/routes';
import { useFavoriteToggle } from '@/hooks/useFavoriteToggle';
import { useFavorites } from '@/hooks/useFavorites';
import { RADIUS } from '@/styles/theme';

function FavoritePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get('keyword')?.trim() ?? '';
  const requestedPage = Number(searchParams.get('page'));
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const { favorites, totalCount, totalPages, isLoading, errorMessage, reload, refetch } =
    useFavorites({ keyword, page, size: POLICY_PAGE_SIZE });
  const { toggleFavorite } = useFavoriteToggle();

  const updateSearchParams = useCallback(
    ({ keyword: nextKeyword = keyword, page: nextPage = page }, options) => {
      const nextParams = new URLSearchParams();

      if (nextKeyword) {
        nextParams.set('keyword', nextKeyword);
      }

      if (nextPage > 1) {
        nextParams.set('page', String(nextPage));
      }

      setSearchParams(nextParams, options);
    },
    [keyword, page, setSearchParams],
  );

  useEffect(() => {
    if (isLoading || errorMessage) {
      return;
    }

    const lastPage = Math.max(totalPages, 1);
    const normalizedPage = Math.min(page, lastPage);
    const hasInvalidPage = searchParams.has('page') && requestedPage !== page;

    if (hasInvalidPage || normalizedPage !== page) {
      updateSearchParams({ page: normalizedPage }, { replace: true });
    }
  }, [errorMessage, isLoading, page, requestedPage, searchParams, totalPages, updateSearchParams]);

  const handleSearch = (nextKeyword) => {
    updateSearchParams({ keyword: nextKeyword, page: 1 });
  };

  const handleRemove = async (policyId) => {
    await toggleFavorite(policyId, true);
    reload();
  };

  return (
    <Stack spacing={3}>
      <PageHero
        title="관심 정책"
        illustration="favorites"
        description={
          <>
            <AppIcon name="heart-outline" size={14} /> 저장한 정책을 모아 두는 곳이에요.
          </>
        }
      >
        <PolicySearchField
          key={keyword}
          placeholder="관심 정책 검색"
          initialKeyword={keyword}
          onSearch={handleSearch}
        />
      </PageHero>

      {isLoading && <LoadingSpinner />}

      {!isLoading && errorMessage && <ErrorState message={errorMessage} onRetry={refetch} />}

      {!isLoading && !errorMessage && favorites.length === 0 && keyword && (
        <EmptyState
          isFramed
          illustration="empty"
          title={EMPTY_MESSAGES.FAVORITE_SEARCH}
          description={EMPTY_MESSAGES.FAVORITE_SEARCH_DESCRIPTION}
        />
      )}

      {!isLoading && !errorMessage && favorites.length === 0 && !keyword && (
        <EmptyState
          isFramed
          illustration="favorites"
          title={EMPTY_MESSAGES.FAVORITE}
          description={
            <>
              정책 옆{' '}
              <Box component="span" role="img" aria-label="하트" sx={{ color: 'text.primary' }}>
                <AppIcon name="heart-outline" size={14} />
              </Box>
              를 누르면 여기 모이고, 마감 7일 전에 알려드려요
            </>
          }
          action={
            <Button component={RouterLink} to={ROUTES.HOME} variant="outlined" size="small">
              주거 정책 보러 가기
            </Button>
          }
        />
      )}

      {!isLoading && !errorMessage && favorites.length > 0 && (
        <Box>
          <Stack
            direction="row"
            spacing={1}
            sx={{ justifyContent: 'space-between', alignItems: 'baseline', pb: 1.5 }}
          >
            <Typography variant="body2">
              {keyword ? `'${keyword}' 검색 결과 ${totalCount}건` : `${totalCount}건`}
            </Typography>
            <Typography variant="caption" color="text.disabled">
              최근 저장순
            </Typography>
          </Stack>

          <Box
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: `${RADIUS.card}px`,
              overflow: 'hidden',
            }}
          >
            {favorites.map((favorite) => (
              <FavoriteRow key={favorite.policyId} favorite={favorite} onRemove={handleRemove} />
            ))}
          </Box>

          <ListPagination
            page={page}
            totalPages={totalPages}
            onPageChange={(nextPage) => updateSearchParams({ page: nextPage })}
          />
        </Box>
      )}
    </Stack>
  );
}

export default FavoritePage;
