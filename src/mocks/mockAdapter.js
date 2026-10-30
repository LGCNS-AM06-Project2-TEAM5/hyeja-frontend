import { findHandler, findUserByToken } from '@/mocks/handlers';

const RESPONSE_DELAY = 250;

const delay = (milliseconds) =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

const parseBody = (data) => {
  if (!data) {
    return {};
  }

  try {
    return typeof data === 'string' ? JSON.parse(data) : data;
  } catch {
    return {};
  }
};

const toAxiosError = (config, response) => {
  const error = new Error(response.data?.message ?? '요청을 처리하지 못했어요');

  error.isAxiosError = true;
  error.config = config;
  error.response = { ...response, config, headers: {} };

  return error;
};

/** axios 어댑터 규격에 맞춰, 실제 요청 대신 목 핸들러를 실행한다. */
export const mockAdapter = async (config) => {
  await delay(RESPONSE_DELAY);

  const method = (config.method ?? 'get').toLowerCase();
  const url = (config.url ?? '').split('?')[0];
  const handler = findHandler(method, url);

  if (!handler) {
    throw toAxiosError(config, {
      status: 404,
      statusText: 'Not Found',
      data: { message: `목 서버에 없는 경로예요: ${method.toUpperCase()} ${url}` },
    });
  }

  const authorization = config.headers?.Authorization ?? config.headers?.authorization;
  const result = handler.handle({
    url,
    params: config.params ?? {},
    body: parseBody(config.data),
    authorization,
    user: findUserByToken(authorization),
  });

  if (result.status >= 400) {
    throw toAxiosError(config, { ...result, statusText: 'Error' });
  }

  return {
    data: result.data,
    status: result.status,
    statusText: 'OK',
    headers: {},
    config,
  };
};
