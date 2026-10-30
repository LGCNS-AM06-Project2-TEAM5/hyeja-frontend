import { useCallback, useState } from 'react';

import {
  CONDITION_FIELDS,
  INITIAL_CONDITION_FORM,
  isConditionValueBlank,
  isWholeRegionCode,
  REQUIRED_CONDITION_FIELDS,
} from '@/constants/condition';
import { VALIDATION_MESSAGES } from '@/constants/messages';
import { conditionDraft } from '@/utils/conditionDraft';

export const useConditionForm = (initialConditions) => {
  const [form, setForm] = useState(() => ({ ...INITIAL_CONDITION_FORM, ...initialConditions }));
  const [fieldErrors, setFieldErrors] = useState({});

  const changeField = useCallback((name, value) => {
    setForm((previous) => {
      const nextForm = { ...previous, [name]: value };

      // 설계서 S-04: 저장하지 않고 나가도 이어서 쓸 수 있게 브라우저에만 담아 둔다.
      conditionDraft.save(nextForm);

      return nextForm;
    });
  }, []);

  const validate = useCallback(() => {
    const errors = {};

    REQUIRED_CONDITION_FIELDS.forEach((field) => {
      if (isConditionValueBlank(form[field])) {
        errors[field] = VALIDATION_MESSAGES.REQUIRED_FIELD;
      }
    });

    if (isWholeRegionCode(form[CONDITION_FIELDS.REGION_CODE])) {
      errors[CONDITION_FIELDS.REGION_CODE] = VALIDATION_MESSAGES.REGION_WHOLE_NOT_ALLOWED;
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  }, [form]);

  return { form, fieldErrors, changeField, validate };
};
