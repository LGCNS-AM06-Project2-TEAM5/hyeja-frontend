import { describe, expect, it } from 'vitest';

import { NOTIFICATION_PAGE_SIZE, toNotificationList } from '@/api/notificationApi';

describe('알림 API 응답 변환', () => {
  it('백엔드 응답 봉투와 snake_case 필드를 화면 모델로 변환한다', () => {
    const result = toNotificationList({
      isSuccess: true,
      code: 'SUCCESS_001',
      message: '성공입니다.',
      result: {
        notifications: [
          {
            notification_id: 10,
            member_id: 1,
            policy_id: 'R202609230001',
            policy_name: '서울시 청년 월세 지원',
            content: '관심 정책의 신청 마감이 일주일 남았어요',
            read_yn: false,
            apply_end_date: '2026-09-30',
            created_at: '2026-09-24T10:30:00',
          },
        ],
        unread_count: 5,
        page: 0,
        size: 8,
        totalElements: 9,
        totalPages: 2,
        hasNext: true,
      },
    });

    expect(result).toEqual({
      content: [
        {
          id: 10,
          memberId: 1,
          policyId: 'R202609230001',
          title: '관심 정책의 신청 마감이 일주일 남았어요',
          body: '서울시 청년 월세 지원',
          isRead: false,
          applyPeriodType: undefined,
          applyEndDate: '2026-09-30',
          createdAt: '2026-09-24T10:30:00',
        },
      ],
      unreadCount: 5,
      page: 0,
      size: NOTIFICATION_PAGE_SIZE,
      totalCount: 9,
      totalPages: 2,
      hasNext: true,
    });
  });
});
