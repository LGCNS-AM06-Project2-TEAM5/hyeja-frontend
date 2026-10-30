import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

function ErrorState({ message, onRetry }) {
  return (
    <Box role="alert" sx={{ textAlign: 'center', py: 5, px: 2 }}>
      <Typography variant="body1" color="error.main">
        {message}
      </Typography>
      {onRetry && (
        <Button variant="outlined" size="small" onClick={onRetry} sx={{ mt: 1.5 }}>
          다시 시도
        </Button>
      )}
    </Box>
  );
}

export default ErrorState;
