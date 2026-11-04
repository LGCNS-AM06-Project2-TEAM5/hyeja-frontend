import { useCallback, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import * as adminApi from '@/api/adminApi';
import {
  getServiceStatus,
  getServiceTrends,
  toGatewaySummary,
  toServiceRows,
  toFeignRows,
  toPolicyPipeline,
  toResilienceRows,
  toCircuitRows,
} from '@/api/prometheusApi';
import EventPipeline from '@/components/admin/EventPipeline';
import TrendChart from '@/components/admin/TrendChart';
import PolicyEventStatusCard from '@/components/admin/PolicyEventStatusCard';
import AppIcon from '@/components/common/AppIcon';
import { ADMIN_TROUBLESHOOTING } from '@/constants/adminTroubleshooting';
import { TOAST_MESSAGES } from '@/constants/messages';
import { useToast } from '@/hooks/useToast';
import { getErrorMessage } from '@/utils/getErrorMessage';

const toCompletedRows = (message) => [
  { label: '상태', value: '완료' },
  { label: '결과', value: message },
];

const toStoppedRows = ({ message, stoppedPage, savedCount }) => [
  { label: '상태', value: '중단' },
  { label: '멈춘 곳', value: stoppedPage == null ? '-' : `${stoppedPage}페이지` },
  {
    label: '저장',
    value: savedCount == null ? '-' : `${savedCount}건 (멈추기 전까지 저장한 정책은 남아 있어요)`,
  },
  { label: '사유', value: message },
];

function AdminPage() {
  const { showSuccess, showError, showInfo } = useToast();
  const [resultRows, setResultRows] = useState([]);
  const [isCollecting, setIsCollecting] = useState(false);
  const [tab, setTab] = useState(0);
  const [reloadToken, setReloadToken] = useState(0);
  const [trends, setTrends] = useState({ data: undefined, isLoading: true });
  const [monitoring, setMonitoring] = useState({
    metrics: undefined,
    events: undefined,
    eventsError: '',
    isLoading: true,
  });

  const reload = useCallback(() => {
    setTrends((previous) => ({ ...previous, isLoading: true }));
    setMonitoring((previous) => ({ ...previous, isLoading: true }));
    setReloadToken((previous) => previous + 1);
  }, []);

  useEffect(() => {
    let isActive = true;
    const update = (result) => {
      if (isActive) {
        setMonitoring((previous) => ({ ...previous, ...result }));
      }
    };
    getServiceStatus().then(
      (metrics) => update({ metrics, isLoading: false }),
      () =>
        update({
          metrics: {
            up: null,
            rate: null,
            latency: null,
            errors: null,
            requests: null,
            feign: null,
            circuit: null,
            circuitFailure: null,
            heap: null,
          },
          isLoading: false,
        }),
    );
    adminApi.getPolicyEventStatus().then(
      (events) => update({ events: events ?? null, eventsError: '' }),
      (error) => update({ events: null, eventsError: getErrorMessage(error) }),
    );
    getServiceTrends().then(
      (data) => {
        if (isActive) setTrends({ data, isLoading: false });
      },
      () => {
        if (isActive)
          setTrends({ data: { rate: null, latency: null, errors: null }, isLoading: false });
      },
    );
    return () => {
      isActive = false;
    };
  }, [reloadToken]);

  useEffect(() => {
    const timer = setInterval(reload, 15000);
    return () => clearInterval(timer);
  }, [reload]);

  const rows = toServiceRows(monitoring.metrics);
  const serviceCount = rows.every(({ status }) => status === '정상' || status === '중단')
    ? `${rows.filter(({ status }) => status === '정상').length} / 5 정상`
    : monitoring.metrics?.up === null
      ? '불러오지 못했어요'
      : '측정 중';
  const [requestCount, errorRatio] = toGatewaySummary(monitoring.metrics?.requests);
  const unavailable =
    monitoring.metrics === undefined
      ? '불러오는 중…'
      : monitoring.metrics === null
        ? '측정 전'
        : null;
  const pending = Number.isFinite(monitoring.events?.pendingCount)
    ? monitoring.events.pendingCount
    : monitoring.events === undefined
      ? undefined
      : null;
  const pipeline = toPolicyPipeline(monitoring.metrics);
  const events = monitoring.events;
  const prometheusUrl = import.meta.env.VITE_PROMETHEUS_URL?.trim();
  const outboxDetail =
    events === undefined
      ? '불러오는 중…'
      : events === null
        ? '불러오지 못했어요'
        : `대기 ${events.pendingCount}건 · 보냄 ${events.publishedCount}건`;
  const summaries = [
    ['서비스 상태', unavailable ?? serviceCount],
    ['최근 5분 요청', unavailable ?? requestCount],
    ['5xx 비율', unavailable ?? errorRatio],
    [
      '이벤트 보내기 대기',
      pending === undefined
        ? '불러오는 중…'
        : pending === null
          ? '불러오지 못했어요'
          : `${pending.toLocaleString('ko-KR')}건`,
    ],
  ];

  const handleCollect = async () => {
    setIsCollecting(true);
    showInfo(TOAST_MESSAGES.ADMIN_COLLECT_STARTED);

    try {
      const message = await adminApi.syncPolicies();
      setResultRows(toCompletedRows(message));
      showSuccess(TOAST_MESSAGES.ADMIN_COLLECT_DONE);
    } catch (error) {
      const stop = adminApi.toPolicySyncStop(error);

      if (stop) {
        setResultRows(toStoppedRows(stop));
        showError(TOAST_MESSAGES.ADMIN_COLLECT_STOPPED);
      } else {
        showError(getErrorMessage(error));
      }
    } finally {
      setIsCollecting(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="h1">관리 · 운영 현황</Typography>
        <Typography variant="body1" color="text.secondary">
          서비스 상태와 이벤트 흐름을 확인하고 주거 정책을 수집해요. (role = ADMIN만 접근)
        </Typography>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' },
          gap: 2,
        }}
      >
        {summaries.map(([label, value]) => (
          <Card key={label} variant="outlined" sx={{ p: 2, backgroundColor: 'grey.100' }}>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="subtitle1" sx={{ mt: 0.5, overflowWrap: 'anywhere' }}>
              {value}
            </Typography>
          </Card>
        ))}
      </Box>
      <Typography variant="body2" color="text.secondary">
        요청 수와 5xx 비율은 Gateway를 통과한 최근 5분 기준이에요.
      </Typography>

      <Tabs
        value={tab}
        onChange={(_event, value) => setTab(value)}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="관리자 대시보드"
      >
        {['운영 현황', '이벤트 동기화', '장애 대응·트러블 슈팅', '정책 수집'].map(
          (label, index) => (
            <Tab
              key={label}
              id={`admin-tab-${index}`}
              aria-controls={`admin-panel-${index}`}
              label={label}
            />
          ),
        )}
      </Tabs>

      <Box role="tabpanel" id="admin-panel-0" aria-labelledby="admin-tab-0" hidden={tab !== 0}>
        {trends.data === null ? (
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            측정 전
          </Typography>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
              gap: 2,
              mb: 3,
            }}
          >
            {[
              ['rate', '요청 수 (Gateway)'],
              ['latency', '응답 시간 p95'],
              ['errors', '5xx 비율'],
            ].map(([kind, title]) => (
              <TrendChart
                key={kind}
                title={title}
                kind={kind}
                points={trends.data?.[kind]}
                isLoading={trends.isLoading}
              />
            ))}
          </Box>
        )}
        <Card variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Stack
              direction="row"
              spacing={2}
              sx={{ justifyContent: 'space-between', alignItems: 'center' }}
            >
              <Box>
                <Typography variant="subtitle1">서비스 상태</Typography>
                <Typography variant="body2" color="text.secondary">
                  15초마다 갱신해요.
                </Typography>
              </Box>
              <Button variant="outlined" onClick={reload} disabled={monitoring.isLoading}>
                새로고침
              </Button>
            </Stack>
            {monitoring.metrics === null ? (
              <Typography color="text.secondary">모니터링 주소가 설정되지 않았어요</Typography>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small" aria-label="서비스 상태">
                  <TableHead>
                    <TableRow>
                      {['서비스', '상태', '초당 요청', '응답 시간 p95', '5xx 비율', 'JVM 힙'].map(
                        (label) => (
                          <TableCell key={label}>{label}</TableCell>
                        ),
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.name}>
                        <TableCell component="th" scope="row">
                          {row.name}
                        </TableCell>
                        <TableCell
                          sx={{
                            color:
                              row.status === '정상'
                                ? 'success.main'
                                : row.status === '중단'
                                  ? 'error.main'
                                  : 'text.secondary',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {row.status}
                        </TableCell>
                        <TableCell>{row.rate}</TableCell>
                        <TableCell>{row.latency}</TableCell>
                        <TableCell>{row.errors}</TableCell>
                        <TableCell>{row.heap}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
          </Stack>
        </Card>
        {monitoring.metrics !== null && (
          <Card variant="outlined" sx={{ p: 2, mt: 3 }}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle1">서비스 간 호출</Typography>
                <Typography variant="body2" color="text.secondary">
                  최근 5분 동안 누가 누구를 불렀는지 확인해요.
                </Typography>
              </Box>
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small" aria-label="서비스 간 호출">
                  <TableHead>
                    <TableRow>
                      {['구분', '호출', '최근 5분', '실패', '응답 시간 p95'].map((label) => (
                        <TableCell key={label}>{label}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {toFeignRows(monitoring.metrics?.feign).map((row) => (
                      <TableRow key={row.id}>
                        <TableCell component="th" scope="row">
                          {row.id}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          {row.source} → {row.target}
                        </TableCell>
                        <TableCell>{row.calls}</TableCell>
                        <TableCell
                          sx={{
                            color: row.hasFailures ? 'error.main' : 'text.primary',
                          }}
                        >
                          {row.failures}
                        </TableCell>
                        <TableCell>{row.p95}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
              <Typography variant="body2" color="text.secondary">
                실패는 5xx 응답 또는 오류로 기록된 호출을 한 번씩 세어요. 오류 정보가 부족하면 실패
                수는 측정 전으로 표시해요.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                호출별 응답 시간과 F5는 아직 측정 전이에요.
              </Typography>
            </Stack>
          </Card>
        )}
      </Box>
      <Box role="tabpanel" id="admin-panel-1" aria-labelledby="admin-tab-1" hidden={tab !== 1}>
        {tab === 1 && (
          <Stack spacing={3}>
            <EventPipeline
              title="policy-updated"
              description="정책이 바뀌면 관심 목록의 정책 정보도 따라 바뀌어요. 같은 이벤트는 한 번만 반영하고, 계속 실패하면 DLT로 따로 모아요."
              steps={[
                { label: '정책 저장', detail: '수집 트랜잭션' },
                { label: 'policy_outbox', detail: outboxDetail },
                { label: 'Kafka policy-updated', detail: 'key = policyId' },
                {
                  label: 'engagement 스냅샷',
                  detail: `반영 ${pipeline.applied} · 중복 무시 ${pipeline.duplicate}`,
                },
                {
                  label: 'policy-updated-dlt',
                  detail: `DLT ${pipeline.dlt}`,
                  tone: pipeline.hasDlt ? 'error' : undefined,
                },
              ]}
            />
            <EventPipeline
              title="member-withdrawn"
              description="회원이 탈퇴하면 관심 정책과 알림을 정리해요. 3번 실패하면 DLT에 저장하고, 3건이 쌓이면 관리자에게 메일을 보내요."
              steps={[
                { label: '탈퇴 커밋', detail: 'user · member_outbox' },
                { label: 'Kafka member-withdrawn' },
                { label: 'engagement 관심·알림 정리' },
                { label: 'member-withdrawn-dlt', detail: '저장 후 3건마다 관리자 메일' },
              ]}
            />
            <PolicyEventStatusCard
              status={events}
              errorMessage={monitoring.eventsError}
              isLoading={monitoring.isLoading}
              onReload={reload}
            />
          </Stack>
        )}
      </Box>
      <Box role="tabpanel" id="admin-panel-2" aria-labelledby="admin-tab-2" hidden={tab !== 2}>
        {tab === 2 && (
          <Stack spacing={3}>
            <Card variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle1">서킷 브레이커</Typography>
                  <Typography variant="body2" color="text.secondary">
                    실패가 쌓이면 회로가 열려 상대 서비스를 부르지 않고 대체 응답을 보내요.
                  </Typography>
                </Box>
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small" aria-label="서킷 브레이커">
                    <TableHead>
                      <TableRow>
                        {['호출', '호출하는 쪽 → 받는 쪽', '상태', '실패율'].map((label) => (
                          <TableCell key={label}>{label}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {toCircuitRows(monitoring.metrics).map((row) => (
                        <TableRow key={row.name}>
                          <TableCell component="th" scope="row">
                            {row.id}
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            {row.source} → {row.target}
                          </TableCell>
                          <TableCell>
                            <Chip size="small" label={row.status} color={row.tone} />
                          </TableCell>
                          <TableCell>{row.failureRate}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </Stack>
            </Card>
            <Card variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle1">장애 대응 시나리오</Typography>
                  <Typography variant="body2" color="text.secondary">
                    장애를 일부러 내면 이 표의 '지금' 칸이 바뀌어요.
                  </Typography>
                </Box>
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small" aria-label="장애 대응 시나리오">
                    <TableHead>
                      <TableRow>
                        {['상황', '우리가 만든 대응', '지금'].map((label) => (
                          <TableCell key={label}>{label}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {toResilienceRows(monitoring.metrics, events).map((row) => (
                        <TableRow key={row.situation}>
                          <TableCell component="th" scope="row">
                            {row.situation}
                          </TableCell>
                          <TableCell>{row.response}</TableCell>
                          <TableCell sx={{ color: row.tone ? `${row.tone}.main` : 'text.primary' }}>
                            {row.now}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </Stack>
            </Card>
            <Card variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle1">트러블 슈팅 기록</Typography>
                  <Typography variant="body2" color="text.secondary">
                    개발하면서 실제로 겪은 문제와 해결한 PR이에요.
                  </Typography>
                </Box>
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small" aria-label="트러블 슈팅 기록">
                    <TableHead>
                      <TableRow>
                        {['문제', '원인', '해결', 'PR'].map((label) => (
                          <TableCell key={label}>{label}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {ADMIN_TROUBLESHOOTING.map((row) => (
                        <TableRow key={row.problem}>
                          <TableCell component="th" scope="row">
                            {row.problem}
                          </TableCell>
                          <TableCell>{row.cause}</TableCell>
                          <TableCell>{row.solution}</TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              {row.prs.map((number) => (
                                <Typography
                                  key={number}
                                  component="a"
                                  variant="body2"
                                  href={`https://github.com/LGCNS-AM06-Project2-TEAM5/hyeja-msa/pull/${number}`}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  #{number}
                                </Typography>
                              ))}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </Stack>
            </Card>
            <Card variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={2}>
                <Typography variant="subtitle1">바로가기</Typography>
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                  {[
                    ['Zipkin 추적', 'http://localhost:9411'],
                    ['Eureka', 'http://localhost:8761'],
                    [
                      'GitHub Actions',
                      'https://github.com/LGCNS-AM06-Project2-TEAM5/hyeja-msa/actions',
                    ],
                    ...(prometheusUrl ? [['Prometheus', prometheusUrl]] : []),
                  ].map(([label, href]) => (
                    <Button
                      key={label}
                      variant="outlined"
                      component="a"
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {label}
                    </Button>
                  ))}
                </Stack>
              </Stack>
            </Card>
          </Stack>
        )}
      </Box>
      <Box role="tabpanel" id="admin-panel-3" aria-labelledby="admin-tab-3" hidden={tab !== 3}>
        <Stack spacing={3}>
          <Typography variant="body1" color="text.secondary">
            온통청년에서 주거 정책을 바로 가져와요. 수집에 몇 분 걸릴 수 있어요.
          </Typography>
          <Card variant="outlined" sx={{ p: 2 }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{ alignItems: { xs: 'flex-start', sm: 'center' } }}
            >
              <Button
                variant="contained"
                onClick={handleCollect}
                disabled={isCollecting}
                sx={{ flexShrink: 0 }}
              >
                {isCollecting ? '수집하는 중…' : '지금 수집 실행'}
              </Button>
              <Typography variant="body1" color="text.secondary">
                온통청년 API <AppIcon name="arrow-right" size={14} /> 주거 정책 저장{' '}
                <AppIcon name="arrow-right" size={14} /> 하위 유형 분류{' '}
                <AppIcon name="arrow-right" size={14} /> 카드뉴스 생성
              </Typography>
            </Stack>
          </Card>

          {resultRows.length > 0 && (
            <Card variant="outlined" sx={{ backgroundColor: 'grey.100' }}>
              <Typography variant="body2" sx={{ px: 2, py: 1.5 }}>
                마지막 수집 결과
              </Typography>
              <Stack divider={<Divider />}>
                {resultRows.map((row) => (
                  <Stack
                    key={row.label}
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={{ xs: 0.5, sm: 2 }}
                    sx={{ px: 2, py: 1.5 }}
                  >
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      sx={{ width: { xs: 'auto', sm: 64 }, flexShrink: 0 }}
                    >
                      {row.label}
                    </Typography>
                    <Typography variant="body1" sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>
                      {row.value}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Card>
          )}
        </Stack>
      </Box>
    </Stack>
  );
}

export default AdminPage;
