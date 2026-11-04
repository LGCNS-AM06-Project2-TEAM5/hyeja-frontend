import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import AppIcon from '@/components/common/AppIcon';

const PIPELINE = ['정책 저장', 'policy_outbox', 'Kafka policy-updated', 'engagement 스냅샷'];

const timeFormatter = new Intl.DateTimeFormat('ko-KR', {
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

const formatTime = (value) => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? '-' : timeFormatter.format(date);
};

/**
 * 정책이 바뀔 때 나가는 policy-updated 이벤트가 Kafka로 잘 나가고 있는지 보여 준다.
 * 조회는 관리자 화면(AdminPage)이 한 번만 하고 요약 칸과 이 카드가 같은 값을 나눠 쓴다.
 * status: undefined는 불러오는 중, null은 실패(errorMessage), 객체는 GET /api/policies/admin/events 결과다.
 */
function PolicyEventStatusCard({ status, errorMessage, isLoading, onReload }) {
  return (
    <Card variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between' }}
        >
          <Stack spacing={0.5}>
            <Typography variant="subtitle1">이벤트 동기화</Typography>
            <Typography variant="body1" color="text.secondary">
              {PIPELINE.map((step, index) => (
                <span key={step}>
                  {index > 0 && (
                    <>
                      {' '}
                      <AppIcon name="arrow-right" size={14} />{' '}
                    </>
                  )}
                  {step}
                </span>
              ))}
            </Typography>
          </Stack>
          <Button variant="outlined" onClick={onReload} disabled={isLoading} sx={{ flexShrink: 0 }}>
            새로고침
          </Button>
        </Stack>

        {status === null && (
          <Typography variant="body1" color="error.main">
            {errorMessage}
          </Typography>
        )}

        {status && (
          <>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.5, sm: 3 }}>
              <Typography variant="body1">{`보내기 대기 ${status.pendingCount}건`}</Typography>
              <Typography variant="body1">{`보낸 이벤트 ${status.publishedCount}건`}</Typography>
              <Typography variant="body1" color="text.secondary">
                {`마지막 전송 ${formatTime(status.lastPublishedAt)}`}
              </Typography>
            </Stack>

            <Card variant="outlined" sx={{ backgroundColor: 'grey.100' }}>
              <Typography variant="body2" sx={{ px: 2, py: 1.5 }}>
                최근 이벤트
              </Typography>
              {status.recentEvents.length === 0 ? (
                <Typography variant="body1" color="text.secondary" sx={{ px: 2, pb: 1.5 }}>
                  아직 보낸 이벤트가 없어요
                </Typography>
              ) : (
                <Stack divider={<Divider />}>
                  {status.recentEvents.map((event) => (
                    <Stack
                      key={event.eventId}
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={{ xs: 0.5, sm: 2 }}
                      sx={{ px: 2, py: 1.5 }}
                    >
                      <Typography
                        variant="body1"
                        color={event.publishedAt ? 'text.secondary' : 'warning.main'}
                        sx={{ width: { xs: 'auto', sm: 40 }, flexShrink: 0 }}
                      >
                        {event.publishedAt ? '보냄' : '대기'}
                      </Typography>
                      <Typography variant="body1" sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>
                        {event.policyId}
                      </Typography>
                      <Typography
                        variant="body1"
                        color="text.secondary"
                        sx={{ ml: { sm: 'auto' } }}
                      >
                        {formatTime(event.publishedAt ?? event.createdAt)}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              )}
            </Card>
          </>
        )}
      </Stack>
    </Card>
  );
}

export default PolicyEventStatusCard;
