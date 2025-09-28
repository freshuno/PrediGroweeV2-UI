import BaseClient from '@/Clients/BaseClient';
import { UserData } from '@/types';

class AuthClient extends BaseClient {
  constructor(baseUrl: string) {
    super(baseUrl);
  }
  async register(email: string, password: string) {
    try {
      console.log('registering...');
      const res = await this.axiosInstance.post(
        '/register',
        { email, password },
        { withCredentials: true }
      );
      return res.data;
    } catch (err) {
      throw new Error("Couldn't register: " + err);
    }
  }
  async login(email: string, password: string) {
    const res = await this.axiosInstance.post(
      '/login',
      { email, password },
      { withCredentials: true }
    );
    sessionStorage.setItem('accessToken', res.data.accessToken);
    return res.data;
  }
  async logout() {
    try {
      await this.axiosInstance.post(
        '/logout',
        {},
        {
          headers: { Authorization: sessionStorage.getItem('accessToken') },
          withCredentials: true,
        }
      );
      sessionStorage.removeItem('accessToken');
    } catch (err) {
      throw new Error("Couldn't logout: " + err);
    }
  }
  async resetPassword(email: string) {
    try {
      const res = await this.axiosInstance.post('/reset-password', { email });
      return res.data;
    } catch (err) {
      throw new Error("Couldn't reset password: " + err);
    }
  }

  async confirmPasswordReset(token: string, password: string) {
    return this.axiosInstance.post('/reset-password/confirm', { token, password });
  }
  async verifyResetToken(token: string) {
    return this.axiosInstance.get('/reset-password/verify', { params: { token } });
  }

  async checkSession() {
    try {
      const res = await this.axiosInstance.get('/verifySession', {
        withCredentials: true,
      });
      return res.data;
    } catch (err) {
      throw new Error("Couldn't check session: " + err);
    }
  }
  async getUser() {
    try {
      const res = await this.axiosInstance.get('/user');
      return res.data;
    } catch (err) {
      throw new Error("Couldn't get user: " + err);
    }
  }
  async updateUser(id: string | null, data: UserData) {
    try {
      const res = await this.axiosInstance.put('/users/' + id, data, {
        withCredentials: true,
      });
      return res.data;
    } catch (err) {
      throw new Error("Couldn't update user: " + err);
    }
  }

  async loginWithGoogle(access_token: string) {
    console.log('logging in with google...');

    try {
      const res = await this.axiosInstance.post(
        '/login/google',
        { access_token },
        { withCredentials: true }
      );
      sessionStorage.setItem('accessToken', res.data.accessToken);
      return res.data;
    } catch (err) {
      throw new Error("Couldn't login with Google: " + err);
    }
  }
}
export default AuthClient;
