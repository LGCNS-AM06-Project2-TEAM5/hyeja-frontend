import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import { POLICY_SUBTYPES } from '@/constants/policy';
import { COLORS } from '@/styles/theme';

function PolicyFilterTabs({ subtype, onSubtypeChange }) {
  return (
    <Tabs
      value={subtype}
      onChange={(event, value) => onSubtypeChange(value)}
      variant="scrollable"
      scrollButtons="auto"
      aria-label="주거 정책 분류"
      // 밑줄 대신 알약 모양으로 고른 분류를 채워 보여 준다.
      sx={{
        minHeight: 40,
        '& .MuiTabs-indicator': { display: 'none' },
      }}
    >
      {POLICY_SUBTYPES.map((option) => (
        <Tab
          key={option.value}
          value={option.value}
          label={option.label}
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
  );
}

export default PolicyFilterTabs;
