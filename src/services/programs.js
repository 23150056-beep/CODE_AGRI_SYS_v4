import apiClient from './apiClient'

export async function getPrograms() {
  const response = await apiClient.get('/programs/')
  return response.data
}

export async function createProgram(payload) {
  const response = await apiClient.post('/programs/', payload)
  return response.data
}

export async function updateProgram(programId, payload) {
  const response = await apiClient.patch(`/programs/${programId}/`, payload)
  return response.data
}

export async function deleteProgram(programId) {
  await apiClient.delete(`/programs/${programId}/`)
}

export async function getInterventions() {
  const response = await apiClient.get('/interventions/')
  return response.data
}

export async function createIntervention(payload) {
  const response = await apiClient.post('/interventions/', payload)
  return response.data
}

export async function updateIntervention(interventionId, payload) {
  const response = await apiClient.patch(`/interventions/${interventionId}/`, payload)
  return response.data
}

export async function deleteIntervention(interventionId) {
  await apiClient.delete(`/interventions/${interventionId}/`)
}
