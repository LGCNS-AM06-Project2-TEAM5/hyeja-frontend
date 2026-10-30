import { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';

import AppIcon from '@/components/common/AppIcon';

/**
 * 비밀번호 입력칸. 오른쪽 눈 버튼으로 입력한 글자를 잠깐 보거나 다시 가릴 수 있다.
 * 나머지 props는 TextField에 그대로 넘긴다. slotProps.input의 startAdornment 등도 유지한다.
 */
function PasswordField({ slotProps, ...props }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <TextField
      {...props}
      type={isVisible ? 'text' : 'password'}
      slotProps={{
        ...slotProps,
        input: {
          ...slotProps?.input,
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                edge="end"
                size="small"
                aria-label={isVisible ? '입력 내용 숨기기' : '입력 내용 보기'}
                aria-pressed={isVisible}
                onClick={() => setIsVisible((previous) => !previous)}
                // 버튼을 눌러도 입력칸의 커서가 빠지지 않게 한다.
                onMouseDown={(event) => event.preventDefault()}
                sx={{ color: 'text.secondary' }}
              >
                <AppIcon name={isVisible ? 'eye-off' : 'eye'} size={20} />
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}

export default PasswordField;
