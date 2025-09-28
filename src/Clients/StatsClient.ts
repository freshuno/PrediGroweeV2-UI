import BaseClient from '@/Clients/BaseClient';
import { UserSurvey } from '@/types';
import { AxiosError } from 'axios';

class StatsClient extends BaseClient {
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
  async getUserStats() {
    try {
      const res = await this.axiosInstance.get('/userStats');
      return res.data;
    } catch (err) {
      throw new Error("Couldn't get stats: " + err);
    }
  }
  async getQuizResults(sessionId: string) {
    try {
      const res = await this.axiosInstance.get(`/quiz/${sessionId}`);
      return res.data;
    } catch (err) {
      throw new Error("Couldn't get quiz results: " + err);
    }
  }

  async saveUserSurveyAnswers(answers: UserSurvey) {
    try {
      await this.axiosInstance.post('/survey', answers);
    } catch (err) {
      const axiosError = err as AxiosError; // Explicitly cast to AxiosError

      if (axiosError.response?.status === 409) {
        throw new Error('A conflict occurred: Survey answers already exist.');
      } else {
        throw new Error('An error occurred while saving survey answers.');
      }
    }
  }
  async getSessionsStats() {
    try {
      const res = await this.axiosInstance.get('/sessions');
      return res.data;
    } catch (err) {
      throw new Error("Couldn't get sessions stats: " + err);
    }
  }
  async deleteResponse(id: string) {
    try {
      await this.axiosInstance.delete('/responses/' + id);
    } catch (err) {
      throw new Error("Couldn't delete response" + err);
    }
  }
  async getSurveyResponse(): Promise<UserSurvey> {
    try {
      const res = await this.axiosInstance.get('/survey');
      return res.data;
    } catch (err) {
      throw new Error("Couldn't get survey response: " + err);
    }
  }
}
export default StatsClient;
