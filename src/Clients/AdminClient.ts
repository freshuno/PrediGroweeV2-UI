import BaseClient from '@/Clients/BaseClient';
import {
  Parameter,
  QuestionData,
  QuestionOption,
  Settings,
  SurveyGroupedStats,
  UserData,
  UserSurvey,
} from '@/types';

class AdminClient extends BaseClient {
  constructor(baseUrl: string) {
    super(baseUrl);
  }

  async getAllUsers() {
    try {
      const res = await this.axiosInstance.get('/users');
      return res.data;
    } catch (err) {
      throw new Error("Couldn't fetch users: " + err);
    }
  }

  async getUserDetails(id: string) {
    try {
      const res = await this.axiosInstance.get('/users/' + id);
      return res.data;
    } catch (err) {
      throw new Error("Couldn't fetch user details: " + err);
    }
  }

  async updateUser(userId: string, updatedData: Partial<UserData>) {
    try {
      const res = await this.axiosInstance.patch(`/users/${userId}`, updatedData);
      return res.data;
    } catch (err) {
      throw new Error("Couldn't update user: " + err);
    }
  }

  async getAllQuestions() {
    try {
      const res = await this.axiosInstance.get('/questions');
      return res.data;
    } catch (err) {
      throw new Error("Couldn't fetch questions: " + err);
    }
  }
  async getQuestionById(questionId: string) {
    try {
      const res = await this.axiosInstance.get(`/questions/${questionId}`);
      return res.data;
    } catch (err) {
      throw new Error("Couldn't fetch question: " + err);
    }
  }

  async updateQuestion(questionId: string, updatedQuestion: QuestionData) {
    try {
      const res = await this.axiosInstance.patch(`/questions/${questionId}`, updatedQuestion);
      return res.data;
    } catch (err) {
      throw new Error("Couldn't update question: " + err);
    }
  }

  async getAllParameters() {
    try {
      const res = await this.axiosInstance.get('/parameters');
      return res.data;
    } catch (err) {
      throw new Error("Couldn't fetch parameters: " + err);
    }
  }

  async updateParameter(parameterId: string, updatedParam: Parameter) {
    try {
      const res = await this.axiosInstance.patch(`/parameters/${parameterId}`, updatedParam);
      return res.data;
    } catch (err) {
      throw new Error("Couldn't update parameter: " + err);
    }
  }

  async createParameter(newParam: Omit<Parameter, 'id'>): Promise<Parameter> {
    try {
      const res = await this.axiosInstance.post('/parameters', newParam);
      return res.data;
    } catch (err) {
      throw new Error("Couldn't create parameter: " + err);
    }
  }
  async updateParametersOrder(updatedParams: Parameter[]) {
    try {
      const res = await this.axiosInstance.put('/parameters/order', updatedParams);
      return res.data;
    } catch (err) {
      throw new Error("Couldn't update parameters order: " + err);
    }
  }

  async getAllOptions() {
    try {
      const res = await this.axiosInstance.get('/options');
      return res.data;
    } catch (err) {
      throw new Error("Couldn't fetch options: " + err);
    }
  }

  async updateOption(optionId: string, updatedOption: { option: string }) {
    try {
      const res = await this.axiosInstance.patch(`/options/${optionId}`, updatedOption);
      return res.data;
    } catch (err) {
      throw new Error("Couldn't update option: " + err);
    }
  }

  async createOption(newOption: Omit<QuestionOption, 'id'>) {
    try {
      const res = await this.axiosInstance.post('/options', newOption);
      return res.data;
    } catch (err) {
      throw new Error("Couldn't create option: " + err);
    }
  }
  async deleteOption(id: string) {
    try {
      const res = await this.axiosInstance.delete(`/options/${id}`);
      return res.data;
    } catch (err) {
      throw new Error("Couldn't delete option: " + err);
    }
  }

  async deleteUser(userId: string, withResponses?: boolean) {
    if (!withResponses) {
      withResponses = true;
    }
    try {
      const res = await this.axiosInstance.delete(
        `/users/${userId}?withResponses=${withResponses}`
      );
      return res.data;
    } catch (err) {
      throw new Error("Couldn't delete user: " + err);
    }
  }
  async getAllResponses() {
    try {
      const res = await this.axiosInstance.get('/responses');
      return res.data;
    } catch (err) {
      throw new Error("Couldn't fetch responses: " + err);
    }
  }

  async getQuestionStats(questionId: number) {
    try {
      const res = await this.axiosInstance.get('/stats/questions/' + questionId.toString());
      return res.data;
    } catch (err) {
      throw new Error("Couldn't fetch question stats: " + err);
    }
  }

  async getAllQuestionStats() {
    try {
      const res = await this.axiosInstance.get('/stats/questions');
      return res.data;
    } catch (err) {
      throw new Error("Couldn't fetch question stats: " + err);
    }
  }

  async getAllRoles() {
    try {
      const res = await this.axiosInstance.get('/roles');
      return res.data;
    } catch (err) {
      throw new Error("Couldn't fetch roles: " + err);
    }
  }

  async createRole(roleData: { userId: string; role: string }) {
    try {
      const res = await this.axiosInstance.post('/auth/roles', roleData);
      return res.data;
    } catch (err) {
      throw new Error("Couldn't create role: " + err);
    }
  }

  async updateRole(roleId: string, updatedData: { role: string }) {
    try {
      const res = await this.axiosInstance.put(`/auth/roles/${roleId}`, updatedData);
      return res.data;
    } catch (err) {
      throw new Error("Couldn't update role: " + err);
    }
  }

  async deleteRole(roleId: string) {
    try {
      const res = await this.axiosInstance.delete(`/auth/roles/${roleId}`);
      return res.data;
    } catch (err) {
      throw new Error("Couldn't delete role: " + err);
    }
  }

  async getAllActivity() {
    try {
      const res = await this.axiosInstance.get('/stats/activity');
      return res.data;
    } catch (err) {
      throw new Error("Couldn't fetch activity: " + err);
    }
  }

  async getDashboardSummary() {
    try {
      const res = await this.axiosInstance.get('/dashboard');
      return res.data;
    } catch (err) {
      throw new Error("Couldn't fetch dashboard summary: " + err);
    }
  }

  async getAllSurveyResponses(): Promise<UserSurvey[]> {
    try {
      const res = await this.axiosInstance.get('/users/-/surveys');
      return res.data;
    } catch (err) {
      throw new Error("Couldn't fetch survey responses data" + err);
    }
  }
  async getStatsGroupedBySurvey(groupBy: string): Promise<SurveyGroupedStats[]> {
    try {
      const res = await this.axiosInstance.get(`/stats/grouped?groupBy=${groupBy}`);
      return res.data;
    } catch (err) {
      throw new Error("Couldn't fetch grouped stats: " + err);
    }
  }
  async deleteResponse(id: string) {
    try {
      await this.axiosInstance.delete('responses/' + id);
    } catch (err) {
      throw new Error("Couldn't delete response" + err);
    }
  }
  async getAllUsersStats() {
    try {
      const res = await this.axiosInstance.get('/stats/users');
      return res.data;
    } catch (err) {
      throw new Error("Couldn't fetch users stats: " + err);
    }
  }
  async getSettings(): Promise<Settings[]> {
    try {
      const res = await this.axiosInstance.get('/settings');
      return res.data;
    } catch (err) {
      throw new Error("Couldn't fetch settings: " + err);
    }
  }

  async updateSettings(settings: Settings[]): Promise<void> {
    try {
      await this.axiosInstance.patch('/settings', settings);
    } catch (err) {
      throw new Error("Couldn't update settings: " + err);
    }
  }
}

export default AdminClient;
