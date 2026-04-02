import apiClient from './apiClient'

export async function getInventoryItems() {
  const response = await apiClient.get('/inventory/')
  return response.data
}
