import { describe, expect, it, vi } from 'vitest';

import { STORAGE_KEYS } from '@/constants/storageKeys';
import { conditionDraft } from '@/utils/conditionDraft';

const storageError = () => {
  throw new Error('저장 공간을 쓸 수 없음');
};

// spy는 vitest 설정의 restoreMocks로 테스트마다 원래대로 돌아간다.
describe('conditionDraft', () => {
  it('저장한 입력값을 그대로 복원한다', () => {
    const form = { birthDate: '1999-03-12', houseless: false, regionCode: '11440' };

    conditionDraft.save(form);

    expect(conditionDraft.read()).toEqual(form);
  });

  it('저장한 적이 없으면 null을 준다', () => {
    expect(conditionDraft.read()).toBeNull();
  });

  it('저장값이 깨진 JSON이면 null로 버틴다', () => {
    localStorage.setItem(STORAGE_KEYS.CONDITION_DRAFT, '{broken');

    expect(conditionDraft.read()).toBeNull();
  });

  it('clear하면 다시 null이 된다', () => {
    conditionDraft.save({ birthDate: '1999-03-12' });
    conditionDraft.clear();

    expect(conditionDraft.read()).toBeNull();
  });

  describe('저장 공간을 쓸 수 없는 브라우저', () => {
    it('읽기에서 예외가 나면 null을 준다', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(storageError);

      expect(conditionDraft.read()).toBeNull();
    });

    it('저장·삭제에서 예외가 나도 화면으로 던지지 않는다', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(storageError);
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(storageError);

      expect(() => conditionDraft.save({ birthDate: '1999-03-12' })).not.toThrow();
      expect(() => conditionDraft.clear()).not.toThrow();
    });
  });
});
