import axios from 'axios'
import { AUTH_STORAGE_KEY, AUTH_UPDATED_EVENT } from '../constants/auth'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
})

let refreshPromise = null

function readSession() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

function writeSession(session) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
  window.dispatchEvent(new Event(AUTH_UPDATED_EVENT))
}

function clearSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY)
  window.dispatchEvent(new Event(AUTH_UPDATED_EVENT))
}

apiClient.interceptors.request.use((config) => {
  const session = readSession()
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const statusCode = error.response?.status

    if (statusCode !== 401 || originalRequest?._retry) {
      return Promise.reject(error)
    }

    const session = readSession()
    if (!session?.refreshToken) {
      clearSession()
      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      if (!refreshPromise) {
        refreshPromise = axios
          .post(
            `${API_BASE_URL}/auth/refresh/`,
            { refresh: session.refreshToken },
            { timeout: 15000 },
          )
          .then((response) => response.data)
          .finally(() => {
            refreshPromise = null
          })
      }

      const refreshPayload = await refreshPromise
      const nextSession = {
        ...session,
        accessToken: refreshPayload.access,
        refreshToken: refreshPayload.refresh ?? session.refreshToken,
      }

      writeSession(nextSession)
      originalRequest.headers.Authorization = `Bearer ${nextSession.accessToken}`

      return apiClient(originalRequest)
    } catch (refreshError) {
      clearSession()
      return Promise.reject(refreshError)
    }
  },
)

export default apiClient
