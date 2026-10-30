import Box from '@mui/material/Box';

import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import ListPagination from '@/components/common/ListPagination';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import PolicyRow from '@/components/policy/PolicyRow';
import { EMPTY_MESSAGES } from '@/constants/messages';
import { RADIUS } from '@/styles/theme';

function PolicyList({
  policies,
  isLoading = false,
  errorMessage = '',
  emptyMessage = EMPTY_MESSAGES.POLICY_LIST,
  page = 1,
  totalPages = 0,
  onPageChange,
  isFavorite,
  onToggleFavorite,
  onRetry,
  memberRegionCode = null,
}) {
  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (errorMessage) {
    return <ErrorState message={errorMessage} onRetry={onRetry} />;
  }

  if (policies.length === 0) {
    return <EmptyState title={emptyMessage} />;
  }

  return (
    <Box>
      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: `${RADIUS.card}px`,
          overflow: 'hidden',
          bgcolor: 'background.paper',
        }}
      >
        {policies.map((policy) => (
          <PolicyRow
            key={policy.id}
            policy={policy}
            isFavorite={isFavorite?.(policy.id) ?? false}
            onToggleFavorite={onToggleFavorite}
            memberRegionCode={memberRegionCode}
          />
        ))}
      </Box>

      {onPageChange && (
        <ListPagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
      )}
    </Box>
  );
}

export default PolicyList;
