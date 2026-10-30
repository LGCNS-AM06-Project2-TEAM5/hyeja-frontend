import { useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import AppIcon from '@/components/common/AppIcon';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Badge from '@mui/material/Badge';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';

import NotificationPopover from '@/components/notification/NotificationPopover';
import { TOAST_MESSAGES } from '@/constants/messages';
import { MY_PAGE_TABS, ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';
import { useLoginDialog } from '@/hooks/useLoginDialog';
import { useNotifications } from '@/hooks/useNotifications';
import { useToast } from '@/hooks/useToast';
import { COLORS, LAYOUT } from '@/styles/theme';

// 검색 결과와 정책 상세도 "주거 정책" 안의 화면이라 같은 메뉴를 켜 둔다.
const POLICY_PATHS = [ROUTES.HOME, ROUTES.SEARCH, '/policies/'];

function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const { openLoginDialog } = useLoginDialog();
  const { showSuccess } = useToast();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { unreadNotifications, unreadCount, isLoading, errorMessage, markAsRead } =
    useNotifications();
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const [accountAnchorEl, setAccountAnchorEl] = useState(null);

  const navItems = isAuthenticated
    ? [
        { label: '주거 정책', to: ROUTES.HOME, paths: POLICY_PATHS },
        { label: '관심 정책', to: ROUTES.FAVORITE, paths: [ROUTES.FAVORITE] },
      ]
    : [{ label: '주거 정책', to: ROUTES.HOME, paths: POLICY_PATHS }];

  const handleLogout = async () => {
    setAccountAnchorEl(null);
    await logout();
    showSuccess(TOAST_MESSAGES.LOGOUT_DONE);
    navigate(ROUTES.HOME);
  };

  const goToMyPage = (tab) => {
    setAccountAnchorEl(null);
    navigate(`${ROUTES.MY_PAGE}?tab=${tab}`);
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      color="inherit"
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'rgba(255, 255, 255, 0.86)',
        backdropFilter: 'saturate(180%) blur(14px)',
      }}
    >
      <Toolbar
        sx={{
          width: '100%',
          maxWidth: LAYOUT.containerMaxWidth,
          mx: 'auto',
          px: LAYOUT.pageGutter,
          minHeight: `${LAYOUT.headerHeight}px !important`,
          gap: { xs: 0.5, sm: 2, md: 3 },
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
          py: { xs: 0.5, sm: 0 },
        }}
      >
        <Box
          component={RouterLink}
          to={ROUTES.LANDING}
          aria-label="혜자 홈"
          sx={{ display: 'flex', flexShrink: 0 }}
        >
          <Box
            component="img"
            src={`${import.meta.env.BASE_URL}icons/hyeja_for_logo_main.svg`}
            alt="혜자"
            sx={{ display: 'block', width: 'auto', height: { xs: 32, sm: 40 } }}
          />
        </Box>

        <Stack
          direction="row"
          spacing={{ xs: 0, sm: 1, md: 2 }}
          sx={{ flexShrink: 0, order: { xs: 3, sm: 0 }, width: { xs: '100%', sm: 'auto' } }}
        >
          {navItems.map((item) => {
            const isActive = item.paths.some((path) => pathname.startsWith(path));

            return (
              <Button
                key={item.to}
                component={RouterLink}
                to={item.to}
                aria-current={isActive ? 'page' : undefined}
                variant="text"
                size="small"
                sx={{
                  borderRadius: 99,
                  px: 1.75,
                  color: 'text.secondary',
                  ...(isActive && {
                    color: 'primary.main',
                    backgroundColor: COLORS.accentSoft,
                    '&:hover': { backgroundColor: COLORS.accentSoft },
                  }),
                }}
              >
                {item.label}
              </Button>
            );
          })}
        </Stack>

        <Box sx={{ flexGrow: 1 }} />

        <Stack
          direction="row"
          spacing={{ xs: 0, sm: 1 }}
          sx={{ alignItems: 'center', flexShrink: 0 }}
        >
          {isAuthenticated ? (
            <>
              <IconButton
                aria-label="알림 열기"
                onClick={(event) => setNotificationAnchorEl(event.currentTarget)}
              >
                <Badge badgeContent={unreadCount} color="primary">
                  <AppIcon name="bell-outline" size={24} />
                </Badge>
              </IconButton>

              <Button
                variant="text"
                onClick={(event) => setAccountAnchorEl(event.currentTarget)}
                endIcon={<AppIcon name="chevron-down" size={20} />}
                sx={{
                  color: 'text.primary',
                  maxWidth: { xs: 116, sm: 180 },
                  minWidth: 0,
                  '& .MuiButton-startIcon, & .MuiButton-endIcon': { flexShrink: 0 },
                  '& .MuiButton-endIcon + *': { minWidth: 0 },
                  '& .MuiButton-label': {
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  },
                }}
              >
                <Box
                  component="span"
                  sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {user.nickname}
                </Box>
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="text"
                onClick={() => openLoginDialog()}
                sx={{ color: 'text.secondary' }}
              >
                로그인
              </Button>
              <Button
                component={RouterLink}
                to={ROUTES.SIGNUP}
                variant="contained"
                size="small"
                sx={{ borderRadius: 99, px: 2 }}
              >
                회원가입
              </Button>
            </>
          )}
        </Stack>
      </Toolbar>

      <NotificationPopover
        anchorEl={notificationAnchorEl}
        onClose={() => setNotificationAnchorEl(null)}
        notifications={unreadNotifications}
        isLoading={isLoading}
        errorMessage={errorMessage}
        unreadCount={unreadCount}
        onRead={markAsRead}
      />

      <Menu
        anchorEl={accountAnchorEl}
        open={Boolean(accountAnchorEl)}
        onClose={() => setAccountAnchorEl(null)}
      >
        <MenuItem onClick={() => goToMyPage(MY_PAGE_TABS.CONDITION)}>마이페이지</MenuItem>
        <MenuItem onClick={handleLogout}>로그아웃</MenuItem>
      </Menu>
    </AppBar>
  );
}

export default Header;
