import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

function LoadingSpinner({ label = '불러오는 중' }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
      <CircularProgress aria-label={label} size={28} />
    </Box>
  );
}

export default LoadingSpinner;
