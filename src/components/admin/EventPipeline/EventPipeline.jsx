import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import AppIcon from '@/components/common/AppIcon';

/** 이벤트가 지나가는 단계를 왼쪽에서 오른쪽으로 보여 준다. tone이 error인 단계는 빨간 테두리로 강조한다. */
function EventPipeline({ title, description, steps }) {
  return (
    <Card variant="outlined" component="section" aria-label={`${title} 흐름`} sx={{ p: 2 }}>
      <Stack spacing={1.5}>
        <Box>
          <Typography variant="subtitle1">{title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Box>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1}
          sx={{ alignItems: { xs: 'stretch', md: 'center' }, flexWrap: 'wrap' }}
        >
          {steps.map((step, index) => (
            <Stack
              key={step.label}
              direction={{ xs: 'column', md: 'row' }}
              spacing={1}
              sx={{ alignItems: { xs: 'flex-start', md: 'center' } }}
            >
              {index > 0 && (
                <Box
                  sx={{ color: 'text.secondary', transform: { xs: 'rotate(90deg)', md: 'none' } }}
                >
                  <AppIcon name="arrow-right" size={14} />
                </Box>
              )}
              <Box
                sx={{
                  border: 1,
                  borderColor: step.tone === 'error' ? 'error.main' : 'divider',
                  borderRadius: 2,
                  px: 1.5,
                  py: 1,
                  backgroundColor: 'background.paper',
                }}
              >
                <Typography variant="body1">{step.label}</Typography>
                {step.detail && (
                  <Typography
                    variant="body2"
                    color={step.tone === 'error' ? 'error.main' : 'text.secondary'}
                  >
                    {step.detail}
                  </Typography>
                )}
              </Box>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Card>
  );
}

export default EventPipeline;
