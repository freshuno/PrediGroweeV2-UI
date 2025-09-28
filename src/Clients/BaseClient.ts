import axios, { AxiosInstance } from 'axios';
import useRouterPush from '@/components/useRouterPush';
import applyCaseMiddleware from 'axios-case-converter';
import { AUTH_SERVICE_URL } from '@/Envs';
import { toast } from 'react-toastify';

class BaseClient {
  protected axiosInstance: AxiosInstance;
  constructor(baseUrl: string) {
    this.axiosInstance = applyCaseMiddleware(
      axios.create({
        baseURL: baseUrl,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    );
    this.axiosInstance.interceptors.request.use((config) => {
      const token = sessionStorage.getItem('accessToken');
      if (token) {
        config.headers['Authorization'] = 'Bearer ' + token;
      }
      return config;
    });
    this.axiosInstance.interceptors.response.use(
      (response) => {
        if (
          ['POST', 'PATCH', 'PUT', 'DELETE'].includes(
            response.config.method?.toUpperCase() ?? ''
          ) &&
          response.status < 300 &&
          response.status >= 200 &&
          response.config.baseURL?.includes('/admin')
        ) {
          toast.success('Operation successful');
        }
        return response;
      },
      async (error) => {
        if (
          ['POST', 'PATCH', 'PUT', 'DELETE'].includes(
            error.response.config.method?.toUpperCase() ?? ''
          ) &&
          error.response.config.baseURL?.includes('/admin')
        ) {
          toast.error(error.response?.data?.message || 'Operation failed');
        }
        const originalRequest = error.config;
        if (['login', 'register'].some((path) => originalRequest.url?.includes(path))) {
          toast.error(error.response?.data || 'Operation failed');
        }
        if (
          error.response.status === 401 &&
          !originalRequest._retry &&
          !['login', 'register'].some((path) => originalRequest.url?.includes(path))
        ) {
          originalRequest._retry = true;
          try {
            const response = await axios.post(
              AUTH_SERVICE_URL + '/refresh',
              {},
              { withCredentials: true }
            );

            const { access_token } = response.data;
            sessionStorage.setItem('accessToken', access_token);
            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            console.log('Token refresh failed:');
            localStorage.removeItem('accessToken');
            await useRouterPush('/login');
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );
  }
  async refreshToken() {
    return this.axiosInstance.post('/refresh', {}, { withCredentials: true });
  }
}
export default BaseClient;
