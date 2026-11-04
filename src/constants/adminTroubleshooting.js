export const ADMIN_TROUBLESHOOTING = [
  {
    problem: 'Kafka로 이벤트가 전혀 안 나감',
    cause: 'Cloud Bus가 기본 KafkaTemplate의 직렬화기를 바꿈',
    solution: '이벤트 전송·구독에 전용 String Producer를 따로 만듦',
    prs: [83, 88],
  },
  {
    problem: 'engagement가 내부 호출을 401로 막음',
    cause: '내부 경로(/internal)도 Gateway JWT 검사 대상이었음',
    solution: '내부 경로를 인증 대상에서 뺌',
    prs: [95],
  },
  {
    problem: '긴 정책 이벤트 저장 실패 가능',
    cause: '이벤트 본문 칸이 TEXT(64KB)라 지원 내용이 길면 넘침',
    solution: 'MEDIUMTEXT로 바꿈',
    prs: [82],
  },
  {
    problem: '서비스가 뜨지 않음',
    cause: 'application.yml에 spring.cloud 키가 두 번 들어감',
    solution: '한 블록으로 합침',
    prs: [62],
  },
  {
    problem: '회원 조회 중 DB 커넥션을 붙잡음',
    cause: '트랜잭션 안에서 다른 서비스를 호출함',
    solution: '호출을 트랜잭션 밖으로 뺌',
    prs: [67],
  },
  {
    problem: 'DLT 건수가 실제와 다르게 보일 수 있음',
    cause: '기본 listener 지표는 재시도마다 실패가 늘어남',
    solution: 'engagement가 반영·중복·DLT를 직접 셈',
    prs: [111],
  },
];
