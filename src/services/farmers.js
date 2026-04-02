import apiClient from './apiClient'

export async function getFarmers() {
  const response = await apiClient.get('/farmers/')
  return response.data
}

export async function updateFarmerProfile(farmerId, payload) {
  const response = await apiClient.patch(`/farmers/${farmerId}/`, payload)
  return response.data
}

export async function getFarmerApplications(farmerId) {
  const response = await apiClient.get(`/farmers/${farmerId}/applications/`)
  return response.data
}

export async function createFarmerApplication(farmerId, payload) {
  const response = await apiClient.post(`/farmers/${farmerId}/applications/`, payload)
  return response.data
}

export async function getInterventionApplications() {
  const response = await apiClient.get('/intervention-applications/')
  return response.data
}

export async function updateInterventionApplication(applicationId, payload) {
  const response = await apiClient.patch(
    `/intervention-applications/${applicationId}/`,
    payload,
  )
  return response.data
}

export async function verifyFarmerCredentials(farmerId, payload) {
  const response = await apiClient.post(
    `/farmers/${farmerId}/credentials/verify/`,
    payload,
  )
  return response.data
}
