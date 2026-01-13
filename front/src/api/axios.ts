import axios, { type AxiosRequestConfig } from "axios";
import { useAuthStore } from '@/stores/auth';

// En production (Vercel), utiliser directement l'URL Railway (les rewrites Vercel ont des problèmes avec POST)
// En dev local, utiliser le proxy /api-prod vers Railway
export const BASE_URL = import.meta.env.PROD
  ? "https://ugc-production-9234.up.railway.app"
  : "/api-prod";

const axiosInstance = axios.create({ baseURL: BASE_URL });

// Intercepteur pour ajouter le token Authorization
axiosInstance.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState();
  if (token) {
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur de réponse pour gérer les 401
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

const axiosRequest = async <T>(config: AxiosRequestConfig): Promise<T> => {
  const { headers = {}, ...restConfig } = config;
  const authHeaders = { ContentType: `application/json` };
  return axiosInstance({
    headers: { ...headers, ...authHeaders },
    ...restConfig,
  }).then((response) => response.data);
};

export const axiosPost = <RequestBody, ResponseData>(
  url: string,
  body: RequestBody,
  timeout = 60000
): Promise<ResponseData> =>
  axiosRequest<ResponseData>({ method: "POST", url, data: body, timeout });

export const axiosGet = <_, ResponseData>(
  url: string,
  params: unknown,
  timeout = 60000
) => axiosRequest<ResponseData>({ method: "GET", url, params, timeout });

/**
 * Upload de fichiers avec FormData
 * Ne définit pas le Content-Type pour laisser axios gérer le multipart/form-data
 */
export const axiosUpload = <ResponseData>(
  url: string,
  formData: FormData,
  timeout = 120000
): Promise<ResponseData> => {
  const { token } = useAuthStore.getState();
  return axiosInstance({
    method: "POST",
    url,
    data: formData,
    timeout,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // Ne pas définir Content-Type, axios le fera automatiquement avec le boundary
    },
  }).then((response) => response.data);
};
