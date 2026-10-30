import { useState } from 'react';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import * as adminApi from '@/api/adminApi';
import AppIcon from '@/components/common/AppIcon';
import { TOAST_MESSAGES } from '@/constants/messages';
import { useToast } from '@/hooks/useToast';
import { getErrorMessage } from '@/utils/getErrorMessage';

const toCompletedRows = (message) => [
  { label: '상태', value: '완료' },
  { label: '결과', value: message },
];

const toStoppedRows = ({ message, stoppedPage, savedCount }) => [
  { label: '상태', value: '중단' },
  { label: '멈춘 곳', value: stoppedPage == null ? '-' : `${stoppedPage}페이지` },
  {
    label: '저장',
    value: savedCount == null ? '-' : `${savedCount}건 (멈추기 전까지 저장한 정책은 남아 있어요)`,
  },
  { label: '사유', value: message },
];

function AdminPage() {
  const { showSuccess, showError, showInfo } = useToast();
  const [resultRows, setResultRows] = useState([]);
  const [isCollecting, setIsCollecting] = useState(false);

  const handleCollect = async () => {
    setIsCollecting(true);
    showInfo(TOAST_MESSAGES.ADMIN_COLLECT_STARTED);

    try {
      const message = await adminApi.syncPolicies();
      setResultRows(toCompletedRows(message));
      showSuccess(TOAST_MESSAGES.ADMIN_COLLECT_DONE);
    } catch (error) {
      const stop = adminApi.toPolicySyncStop(error);

      if (stop) {
        setResultRows(toStoppedRows(stop));
        showError(TOAST_MESSAGES.ADMIN_COLLECT_STOPPED);
      } else {
        showError(getErrorMessage(error));
      }
    } finally {
      setIsCollecting(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="h1">관리 · 정책 수집</Typography>
        <Typography variant="body1" color="text.secondary">
          온통청년에서 주거 정책을 바로 가져와요. 정책마다 AI 분석을 거쳐 몇 분 걸릴 수 있어요.
          (role = ADMIN만 접근)
        </Typography>
      </Stack>

      <Card variant="outlined" sx={{ p: 2 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ alignItems: { xs: 'flex-start', sm: 'center' } }}
        >
          <Button
            variant="contained"
            onClick={handleCollect}
            disabled={isCollecting}
            sx={{ flexShrink: 0 }}
          >
            {isCollecting ? '수집하는 중…' : '지금 수집 실행'}
          </Button>
          <Typography variant="body1" color="text.secondary">
            온통청년 API <AppIcon name="arrow-right" size={14} /> 주거 정책 저장{' '}
            <AppIcon name="arrow-right" size={14} /> 하위 유형 분류{' '}
            <AppIcon name="arrow-right" size={14} /> 카드뉴스 생성
          </Typography>
        </Stack>
      </Card>

      {resultRows.length > 0 && (
        <Card variant="outlined" sx={{ backgroundColor: 'grey.100' }}>
          <Typography variant="body2" sx={{ px: 2, py: 1.5 }}>
            마지막 수집 결과
          </Typography>
          <Stack divider={<Divider />}>
            {resultRows.map((row) => (
              <Stack
                key={row.label}
                direction={{ xs: 'column', sm: 'row' }}
                spacing={{ xs: 0.5, sm: 2 }}
                sx={{ px: 2, py: 1.5 }}
              >
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ width: { xs: 'auto', sm: 64 }, flexShrink: 0 }}
                >
                  {row.label}
                </Typography>
                <Typography variant="body1" sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>
                  {row.value}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Card>
      )}
    </Stack>
  );
}

export default AdminPage;
