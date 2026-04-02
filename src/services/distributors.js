import apiClient from './apiClient'

export async function getDistributors() {
  const response = await apiClient.get('/distributors/')
  return response.data
}
