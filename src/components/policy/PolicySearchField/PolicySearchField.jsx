import { useState } from 'react';
import AppIcon from '@/components/common/AppIcon';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';

import { SEARCH_KEYWORD_MAX_LENGTH } from '@/constants/policy';

const FIELD_WIDTH = 240;

/**
 * 설계서 Header/SearchSmall: 240 × 36 · 모서리 18 · 글자 12 · 검색 아이콘 28.
 * 홈·추천 결과의 큰 검색창과 달리 화면 안에 작게 놓는다.
 * 검색어를 확정하면(엔터·검색 버튼) 앞뒤 공백을 뺀 값으로 onSearch를 부른다. 빈 값이면 전체 보기다.
 */
function PolicySearchField({ onSearch, placeholder = '주거 정책 검색', initialKeyword = '' }) {
  const [keyword, setKeyword] = useState(initialKeyword);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSearch(keyword.trim());
  };

  return (
    <Box component="form" role="search" onSubmit={handleSubmit}>
      <TextField
        value={keyword}
        onChange={(event) => setKeyword(event.target.value.slice(0, SEARCH_KEYWORD_MAX_LENGTH))}
        placeholder={placeholder}
        size="small"
        sx={{
          width: FIELD_WIDTH,
          maxWidth: '100%',
          '& .MuiOutlinedInput-root': {
            height: 40,
            borderRadius: '20px',
            pl: '16px',
            pr: '6px',
            bgcolor: 'common.white',
          },
          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(101, 88, 211, 0.22)' },
          '& .MuiOutlinedInput-input': { p: 0, typography: 'caption', height: 16 },
        }}
        slotProps={{
          htmlInput: {
            maxLength: SEARCH_KEYWORD_MAX_LENGTH,
            'aria-label': placeholder,
          },
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton type="submit" aria-label="검색" sx={{ width: 28, height: 28, p: 0 }}>
                  <AppIcon name="search" size={20} />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />
    </Box>
  );
}

export default PolicySearchField;
