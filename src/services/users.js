import apiClient from './apiClient'

export async function getUsers() {
  const response = await apiClient.get('/users/')
  return response.data
}

export async function getRoles() {
  const response = await apiClient.get('/roles/')
  return response.data
}

export async function assignUserRole(userId, roleId) {
  const response = await apiClient.post(`/users/${userId}/assign_role/`, {
    role_id: roleId,
  })
  return response.data
}

export async function removeUserRole(userId, roleId) {
  const response = await apiClient.post(`/users/${userId}/remove_role/`, {
    role_id: roleId,
  })
  return response.data
}

export async function updateUser(userId, payload) {
  const response = await apiClient.patch(`/users/${userId}/`, payload)
  return response.data
}

export async function createUser(payload) {
  const response = await apiClient.post('/users/', payload)
  return response.data
}

export async function resetUserPassword(userId, newPassword) {
  const response = await apiClient.post(`/users/${userId}/reset_password/`, {
    new_password: newPassword,
  })
  return response.data
}
