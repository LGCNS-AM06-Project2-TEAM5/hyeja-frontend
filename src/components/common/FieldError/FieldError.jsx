import Box from '@mui/material/Box';

import AppIcon from '@/components/common/AppIcon';

function FieldError({ children }) {
  return (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
      <AppIcon name="warning" size={14} />
      <span>{children}</span>
    </Box>
  );
}

export default FieldError;
