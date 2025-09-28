import BaseClient from '@/Clients/BaseClient';

class ImagesClient extends BaseClient {
  constructor(baseUrl: string) {
    super(baseUrl);
  }

  async getParamImage(paramId: number): Promise<Blob> {
    try {
      const res = await this.axiosInstance.get(`/params/${paramId}`, {
        responseType: 'blob',
      });
      return res.data;
    } catch (err) {
      throw new Error(`Couldn't get image for param ${paramId}: ${err}`);
    }
  }

  async uploadParamImage(paramId: number, image: File): Promise<void> {
    try {
      const formData = new FormData();
      formData.append('image', image);

      await this.axiosInstance.post(`/params/${paramId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } catch (err) {
      throw new Error(`Couldn't upload image for param ${paramId}: ${err}`);
    }
  }
}

export default ImagesClient;
