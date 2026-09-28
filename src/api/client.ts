import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL?.trim(),
  timeout: 10_000,
})

apiClient.interceptors.request.use((config) => {
  if (!config.baseURL) {
    throw new Error('Задайте VITE_API_BASE_URL для MockAPI.io у .env.local перед виконанням API-запитів.')
  }

  return config
})
