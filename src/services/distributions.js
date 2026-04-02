import apiClient from './apiClient'

export async function getDistributions() {
  const response = await apiClient.get('/distributions/')
  return response.data
}

export async function getDistributionTimeline(distributionId) {
  const response = await apiClient.get(`/distributions/${distributionId}/timeline/`)
  return response.data
}

export async function createDistribution(payload) {
  const response = await apiClient.post('/distributions/', payload)
  return response.data
}

export async function releaseDistribution(distributionId) {
  const response = await apiClient.post(`/distributions/${distributionId}/release/`)
  return response.data
}

export async function bulkReleaseDistributions(distributionIds) {
  const response = await apiClient.post('/distributions/bulk-release/', {
    distribution_ids: distributionIds,
  })
  return response.data
}

export async function updateDistribution(distributionId, payload) {
  const response = await apiClient.patch(`/distributions/${distributionId}/`, payload)
  return response.data
}

export async function updateDeliveryStatus(distributionId, payload) {
  return updateDistribution(distributionId, payload)
}
