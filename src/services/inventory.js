import apiClient from './apiClient'

export async function getInventoryItems() {
  const response = await apiClient.get('/inventory/')
  return response.data
}

export async function getInventoryCatalogItems() {
  const response = await apiClient.get('/inventory-catalog/')
  return response.data
}

export async function createInventoryCatalogItem(payload) {
  const response = await apiClient.post('/inventory-catalog/', payload)
  return response.data
}

export async function updateInventoryCatalogItem(catalogItemId, payload) {
  const response = await apiClient.patch(`/inventory-catalog/${catalogItemId}/`, payload)
  return response.data
}

export async function getInventoryAlerts() {
  const response = await apiClient.get('/inventory/alerts/')
  return response.data
}
