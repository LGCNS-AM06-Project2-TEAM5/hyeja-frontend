/**
 * 설계서 S-09: 마감 7일 이하로 남은 관심 정책만 알려준다.
 * 스케줄러가 만드는 알림이라, 목에서는 관심 목록을 기준으로 만들어 둔다.
 * notice: 알림창 스크롤을 확인할 수 있게 안 읽은 더미 알림을 4개보다 많이 담아 뒀습니다.
 */
const minutesAgo = (minutes) => new Date(Date.now() - minutes * 60000).toISOString();

const DEADLINE_TITLE = '관심 정책의 신청 마감이 일주일 남았어요';

const UNREAD_SOURCES = [
  { id: 1, policyId: 2, body: '서울시 청년 월세 지원', minutes: 60 * 6 },
  { id: 2, policyId: 1, body: '청년 월세 한시 특별지원', minutes: 60 * 24 * 2 },
  { id: 3, policyId: 100, body: '부산 청년 월세 한시 특별지원', minutes: 60 * 24 * 3 },
  { id: 4, policyId: 110, body: '성남 청년 월세 한시 특별지원', minutes: 60 * 24 * 3.5 },
  { id: 5, policyId: 3, body: '마포구 청년 이사비 지원', minutes: 60 * 24 * 4 },
  { id: 6, policyId: 101, body: '부산 서울시 청년 월세 지원', minutes: 60 * 24 * 4.5 },
];

export const NOTIFICATIONS = [
  ...UNREAD_SOURCES.map((source) => ({
    id: source.id,
    policyId: source.policyId,
    title: DEADLINE_TITLE,
    body: source.body,
    isRead: false,
    createdAt: minutesAgo(source.minutes),
  })),
  {
    id: 7,
    policyId: 4,
    title: DEADLINE_TITLE,
    body: '서울시 청년 임차보증금 이자 지원',
    isRead: true,
    createdAt: minutesAgo(60 * 24 * 5),
  },
];
