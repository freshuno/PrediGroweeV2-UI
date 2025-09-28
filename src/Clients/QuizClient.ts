import BaseClient from '@/Clients/BaseClient';

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
    try {
      const res = await this.axiosInstance.get('/sessions');
      return res.data;
    } catch (err) {
      throw new Error("Couldn't get quiz sessions: " + err);
    }
  }
  async startQuiz(mode: string, screenWidth: number, screenHeight: number) {
    try {
      const res = await this.axiosInstance.post('/sessions/new', {
        mode,
        screenWidth,
        screenHeight,
      });
      return res.data;
    } catch (err) {
      throw new Error("Couldn't start quiz: " + err);
    }
  }
  async getQuestion(questionId: string) {
    try {
      const res = await this.axiosInstance.get(`/q/${questionId}`);
      return res.data;
    } catch (err) {
      throw new Error("Couldn't get question: " + err);
    }
  }
  async getNextQuestion(sessionId: string) {
    try {
      const res = await this.axiosInstance.get(`/sessions/${sessionId}/nextQuestion`);
      if (res.status === 204) {
        return null;
      }
      return res.data;
    } catch (err) {
      throw new Error("Couldn't get next question" + err);
    }
  }

  async submitAnswer(sessionId: string, answer: string, screenWidth: number, screenHeight: number) {
    try {
      const res = await this.axiosInstance.post(`/sessions/${sessionId}/answer`, {
        answer,
        screen_size: screenWidth + 'x' + screenHeight,
      });
      return res.data;
    } catch (err) {
      throw new Error("Couldn't submit answer: " + err);
    }
  }
  async finishQuiz(sessionId: string) {
    try {
      const res = await this.axiosInstance.post(`/sessions/${sessionId}/finish`);
      return res.data;
    } catch (err) {
      throw new Error("Couldn't finish quiz: " + err);
    }
  }
  async getAllParameters() {
    try {
      const res = await this.axiosInstance.get('/parameters');
      return res.data;
    } catch (err) {
      throw new Error("Couldn't get parameters: " + err);
    }
  }
}
export default QuizClient;
