import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import MenuItem from '@mui/material/MenuItem';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import FieldError from '@/components/common/FieldError';
import {
  CONDITION_FIELDS,
  CONDITION_HELPER_TEXTS,
  HOUSELESS_OPTIONS,
  isWholeRegionCode,
} from '@/constants/condition';

function FieldLabel({ label, isRequired }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
      <FormLabel
        sx={{
          typography: 'body2',
          color: 'text.primary',
          '&.Mui-focused, &.Mui-error': { color: 'text.primary' },
        }}
      >
        {label}
      </FormLabel>
      <Chip
        label={isRequired ? '필수' : '선택'}
        size="small"
        color={isRequired ? 'primary' : 'default'}
        sx={{ height: 20, fontSize: 11 }}
      />
    </Stack>
  );
}

function RadioField({ label, isRequired, field, options, value, error, helperText, onChange }) {
  const items = isRequired ? options.items : [{ value: '', label: '선택 안 함' }, ...options.items];

  return (
    <FormControl error={Boolean(error)}>
      <FieldLabel label={label} isRequired={isRequired} />
      <RadioGroup
        row
        value={String(value ?? '')}
        onChange={(event) => onChange(field, options.parse(event.target.value))}
        sx={{ columnGap: 0.5, rowGap: 0.25, flexWrap: 'wrap' }}
      >
        {items.map((option) => (
          <FormControlLabel
            key={String(option.value)}
            value={String(option.value)}
            control={<Radio size="small" />}
            label={<Typography variant="body1">{option.label}</Typography>}
          />
        ))}
      </RadioGroup>
      <FormHelperText>{error ? <FieldError>{error}</FieldError> : helperText}</FormHelperText>
    </FormControl>
  );
}

function ConditionForm({ form, fieldErrors, codes, onChange }) {
  const selectedSido = codes.regions.find((region) => region.sidoCode === form.sidoCode);

  const handleSidoChange = (event) => {
    onChange(CONDITION_FIELDS.SIDO_CODE, event.target.value);
    onChange(CONDITION_FIELDS.REGION_CODE, '');
  };

  const asOptions = (items) => ({
    items: items.map((item) => ({ value: item.code, label: item.name })),
    parse: (value) => value,
  });

  return (
    <Stack spacing={3}>
      <Stack spacing={2}>
        <Divider textAlign="center">
          <Typography
            variant="body2"
            sx={{
              px: 1.5,
              py: 0.5,
              borderRadius: 99,
              bgcolor: 'primary.main',
              color: 'common.white',
            }}
          >
            필수 조건
          </Typography>
        </Divider>

        <TextField
          label="생년월일"
          name={CONDITION_FIELDS.BIRTH_DATE}
          type="date"
          value={form.birthDate}
          onChange={(event) => onChange(CONDITION_FIELDS.BIRTH_DATE, event.target.value)}
          error={Boolean(fieldErrors.birthDate)}
          helperText={
            fieldErrors.birthDate ? (
              <FieldError>{fieldErrors.birthDate}</FieldError>
            ) : (
              CONDITION_HELPER_TEXTS.birthDate
            )
          }
          slotProps={{ inputLabel: { shrink: true } }}
          fullWidth
        />

        <FormControl error={Boolean(fieldErrors.regionCode)}>
          <FieldLabel label="거주지" isRequired />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <TextField
              select
              value={form.sidoCode}
              onChange={handleSidoChange}
              slotProps={{ htmlInput: { 'aria-label': '시도 선택' } }}
              sx={{ flex: 1 }}
            >
              {codes.regions.map((region) => (
                <MenuItem key={region.sidoCode} value={region.sidoCode}>
                  {region.sidoName}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              value={form.regionCode}
              onChange={(event) => onChange(CONDITION_FIELDS.REGION_CODE, event.target.value)}
              disabled={!selectedSido}
              error={Boolean(fieldErrors.regionCode)}
              slotProps={{ htmlInput: { 'aria-label': '시군구 선택' } }}
              sx={{ flex: 1 }}
            >
              {(selectedSido?.sigungu ?? []).map((sigungu) => {
                const isWholeRegion = isWholeRegionCode(sigungu.code);

                return (
                  <MenuItem key={sigungu.code} value={sigungu.code} disabled={isWholeRegion}>
                    {sigungu.name}
                    {isWholeRegion && (
                      <Typography variant="caption" color="text.disabled" sx={{ ml: 1 }}>
                        선택할 수 없어요
                      </Typography>
                    )}
                  </MenuItem>
                );
              })}
            </TextField>
          </Stack>
          <FormHelperText sx={{ wordBreak: 'keep-all', overflowWrap: 'break-word' }}>
            {fieldErrors.regionCode ? (
              <FieldError>{fieldErrors.regionCode}</FieldError>
            ) : (
              '시/군/구 전체 지역은 선택할 수 없어요. 구체적인 지역을 선택해 주세요'
            )}
          </FormHelperText>
        </FormControl>

        <RadioField
          label="취업 상태"
          isRequired
          field={CONDITION_FIELDS.EMPLOYMENT_CODE}
          options={asOptions(codes.employments)}
          value={form.employmentCode}
          error={fieldErrors.employmentCode}
          helperText={CONDITION_HELPER_TEXTS.employmentCode}
          onChange={onChange}
        />

        <RadioField
          label="무주택 여부"
          isRequired
          field={CONDITION_FIELDS.HOUSELESS}
          options={{ items: HOUSELESS_OPTIONS, parse: (value) => value === 'true' }}
          value={form.houseless}
          error={fieldErrors.houseless}
          helperText={CONDITION_HELPER_TEXTS.houseless}
          onChange={onChange}
        />
      </Stack>

      <Stack spacing={2}>
        <Divider textAlign="center">
          <Typography
            variant="body2"
            sx={{
              px: 1.5,
              py: 0.5,
              borderRadius: 99,
              bgcolor: 'primary.main',
              color: 'common.white',
            }}
          >
            선택 조건
          </Typography>
        </Divider>

        <RadioField
          label="혼인 여부"
          isRequired={false}
          field={CONDITION_FIELDS.MARRIAGE_CODE}
          options={asOptions(codes.marriages)}
          value={form.marriageCode}
          error={fieldErrors.marriageCode}
          helperText={CONDITION_HELPER_TEXTS.marriageCode}
          onChange={onChange}
        />

        <FormControl>
          <FieldLabel label="연소득" isRequired={false} />
          <TextField
            select
            value={form.incomeRange}
            onChange={(event) => onChange(CONDITION_FIELDS.INCOME_RANGE, event.target.value)}
            helperText={CONDITION_HELPER_TEXTS.incomeRange}
            fullWidth
          >
            <MenuItem value="">선택 안 함</MenuItem>
            {codes.incomeRanges.map((option) => (
              <MenuItem key={option.code} value={option.code}>
                {option.name}
              </MenuItem>
            ))}
          </TextField>
        </FormControl>

        <FormControl>
          <FieldLabel label="학력" isRequired={false} />
          <TextField
            select
            value={form.educationCode}
            onChange={(event) => onChange(CONDITION_FIELDS.EDUCATION_CODE, event.target.value)}
            helperText={CONDITION_HELPER_TEXTS.educationCode}
            fullWidth
          >
            <MenuItem value="">선택 안 함</MenuItem>
            {codes.educations.map((option) => (
              <MenuItem key={option.code} value={option.code}>
                {option.name}
              </MenuItem>
            ))}
          </TextField>
        </FormControl>

        <RadioField
          label="주거 형태"
          isRequired={false}
          field={CONDITION_FIELDS.HOUSING_TYPE}
          options={asOptions(codes.housingTypes)}
          value={form.housingType}
          error={fieldErrors.housingType}
          helperText={CONDITION_HELPER_TEXTS.housingType}
          onChange={onChange}
        />
      </Stack>
    </Stack>
  );
}

export default ConditionForm;
