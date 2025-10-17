import BaseClient from '@/Clients/BaseClient';

type StartQuizBody = {
  mode: string;
  screenWidth: number;
  screenHeight: number;
  test_code?: string;
  testCode?: string;
};

type HeaderMap = { [key: string]: string | string[] | undefined };

class QuizClient extends BaseClient {
  constructor(baseUrl: string) {
    super(baseUrl);
    this.axiosInstance.interceptors.request.use((config) => {
      const token = sessionStorage.getItem('accessToken');
      if (token) {
        config.headers['Authorization'] = token;
      }
      return config;
    });
  }

  async getUserQuizSessions() {
    const res = await this.axiosInstance.get('/sessions');
    return res.data;
  }

  async startQuiz(mode: string, screenWidth: number, screenHeight: number, testCode?: string) {
    const body: StartQuizBody = { mode, screenWidth, screenHeight };
    if (testCode && testCode.trim() !== '') {
      const code = testCode.trim();
      body.test_code = code;
      body.testCode = code;
    }
    const res = await this.axiosInstance.post('/sessions/new', body);
    return res.data;
  }

  async getQuestion(questionId: string) {
    const res = await this.axiosInstance.get(`/q/${questionId}`);
    return res.data;
  }

  async getNextQuestion(sessionId: string) {
    const res = await this.axiosInstance.get(`/sessions/${sessionId}/nextQuestion`);
    if (res.status === 204) return null;

    const headers = res.headers as unknown as HeaderMap;
    const raw = headers?.['x-quiz-is-last'] ?? headers?.['X-Quiz-Is-Last'];
    const value = Array.isArray(raw) ? raw[0] : raw;
    const isLastFromHeader = String(value ?? '').toLowerCase() === 'true';

    const data: unknown = res.data ?? {};
    let payloadObj: Record<string, unknown> = {};
    let isLastFromBody = false;

    if (data && typeof data === 'object' && 'question' in (data as Record<string, unknown>)) {
      const env = data as { question: unknown; is_last?: boolean; isLast?: boolean };
      if (env.question && typeof env.question === 'object') {
        payloadObj = env.question as Record<string, unknown>;
      }
      isLastFromBody = Boolean(env.is_last ?? env.isLast);
    } else if (data && typeof data === 'object') {
      payloadObj = data as Record<string, unknown>;
    }

    const isLast = isLastFromHeader || isLastFromBody;

    return { ...payloadObj, __isLast: isLast };
  }

  async submitAnswer(sessionId: string, answer: string, screenWidth: number, screenHeight: number) {
    const res = await this.axiosInstance.post(`/sessions/${sessionId}/answer`, {
      answer,
      screen_size: screenWidth + 'x' + screenHeight,
    });
    return res.data;
  }

  async finishQuiz(sessionId: string) {
    const res = await this.axiosInstance.post(`/sessions/${sessionId}/finish`);
    return res.data;
  }

  async getAllParameters() {
    const res = await this.axiosInstance.get('/parameters');
    return res.data;
  }
}

export default QuizClient;
