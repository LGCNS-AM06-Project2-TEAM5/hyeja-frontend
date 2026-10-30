import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';

import ErrorState from '@/components/common/ErrorState';
import FieldError from '@/components/common/FieldError';
import PasswordField from '@/components/common/PasswordField';
import ListPagination from '@/components/common/ListPagination';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import PageHero from '@/components/common/PageHero';
import NotificationList from '@/components/notification/NotificationList';
import { TOAST_MESSAGES, VALIDATION_MESSAGES } from '@/constants/messages';
import { MY_PAGE_TABS, ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';
import { useMyConditions } from '@/hooks/useMyConditions';
import { useNotificationPage } from '@/hooks/useNotificationPage';
import { useNotifications } from '@/hooks/useNotifications';
import { useToast } from '@/hooks/useToast';
import ConditionEditor from '@/pages/onboarding/ConditionEditor';
import { COLORS, TONES } from '@/styles/theme';
import { getErrorMessage } from '@/utils/getErrorMessage';

/**
 * 설계서 S-08 내용 카드 폭. 제목·탭·내용을 이 폭 한 기둥으로 묶어 화면 가운데 둔다.
 * 넓은 화면에서 내용이 한쪽으로 쏠리지 않고, 탭을 옮겨도 폭이 같다.
 */
const MY_PAGE_WIDTH = 800;

/** 탭마다 머리 영역에 두는 그림 */
const TAB_ILLUSTRATION = {
  [MY_PAGE_TABS.CONDITION]: 'profile',
  [MY_PAGE_TABS.ACCOUNT]: 'profile',
  [MY_PAGE_TABS.NOTIFICATION]: 'notifications',
};

function ConditionTab() {
  const { conditions, isLoading, errorMessage, refetch } = useMyConditions();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (errorMessage) {
    return <ErrorState message={errorMessage} onRetry={refetch} />;
  }

  return <ConditionEditor initialConditions={conditions} submitLabel="저장" onSaved={refetch} />;
}

function AccountTab() {
  const { user, withdraw } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const closeConfirm = () => {
    setIsConfirmOpen(false);
    setPassword('');
    setPasswordError('');
  };

  // 백엔드는 본인 확인용 비밀번호가 맞을 때만 탈퇴한다. 틀리면 창을 닫지 않고 입력칸 아래에 알린다.
  const handleWithdraw = async (event) => {
    event.preventDefault();

    if (!password) {
      setPasswordError(VALIDATION_MESSAGES.REQUIRED_PASSWORD);
      return;
    }

    setIsWithdrawing(true);

    try {
      await withdraw(password);
      closeConfirm();
      showSuccess(TOAST_MESSAGES.ACCOUNT_DELETED);
      navigate(ROUTES.HOME, { replace: true });
    } catch (error) {
      if (error?.response?.data?.code === 'MEMBER_006') {
        setPasswordError(getErrorMessage(error));
      } else {
        closeConfirm();
        showError(getErrorMessage(error));
      }
    } finally {
      setIsWithdrawing(false);
    }
  };

  const rows = [
    { label: '이메일', value: user.email },
    { label: '닉네임', value: user.nickname },
    { label: '가입일', value: user.joinedAt },
  ];

  return (
    <Stack spacing={3}>
      <Card variant="outlined">
        <Stack divider={<Divider />}>
          {rows.map((row) => (
            <Stack
              key={row.label}
              direction={{ xs: 'column', sm: 'row' }}
              spacing={{ xs: 0.5, sm: 2 }}
              sx={{ px: 2, py: 1.5 }}
            >
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ width: { xs: 'auto', sm: 96 }, flexShrink: 0 }}
              >
                {row.label}
              </Typography>
              <Typography variant="body2" sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>
                {row.value}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Card>

      <Card
        variant="outlined"
        sx={{ p: 2.5, backgroundColor: TONES.rose.bg, borderColor: 'transparent' }}
      >
        <Stack spacing={1.5} sx={{ alignItems: 'flex-start' }}>
          <Typography variant="body2">회원 탈퇴</Typography>
          <Typography variant="body1" color="text.secondary">
            탈퇴하면 내 조건, 관심 정책, 알림이 모두 지워지고 되돌릴 수 없어요.
          </Typography>
          <Button
            variant="outlined"
            onClick={() => setIsConfirmOpen(true)}
            sx={{
              color: 'error.main',
              borderColor: 'error.main',
              '&:hover': { borderColor: 'error.main', backgroundColor: TONES.rose.bg },
            }}
          >
            회원 탈퇴
          </Button>
        </Stack>
      </Card>

      <Dialog
        open={isConfirmOpen}
        onClose={isWithdrawing ? undefined : closeConfirm}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { component: 'form', onSubmit: handleWithdraw, noValidate: true } }}
      >
        <DialogTitle sx={{ typography: 'h2' }}>정말 탈퇴하시겠어요?</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Typography variant="body1" color="text.secondary" sx={{ wordBreak: 'keep-all' }}>
              내 조건, 관심 정책, 알림이 모두 지워지고 되돌릴 수 없어요. 본인 확인을 위해 비밀번호를
              입력해 주세요.
            </Typography>
            <PasswordField
              label="비밀번호"
              autoComplete="current-password"
              autoFocus
              fullWidth
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setPasswordError('');
              }}
              error={Boolean(passwordError)}
              helperText={passwordError ? <FieldError>{passwordError}</FieldError> : ' '}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button variant="text" onClick={closeConfirm} disabled={isWithdrawing}>
            취소
          </Button>
          <Button type="submit" variant="contained" color="error" loading={isWithdrawing}>
            탈퇴할게요
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

function NotificationTab() {
  const [page, setPage] = useState(1);
  const recent = useNotifications();
  // 삭제로 마지막 페이지가 사라지면 남아 있는 마지막 페이지를 보여 준다.
  const currentPage = Math.min(page, Math.max(recent.totalPages, 1));
  const pageState = useNotificationPage(currentPage);
  const visible = currentPage === 1 ? recent : pageState;

  return (
    <Stack spacing={1.5}>
      {/* "모두 읽음"은 백엔드 일괄 읽음 API가 생기면 다시 둔다. */}
      <Typography variant="body1" color="text.secondary">
        [마감 7일 이하] 알림 / 안 읽음 ({recent.unreadCount})
      </Typography>

      <NotificationList
        notifications={visible.notifications}
        isLoading={visible.isLoading}
        errorMessage={visible.errorMessage}
        onRead={recent.markAsRead}
        onDelete={recent.removeNotification}
        onRetry={visible.refetch}
      />

      <ListPagination page={currentPage} totalPages={recent.totalPages} onPageChange={setPage} />
    </Stack>
  );
}

const TAB_CONTENT = {
  [MY_PAGE_TABS.CONDITION]: ConditionTab,
  [MY_PAGE_TABS.ACCOUNT]: AccountTab,
  [MY_PAGE_TABS.NOTIFICATION]: NotificationTab,
};

function MyPage() {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  // 모르는 탭 값이 와도 탭 표시와 내용이 어긋나지 않게 기본 탭으로 맞춘다.
  const currentTab = useMemo(
    () => (TAB_CONTENT[requestedTab] ? requestedTab : MY_PAGE_TABS.CONDITION),
    [requestedTab],
  );
  const TabContent = TAB_CONTENT[currentTab];

  const tabItems = [
    { value: MY_PAGE_TABS.CONDITION, label: '내 조건 수정' },
    { value: MY_PAGE_TABS.ACCOUNT, label: '계정' },
    {
      value: MY_PAGE_TABS.NOTIFICATION,
      label: unreadCount > 0 ? `알림 목록 ${unreadCount}` : '알림 목록',
    },
  ];

  return (
    <Stack spacing={3} sx={{ width: '100%', maxWidth: MY_PAGE_WIDTH, mx: 'auto' }}>
      <PageHero
        title="마이페이지"
        description={`${user.nickname} · ${user.email}`}
        illustration={TAB_ILLUSTRATION[currentTab]}
      />

      {/* 홈 분류 탭과 같은 알약 모양으로, 지금 탭은 진한 남보라로 채워 보여 준다. */}
      <Tabs
        value={currentTab}
        onChange={(event, value) => setSearchParams({ tab: value })}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{ minHeight: 40, '& .MuiTabs-indicator': { display: 'none' } }}
      >
        {tabItems.map((tab) => (
          <Tab
            key={tab.value}
            value={tab.value}
            label={tab.label}
            sx={{
              minHeight: 38,
              minWidth: 0,
              mr: 1,
              px: 2,
              borderRadius: 99,
              border: `1px solid ${COLORS.line}`,
              color: 'text.secondary',
              '&.Mui-selected': {
                color: 'common.white',
                bgcolor: COLORS.brandDeep,
                borderColor: COLORS.brandDeep,
              },
            }}
          />
        ))}
      </Tabs>

      <Card variant="outlined" sx={{ p: { xs: 2, sm: 3.5 } }}>
        <TabContent />
      </Card>
    </Stack>
  );
}

export default MyPage;
