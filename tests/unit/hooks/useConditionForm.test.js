import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CONDITION_FIELDS, INITIAL_CONDITION_FORM } from '@/constants/condition';
import { VALIDATION_MESSAGES } from '@/constants/messages';
import { useConditionForm } from '@/hooks/useConditionForm';
import { conditionDraft } from '@/utils/conditionDraft';

const FILLED_REQUIRED = {
  [CONDITION_FIELDS.BIRTH_DATE]: '1999-03-12',
  [CONDITION_FIELDS.SIDO_CODE]: '11',
  [CONDITION_FIELDS.REGION_CODE]: '11440',
  [CONDITION_FIELDS.EMPLOYMENT_CODE]: 'JOB_SEEKING',
  [CONDITION_FIELDS.HOUSELESS]: true,
};

const validate = (result) => {
  let isValid;

  act(() => {
    isValid = result.current.validate();
  });

  return isValid;
};

describe('useConditionForm', () => {
  it('초기 조건을 빈 폼 위에 덮어서 시작한다', () => {
    const { result } = renderHook(() => useConditionForm({ birthDate: '1999-03-12' }));

    expect(result.current.form).toEqual({ ...INITIAL_CONDITION_FORM, birthDate: '1999-03-12' });
    expect(result.current.fieldErrors).toEqual({});
  });

  it('입력할 때마다 폼을 바꾸고 draft에 저장한다', () => {
    const { result } = renderHook(() => useConditionForm());

    act(() => result.current.changeField(CONDITION_FIELDS.BIRTH_DATE, '1999-03-12'));
    act(() => result.current.changeField(CONDITION_FIELDS.HOUSELESS, false));

    expect(result.current.form.birthDate).toBe('1999-03-12');
    expect(conditionDraft.read()).toEqual(result.current.form);
  });

  it('필수값이 비어 있으면 필드마다 필수 오류를 준다', () => {
    const { result } = renderHook(() => useConditionForm());

    expect(validate(result)).toBe(false);
    expect(result.current.fieldErrors).toEqual({
      [CONDITION_FIELDS.BIRTH_DATE]: VALIDATION_MESSAGES.REQUIRED_FIELD,
      [CONDITION_FIELDS.REGION_CODE]: VALIDATION_MESSAGES.REQUIRED_FIELD,
      [CONDITION_FIELDS.EMPLOYMENT_CODE]: VALIDATION_MESSAGES.REQUIRED_FIELD,
      [CONDITION_FIELDS.HOUSELESS]: VALIDATION_MESSAGES.REQUIRED_FIELD,
    });
  });

  it('무주택 여부 "아니요"(false)는 입력한 값으로 본다', () => {
    const { result } = renderHook(() =>
      useConditionForm({ ...FILLED_REQUIRED, [CONDITION_FIELDS.HOUSELESS]: false }),
    );

    expect(validate(result)).toBe(true);
    expect(result.current.fieldErrors).toEqual({});
  });

  it('시/군/구 "전체" 코드는 거절한다', () => {
    const { result } = renderHook(() =>
      useConditionForm({ ...FILLED_REQUIRED, [CONDITION_FIELDS.REGION_CODE]: '11000' }),
    );

    expect(validate(result)).toBe(false);
    expect(result.current.fieldErrors).toEqual({
      [CONDITION_FIELDS.REGION_CODE]: VALIDATION_MESSAGES.REGION_WHOLE_NOT_ALLOWED,
    });
  });

  it('선택 항목은 비워도 통과하고, 고치면 이전 오류가 사라진다', () => {
    const { result } = renderHook(() =>
      useConditionForm({ ...FILLED_REQUIRED, [CONDITION_FIELDS.BIRTH_DATE]: '' }),
    );

    expect(validate(result)).toBe(false);

    act(() => result.current.changeField(CONDITION_FIELDS.BIRTH_DATE, '1999-03-12'));

    expect(validate(result)).toBe(true);
    expect(result.current.fieldErrors).toEqual({});
  });
});
