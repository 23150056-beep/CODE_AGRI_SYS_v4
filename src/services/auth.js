import apiClient from './apiClient'

export async function loginWithCredentials(payload) {
  const response = await apiClient.post('/auth/login/', payload)
  return response.data
}

export async function meRequest(accessToken) {
  const response = await apiClient.get('/auth/me/', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  return response.data
}
