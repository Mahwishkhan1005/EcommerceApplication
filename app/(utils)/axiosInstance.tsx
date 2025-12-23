import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';
 


const getToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem("AccessToken");
    console.log('Token from AsyncStorage:', token ? 'Token exists' : 'No token');
    return token;
  } catch (error) {
    console.error("Error getting token:", error);
    return null;
  }
};

const createAxiosInstance = (baseURL: string): AxiosInstance => {
  const instance: AxiosInstance = axios.create({
    baseURL: baseURL,
    timeout: 10000,  
    headers: {
      'Content-Type': 'application/json',
    },
  });

  instance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
      const token: string | null = await getToken();
      console.log('Retrieved token:', token ? 'Token exists' : 'No token');
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Added Authorization header');
      }
      return config;
    },
    (error: AxiosError): Promise<AxiosError> => Promise.reject(error)
  );

  return instance;
};

export const rootApi: AxiosInstance = createAxiosInstance("http://192.168.0.200:8083");
export const adressApi: AxiosInstance = createAxiosInstance("http://192.168.0.200:8083");
export const cartApi:AxiosInstance=createAxiosInstance("http://192.168.0.200:8082");
export const payApi:AxiosInstance=createAxiosInstance("http://192.168.0.186:8082");
