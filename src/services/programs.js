import apiClient from './apiClient'

function toQueryParams(options = {}) {
  const params = {}

  if (options.includeArchived) {
    params.include_archived = 'true'
  }

  return params
}

export async function getPrograms(options = {}) {
  const response = await apiClient.get('/programs/', {
    params: toQueryParams(options),
  })
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

export async function archiveProgram(programId) {
  await apiClient.delete(`/programs/${programId}/`)
}

export async function unarchiveProgram(programId) {
  const response = await apiClient.patch(`/programs/${programId}/`, {
    is_archived: false,
  })
  return response.data
}

export async function deleteProgram(programId) {
  await apiClient.delete(`/programs/${programId}/`)
}

export async function getInterventions(options = {}) {
  const response = await apiClient.get('/interventions/', {
    params: toQueryParams(options),
  })
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

export async function archiveIntervention(interventionId) {
  await apiClient.delete(`/interventions/${interventionId}/`)
}

export async function unarchiveIntervention(interventionId) {
  const response = await apiClient.patch(`/interventions/${interventionId}/`, {
    is_archived: false,
  })
  return response.data
}

export async function deleteIntervention(interventionId) {
  await apiClient.delete(`/interventions/${interventionId}/`)
}
