import { Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';

import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';
import { LAYOUT } from '@/styles/theme';

function MainLayout() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />

      <Box
        component="main"
        sx={{
          width: '100%',
          maxWidth: LAYOUT.containerMaxWidth,
          minWidth: 0,
          mx: 'auto',
          px: LAYOUT.pageGutter,
          py: { xs: 3, sm: 4 },
        }}
      >
        <Outlet />
      </Box>

      <Footer />
    </Box>
  );
}

export default MainLayout;
