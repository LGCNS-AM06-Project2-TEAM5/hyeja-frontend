import { screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ROUTES } from '@/constants/routes';

import { renderApp, signInAs } from '../../helpers/renderApp';
import { TOKENS } from '../../msw/fixtures';

const openOpsTab = async () => {
  signInAs(TOKENS.ADMIN);
  const view = renderApp(ROUTES.ADMIN);
  await screen.findByRole('heading', { name: '관리 · 운영 현황' }, { timeout: 2000 });
  await view.user.click(screen.getByRole('tab', { name: '장애 대응·트러블 슈팅' }));
};

beforeEach(() => vi.stubEnv('VITE_PROMETHEUS_URL', 'http://monitoring.test'));
afterEach(() => vi.unstubAllEnvs());

describe('관리자 장애 대응·트러블 슈팅', () => {
  it('서킷 브레이커 여섯 호출과 차단·정상·확인 중 상태를 보여 준다', async () => {
    await openOpsTab();
    const table = within(screen.getByRole('table', { name: '서킷 브레이커' }));
    expect(table.getAllByRole('row')).toHaveLength(7);
    const f1 = within(table.getByRole('row', { name: /F1/ }));
    expect(await f1.findByText('차단')).toBeInTheDocument();
    expect(f1.getByText('recommendation → user')).toBeInTheDocument();
    expect(f1.getByText('25%')).toBeInTheDocument();
    expect(within(table.getByRole('row', { name: /F2/ })).getByText('정상')).toBeInTheDocument();
    expect(within(table.getByRole('row', { name: /F3/ })).getByText('확인 중')).toBeInTheDocument();
    expect(within(table.getByRole('row', { name: /F5/ })).getByText('측정 전')).toBeInTheDocument();
  });
  it('기존 지표와 이벤트 대기 건수로 네 가지 장애 대응을 보여 준다', async () => {
    await openOpsTab();
    const table = within(await screen.findByRole('table', { name: '장애 대응 시나리오' }));

    for (const value of ['대체 응답 중', '보내기 대기 1건', '중복 무시 3건', 'DLT 1건']) {
      expect(await table.findByText(value)).toBeInTheDocument();
    }
    expect(table.getAllByRole('row')).toHaveLength(5);
  });

  it('트러블 슈팅 여섯 줄과 해당 PR 링크를 보여 준다', async () => {
    await openOpsTab();
    const table = within(await screen.findByRole('table', { name: '트러블 슈팅 기록' }));

    expect(table.getAllByRole('row')).toHaveLength(7);
    expect(table.getByRole('link', { name: '#111' })).toHaveAttribute(
      'href',
      'https://github.com/LGCNS-AM06-Project2-TEAM5/hyeja-msa/pull/111',
    );
    expect(table.getByRole('link', { name: '#111' })).toHaveAttribute('target', '_blank');
    expect(table.getByRole('link', { name: '#111' })).toHaveAttribute('rel', 'noreferrer');
  });

  it('바로가기는 새 탭으로 열고 설정한 Prometheus 주소를 쓴다', async () => {
    await openOpsTab();
    for (const [name, href] of [
      ['Grafana 대시보드', 'http://localhost:3000/d/hyeja-msa'],
      ['Zipkin 추적', 'http://localhost:9411'],
      ['Eureka', 'http://localhost:8761'],
      ['GitHub Actions', 'https://github.com/LGCNS-AM06-Project2-TEAM5/hyeja-msa/actions'],
      ['Prometheus', 'http://monitoring.test'],
    ]) {
      const link = screen.getByRole('link', { name });
      expect(link).toHaveAttribute('href', href);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noreferrer');
    }
  });

  it('모니터링 주소가 비면 Prometheus 바로가기만 숨긴다', async () => {
    vi.stubEnv('VITE_PROMETHEUS_URL', '');
    await openOpsTab();

    expect(screen.queryByRole('link', { name: 'Prometheus' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Zipkin 추적' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Eureka' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'GitHub Actions' })).toBeInTheDocument();
  });
});
