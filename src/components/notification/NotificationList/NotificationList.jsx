import Stack from '@mui/material/Stack';

import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import NotificationItem from '@/components/notification/NotificationItem';
import { EMPTY_MESSAGES } from '@/constants/messages';

function NotificationList({
  notifications,
  isLoading = false,
  errorMessage = '',
  emptyMessage = EMPTY_MESSAGES.NOTIFICATION,
  onRead,
  onDelete,
  onRetry,
  onSelect,
}) {
  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (errorMessage) {
    return <ErrorState message={errorMessage} onRetry={onRetry} />;
  }

  if (notifications.length === 0) {
    return <EmptyState title={emptyMessage} />;
  }

  return (
    <Stack spacing={1}>
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRead={onRead}
          onDelete={onDelete}
          onSelect={onSelect}
        />
      ))}
    </Stack>
  );
}

export default NotificationList;
