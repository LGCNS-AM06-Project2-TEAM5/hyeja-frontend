import AppIcon from '@/components/common/AppIcon';
import FieldError from '@/components/common/FieldError';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import SubtypeChip from '@/components/common/SubtypeChip';
import { POLICY_SEARCH_HASHTAGS, SEARCH_KEYWORD_MAX_LENGTH } from '@/constants/policy';
import { GRADIENTS, LAYOUT, SHADOWS } from '@/styles/theme';

/**
 * 설계서 Search/Main: 600 × 52 · 테두리 1.5 · 글자 16/24 · 오른쪽 끝 44px 원형 검색 버튼.
 * onRequestLogin을 받으면 검색은 잠긴 상태다. 입력도 막고 로그인 안내 창만 띄운다.
 * isResultPage는 추천 결과(S-05) 맨 위 검색창이다. 왼쪽에 붙이고, 해시태그 바로가기와 오류 문구 자리를 두지 않는다.
 * inputRef로 입력칸을 받아 검색어를 고치도록 포커스할 수 있다.
 */
function PolicySearchBar({
  keyword,
  onKeywordChange,
  onSubmit,
  errorMessage,
  onRequestLogin,
  isResultPage = false,
  inputRef,
}) {
  const isLocked = Boolean(onRequestLogin);

  const requestSearch = (searchKeyword) => {
    if (isLocked) {
      onRequestLogin();
      return;
    }

    onSubmit(searchKeyword);
  };

  // 백엔드는 "#월세"처럼 #까지 같은 검색어만 AI 없이 유형으로 찾는다.
  const handleHashtagClick = (hashtag) => {
    const hashtagKeyword = `#${hashtag}`;

    if (!isLocked) {
      onKeywordChange(hashtagKeyword);
    }

    requestSearch(hashtagKeyword);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    requestSearch(keyword);
  };

  /**
   * 잠금 상태에서는 입력칸에 포커스가 가지 않게 막는다.
   * 포커스가 남으면 안내 창이 닫힐 때 포커스가 되돌아오면서 안내 창이 다시 열린다.
   */
  const handleLockedMouseDown = isLocked
    ? (event) => {
        event.preventDefault();
        onRequestLogin();
      }
    : undefined;

  const emptyHelperText = isResultPage ? undefined : ' ';

  return (
    <Stack
      component="form"
      spacing={1.5}
      onSubmit={handleSubmit}
      sx={{ alignItems: isResultPage ? 'flex-start' : 'center', width: '100%' }}
    >
      <TextField
        value={keyword}
        onChange={(event) =>
          onKeywordChange(event.target.value.slice(0, SEARCH_KEYWORD_MAX_LENGTH))
        }
        onMouseDown={handleLockedMouseDown}
        inputRef={inputRef}
        placeholder="예: 월세 지원 알려줘"
        error={Boolean(errorMessage)}
        helperText={errorMessage ? <FieldError>{errorMessage}</FieldError> : emptyHelperText}
        fullWidth
        sx={{
          maxWidth: LAYOUT.searchBarWidth,
          '& .MuiOutlinedInput-root': {
            height: 56,
            borderRadius: '28px',
            pl: '24px',
            pr: '6px',
            bgcolor: 'common.white',
            boxShadow: SHADOWS.card,
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderWidth: 1.5,
            borderColor: 'rgba(101, 88, 211, 0.22)',
          },
          '& .MuiOutlinedInput-input': { p: 0, height: 24, fontSize: 16, lineHeight: '24px' },
          '& .MuiInputAdornment-root': { height: 'auto', maxHeight: 'none', ml: '10px' },
          '& .MuiInputAdornment-root .MuiTypography-root': { display: { xs: 'none', sm: 'block' } },
        }}
        slotProps={{
          htmlInput: {
            maxLength: SEARCH_KEYWORD_MAX_LENGTH,
            'aria-label': '정책 검색',
            readOnly: isLocked,
          },
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <Typography variant="caption" color="text.disabled" sx={{ mr: '10px' }}>
                  {keyword.length} / {SEARCH_KEYWORD_MAX_LENGTH}
                </Typography>
                <IconButton
                  type="submit"
                  aria-label="검색"
                  sx={{
                    width: 44,
                    height: 44,
                    color: 'primary.contrastText',
                    background: GRADIENTS.accent,
                    // 설계서 공통 규칙: 호버·클릭은 같은 색을 진하게 보여 준다.
                    '&:hover': { background: GRADIENTS.accent, opacity: 0.88 },
                  }}
                >
                  <AppIcon name="search" size={20} />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />

      {!isResultPage && (
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          sx={{ justifyContent: 'center', flexWrap: 'wrap' }}
        >
          {POLICY_SEARCH_HASHTAGS.map((hashtag) => (
            <SubtypeChip
              key={hashtag}
              label={`#${hashtag}`}
              onClick={() => handleHashtagClick(hashtag)}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
}

export default PolicySearchBar;
