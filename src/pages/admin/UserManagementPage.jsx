import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import useAuth from '../../hooks/useAuth'
import {
  assignUserRole,
  createUser,
  getRoles,
  getUsers,
  removeUserRole,
  resetUserPassword,
  updateUser,
} from '../../services/users'

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50]
const SORT_OPTIONS = [
  'joined_desc',
  'joined_asc',
  'username_asc',
  'username_desc',
]

function createClosedConfirmDialogState() {
  return {
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    isDestructive: false,
  }
}

function UserManagementPage() {
  const [searchParams] = useSearchParams()
  const { user: signedInUser } = useAuth()
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [selectedRoleByUser, setSelectedRoleByUser] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [sortKey, setSortKey] = useState('joined_desc')
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingUser, setIsCreatingUser] = useState(false)
  const [editingUserId, setEditingUserId] = useState(null)
  const [editForm, setEditForm] = useState({ username: '', email: '' })
  const [resettingPasswordUserId, setResettingPasswordUserId] = useState(null)
  const [resetPasswordValue, setResetPasswordValue] = useState('')
  const [busyUserId, setBusyUserId] = useState(null)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [shareableLinkMessage, setShareableLinkMessage] = useState('')
  const [recentActions, setRecentActions] = useState([])
  const [confirmDialog, setConfirmDialog] = useState(createClosedConfirmDialogState)
  const confirmResolverRef = useRef(null)
  const [createForm, setCreateForm] = useState({
    username: '',
    email: '',
    password: '',
    roleId: '',
    isActive: true,
  })

  const roleIdByName = useMemo(() => {
    return Object.fromEntries(roles.map((role) => [role.name, role.id]))
  }, [roles])

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return users.filter((item) => {
      const matchesRole =
        roleFilter === 'all'
          ? true
          : roleFilter === 'unassigned'
            ? item.roles.length === 0
            : item.roles.some((roleName) => roleName.toLowerCase() === roleFilter)

      if (!matchesRole) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      return [item.username, item.email]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedSearch))
    })
  }, [users, roleFilter, searchTerm])

  const sortedUsers = useMemo(() => {
    const list = [...filteredUsers]

    list.sort((left, right) => {
      if (sortKey === 'username_asc') {
        return left.username.localeCompare(right.username)
      }

      if (sortKey === 'username_desc') {
        return right.username.localeCompare(left.username)
      }

      if (sortKey === 'joined_asc') {
        return new Date(left.date_joined) - new Date(right.date_joined)
      }

      return new Date(right.date_joined) - new Date(left.date_joined)
    })

    return list
  }, [filteredUsers, sortKey])

  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / pageSize))

  const pagedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedUsers.slice(start, start + pageSize)
  }, [currentPage, pageSize, sortedUsers])

  const pageStart = sortedUsers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const pageEnd = Math.min(currentPage * pageSize, sortedUsers.length)

  useEffect(() => {
    async function fetchUsersAndRoles() {
      try {
        setIsLoading(true)
        const [userList, roleList] = await Promise.all([getUsers(), getRoles()])
        setUsers(userList)
        setRoles(roleList)
      } catch (requestError) {
        setError(
          requestError?.response?.data?.detail ||
            'Unable to load users and roles.',
        )
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsersAndRoles()
  }, [])

  useEffect(() => {
    const filterParam = (searchParams.get('filter') || '').trim().toLowerCase()
    const searchParam = (searchParams.get('search') || '').trim()
    const sortParam = (searchParams.get('sort') || '').trim().toLowerCase()
    const pageSizeParam = Number(searchParams.get('page_size'))

    if (filterParam) {
      setRoleFilter(filterParam)
    } else {
      setRoleFilter('all')
    }

    setSearchTerm(searchParam)

    if (SORT_OPTIONS.includes(sortParam)) {
      setSortKey(sortParam)
    } else {
      setSortKey('joined_desc')
    }

    if (PAGE_SIZE_OPTIONS.includes(pageSizeParam)) {
      setPageSize(pageSizeParam)
    } else {
      setPageSize(10)
    }
  }, [searchParams])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, roleFilter, sortKey, pageSize])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  useEffect(
    () => () => {
      if (confirmResolverRef.current) {
        confirmResolverRef.current(false)
        confirmResolverRef.current = null
      }
    },
    [],
  )

  function requestConfirmation({
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    isDestructive = false,
  }) {
    return new Promise((resolve) => {
      confirmResolverRef.current = resolve
      setConfirmDialog({
        isOpen: true,
        title,
        message,
        confirmLabel,
        cancelLabel,
        isDestructive,
      })
    })
  }

  function resolveConfirmation(confirmed) {
    const resolver = confirmResolverRef.current
    confirmResolverRef.current = null
    setConfirmDialog(createClosedConfirmDialogState())

    if (resolver) {
      resolver(confirmed)
    }
  }

  function handleRoleSelection(userId, value) {
    setSelectedRoleByUser((prev) => ({ ...prev, [userId]: value }))
  }

  function handleCreateInputChange(event) {
    const { name, value, checked, type } = event.target
    setCreateForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  function startEditingUser(targetUser) {
    setEditingUserId(targetUser.id)
    setResettingPasswordUserId(null)
    setResetPasswordValue('')
    setEditForm({
      username: targetUser.username || '',
      email: targetUser.email || '',
    })
    setError('')
    setSuccessMessage('')
  }

  function cancelEditingUser() {
    setEditingUserId(null)
    setEditForm({ username: '', email: '' })
  }

  function startResetPassword(targetUser) {
    setEditingUserId(null)
    setEditForm({ username: '', email: '' })
    setResettingPasswordUserId(targetUser.id)
    setResetPasswordValue('')
    setError('')
    setSuccessMessage('')
  }

  function cancelResetPassword() {
    setResettingPasswordUserId(null)
    setResetPasswordValue('')
  }

  function handleEditInputChange(event) {
    const { name, value } = event.target
    setEditForm((prev) => ({ ...prev, [name]: value }))
  }

  function addRecentAction(status, message) {
    const entry = {
      id: `${Date.now()}-${Math.random()}`,
      status,
      message,
      createdAt: new Date().toISOString(),
    }

    setRecentActions((prev) => [entry, ...prev].slice(0, 12))
  }

  function formatActionTime(value) {
    return new Date(value).toLocaleString()
  }

  async function handleSaveUserDetails(targetUser) {
    const nextUsername = editForm.username.trim()
    const nextEmail = editForm.email.trim()

    if (!nextUsername) {
      setError('Username cannot be empty.')
      return
    }

    try {
      setBusyUserId(targetUser.id)
      setError('')
      setSuccessMessage('')

      const updated = await updateUser(targetUser.id, {
        username: nextUsername,
        email: nextEmail,
      })

      setUsers((prev) =>
        prev.map((item) => (item.id === targetUser.id ? updated : item)),
      )
      setEditingUserId(null)
      setEditForm({ username: '', email: '' })
      setSuccessMessage(`Updated details for ${updated.username}.`)
      addRecentAction('success', `Updated user details for ${updated.username}.`)
    } catch (requestError) {
      const apiError = requestError?.response?.data
      const message =
        apiError?.username?.[0] ||
        apiError?.email?.[0] ||
        apiError?.detail ||
        'Unable to update user details.'
      setError(message)
      addRecentAction('error', `Failed to update ${targetUser.username}: ${message}`)
    } finally {
      setBusyUserId(null)
    }
  }

  async function handleResetPassword(targetUser) {
    const nextPassword = resetPasswordValue.trim()

    if (nextPassword.length < 8) {
      setError('New password must be at least 8 characters.')
      return
    }

    const confirmed = await requestConfirmation({
      title: 'Reset Password',
      message: `Reset password for ${targetUser.username}? This action cannot be undone.`,
      confirmLabel: 'Reset Password',
      isDestructive: true,
    })

    if (!confirmed) {
      addRecentAction('info', `Canceled password reset for ${targetUser.username}.`)
      return
    }

    try {
      setBusyUserId(targetUser.id)
      setError('')
      setSuccessMessage('')
      await resetUserPassword(targetUser.id, nextPassword)
      setResettingPasswordUserId(null)
      setResetPasswordValue('')
      setSuccessMessage(`Password reset for ${targetUser.username}.`)
      addRecentAction('success', `Reset password for ${targetUser.username}.`)
    } catch (requestError) {
      const apiError = requestError?.response?.data
      const message =
        apiError?.new_password?.[0] ||
        apiError?.detail ||
        'Unable to reset password for this user.'
      setError(message)
      addRecentAction(
        'error',
        `Failed to reset password for ${targetUser.username}: ${message}`,
      )
    } finally {
      setBusyUserId(null)
    }
  }

  async function handleCreateUser(event) {
    event.preventDefault()

    const payload = {
      username: createForm.username.trim(),
      email: createForm.email.trim(),
      password: createForm.password,
      is_active: createForm.isActive,
    }

    if (!payload.username || !payload.password) {
      setError('Username and password are required to create a user.')
      return
    }

    if (createForm.roleId) {
      payload.role_id = Number(createForm.roleId)
    }

    try {
      setIsCreatingUser(true)
      setError('')
      setSuccessMessage('')
      const created = await createUser(payload)
      setUsers((prev) => [created, ...prev])
      setCreateForm((prev) => ({
        ...prev,
        username: '',
        email: '',
        password: '',
      }))
      setSuccessMessage(`Created user ${created.username} successfully.`)
      addRecentAction('success', `Created user ${created.username}.`)
    } catch (requestError) {
      const apiError = requestError?.response?.data
      const message =
        apiError?.username?.[0] ||
        apiError?.password?.[0] ||
        apiError?.email?.[0] ||
        apiError?.detail ||
        'Unable to create user.'
      setError(message)
      addRecentAction('error', `Failed to create user: ${message}`)
    } finally {
      setIsCreatingUser(false)
    }
  }

  async function handleAssignRole(targetUser) {
    const selectedRoleId = Number(selectedRoleByUser[targetUser.id])

    if (!selectedRoleId) {
      setError('Select a role before assigning.')
      return
    }

    try {
      setBusyUserId(targetUser.id)
      setError('')
      setSuccessMessage('')
      const updated = await assignUserRole(targetUser.id, selectedRoleId)
      setUsers((prev) =>
        prev.map((item) => (item.id === targetUser.id ? updated : item)),
      )
      setSelectedRoleByUser((prev) => ({ ...prev, [targetUser.id]: '' }))
      setSuccessMessage(`Assigned a new role to ${targetUser.username}.`)
      addRecentAction('success', `Assigned role to ${targetUser.username}.`)
    } catch (requestError) {
      const apiError = requestError?.response?.data
      const message =
        apiError?.role_id?.[0] ||
        apiError?.detail ||
        'Unable to assign role for this user.'
      setError(message)
      addRecentAction(
        'error',
        `Failed to assign role for ${targetUser.username}: ${message}`,
      )
    } finally {
      setBusyUserId(null)
    }
  }

  async function handleToggleActiveStatus(targetUser) {
    const actionLabel = targetUser.is_active ? 'deactivate' : 'activate'
    const confirmed = await requestConfirmation({
      title: `${actionLabel === 'deactivate' ? 'Deactivate' : 'Activate'} Account`,
      message: `Are you sure you want to ${actionLabel} ${targetUser.username}?`,
      confirmLabel: actionLabel === 'deactivate' ? 'Deactivate' : 'Activate',
      isDestructive: actionLabel === 'deactivate',
    })

    if (!confirmed) {
      addRecentAction(
        'info',
        `Canceled ${actionLabel} action for ${targetUser.username}.`,
      )
      return
    }

    try {
      setBusyUserId(targetUser.id)
      setError('')
      setSuccessMessage('')
      const updated = await updateUser(targetUser.id, {
        is_active: !targetUser.is_active,
      })
      setUsers((prev) =>
        prev.map((item) => (item.id === targetUser.id ? updated : item)),
      )
      setSuccessMessage(
        `${targetUser.username} is now ${
          updated.is_active ? 'active' : 'inactive'
        }.`,
      )
      addRecentAction(
        'success',
        `${updated.username} set to ${updated.is_active ? 'active' : 'inactive'}.`,
      )
    } catch (requestError) {
      const apiError = requestError?.response?.data
      const message =
        apiError?.is_active?.[0] ||
        apiError?.detail ||
        'Unable to update account status.'
      setError(message)
      addRecentAction(
        'error',
        `Failed to ${actionLabel} ${targetUser.username}: ${message}`,
      )
    } finally {
      setBusyUserId(null)
    }
  }

  async function handleRemoveRole(targetUser, roleName) {
    const roleId = roleIdByName[roleName]

    if (!roleId) {
      setError(`Unable to remove role ${roleName}.`)
      return
    }

    const confirmed = await requestConfirmation({
      title: 'Remove Role',
      message: `Remove ${roleName} role from ${targetUser.username}?`,
      confirmLabel: 'Remove Role',
      isDestructive: true,
    })

    if (!confirmed) {
      addRecentAction(
        'info',
        `Canceled role removal (${roleName}) for ${targetUser.username}.`,
      )
      return
    }

    try {
      setBusyUserId(targetUser.id)
      setError('')
      setSuccessMessage('')
      const updated = await removeUserRole(targetUser.id, roleId)
      setUsers((prev) =>
        prev.map((item) => (item.id === targetUser.id ? updated : item)),
      )
      setSuccessMessage(`Removed ${roleName} role from ${targetUser.username}.`)
      addRecentAction('success', `Removed ${roleName} from ${targetUser.username}.`)
    } catch (requestError) {
      const apiError = requestError?.response?.data
      const message = apiError?.detail || 'Unable to remove role for this user.'
      setError(message)
      addRecentAction(
        'error',
        `Failed to remove ${roleName} from ${targetUser.username}: ${message}`,
      )
    } finally {
      setBusyUserId(null)
    }
  }

  function buildShareableViewUrl() {
    const params = new URLSearchParams()

    if (roleFilter !== 'all') {
      params.set('filter', roleFilter)
    }

    if (searchTerm.trim()) {
      params.set('search', searchTerm.trim())
    }

    if (sortKey !== 'joined_desc') {
      params.set('sort', sortKey)
    }

    if (pageSize !== 10) {
      params.set('page_size', String(pageSize))
    }

    const query = params.toString()
    return `${window.location.origin}${window.location.pathname}${
      query ? `?${query}` : ''
    }`
  }

  async function handleCopyShareableView() {
    try {
      await navigator.clipboard.writeText(buildShareableViewUrl())
      setError('')
      setShareableLinkMessage('Shareable link copied to clipboard.')
    } catch {
      setShareableLinkMessage('')
      setError('Unable to copy shareable link. Please check clipboard permissions.')
    }
  }

  const shareableViewUrl = buildShareableViewUrl()

  return (
    <section className="panel">
      <h3>User Management</h3>
      <p>Manage platform users, assign roles, and activate or disable accounts.</p>

      {error ? <p className="error-text">{error}</p> : null}
      {successMessage ? <p className="success-text">{successMessage}</p> : null}

      <div className="timeline-block top-gap">
        <h4>Recent Admin Actions</h4>
        {recentActions.length === 0 ? (
          <p>No admin actions captured in this session yet.</p>
        ) : (
          <ul className="audit-list">
            {recentActions.map((entry) => (
              <li key={entry.id} className="audit-item">
                <p className="audit-item__meta">
                  <span className={`audit-badge audit-badge--${entry.status}`}>
                    {entry.status}
                  </span>
                  {formatActionTime(entry.createdAt)}
                </p>
                <p>{entry.message}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="timeline-block top-gap">
        <h4>Create User</h4>
        <form className="stacked-form" onSubmit={handleCreateUser}>
          <label htmlFor="create-username">Username</label>
          <input
            id="create-username"
            name="username"
            value={createForm.username}
            onChange={handleCreateInputChange}
            placeholder="Enter username"
          />

          <label htmlFor="create-email">Email</label>
          <input
            id="create-email"
            name="email"
            type="email"
            value={createForm.email}
            onChange={handleCreateInputChange}
            placeholder="Optional"
          />

          <label htmlFor="create-password">Password</label>
          <input
            id="create-password"
            name="password"
            type="password"
            value={createForm.password}
            onChange={handleCreateInputChange}
            placeholder="Minimum 8 characters"
          />

          <label htmlFor="create-role">Initial Role</label>
          <select
            id="create-role"
            name="roleId"
            value={createForm.roleId}
            onChange={handleCreateInputChange}
          >
            <option value="">No initial role</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>

          <label className="checkbox-row" htmlFor="create-is-active">
            <input
              id="create-is-active"
              name="isActive"
              type="checkbox"
              checked={createForm.isActive}
              onChange={handleCreateInputChange}
            />
            Active account
          </label>

          <button type="submit" className="primary-button" disabled={isCreatingUser}>
            {isCreatingUser ? 'Creating...' : 'Create User'}
          </button>
        </form>
      </div>

      <div className="toolbar-row top-gap">
        <label htmlFor="user-role-filter">Filter by role</label>
        <select
          id="user-role-filter"
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value)}
        >
          <option value="all">All roles</option>
          <option value="unassigned">No assigned role</option>
          {roles.map((role) => (
            <option key={role.id} value={role.name.toLowerCase()}>
              {role.name}
            </option>
          ))}
        </select>

        <label htmlFor="user-search">Search</label>
        <input
          id="user-search"
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search username or email"
        />

        <label htmlFor="user-sort">Sort</label>
        <select
          id="user-sort"
          value={sortKey}
          onChange={(event) => setSortKey(event.target.value)}
        >
          <option value="joined_desc">Newest joined</option>
          <option value="joined_asc">Oldest joined</option>
          <option value="username_asc">Username A-Z</option>
          <option value="username_desc">Username Z-A</option>
        </select>

        <label htmlFor="user-page-size">Rows</label>
        <select
          id="user-page-size"
          value={pageSize}
          onChange={(event) => setPageSize(Number(event.target.value))}
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="ghost-button small"
          onClick={handleCopyShareableView}
        >
          Copy Shareable View
        </button>
      </div>

      <div className="shareable-view-block">
        <label htmlFor="user-shareable-view-url">Shareable URL</label>
        <input
          id="user-shareable-view-url"
          className="shareable-url-preview"
          type="text"
          value={shareableViewUrl}
          readOnly
          onFocus={(event) => event.target.select()}
        />
      </div>

      {shareableLinkMessage ? (
        <p className="success-text">{shareableLinkMessage}</p>
      ) : null}

      {isLoading ? <p>Loading users...</p> : null}

      {!isLoading && filteredUsers.length === 0 ? (
        <p>No users match the current filters.</p>
      ) : null}

      {!isLoading && filteredUsers.length > 0 ? (
        <div className="data-table-wrap top-gap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Roles</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedUsers.map((item) => {
                const isBusy = busyUserId === item.id
                const isEditing = editingUserId === item.id
                const isResettingPassword = resettingPasswordUserId === item.id
                const isAnotherRowBeingEdited =
                  editingUserId !== null && editingUserId !== item.id
                const isAnotherRowResettingPassword =
                  resettingPasswordUserId !== null &&
                  resettingPasswordUserId !== item.id
                const actionDisabled = isBusy || isAnotherRowBeingEdited
                const rowLocked =
                  actionDisabled || isAnotherRowResettingPassword || isResettingPassword
                const isSelf = signedInUser?.id === item.id
                const selectedRole = selectedRoleByUser[item.id] ?? ''

                return (
                  <tr key={item.id}>
                    <td>
                      {isEditing ? (
                        <input
                          className="table-edit-input"
                          name="username"
                          value={editForm.username}
                          onChange={handleEditInputChange}
                          disabled={isBusy}
                        />
                      ) : (
                        item.username
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          className="table-edit-input"
                          name="email"
                          type="email"
                          value={editForm.email}
                          onChange={handleEditInputChange}
                          disabled={isBusy}
                        />
                      ) : (
                        item.email || 'No email'
                      )}
                    </td>
                    <td>{item.roles.length > 0 ? item.roles.join(', ') : 'No role'}</td>
                    <td>
                      <span
                        className={`status-pill ${
                          item.is_active ? 'status-pill--active' : 'status-pill--inactive'
                        }`}
                      >
                        {item.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{new Date(item.date_joined).toLocaleDateString()}</td>
                    <td>
                      <div className="inline-actions">
                        <select
                          value={selectedRole}
                          onChange={(event) =>
                            handleRoleSelection(item.id, event.target.value)
                          }
                          disabled={rowLocked || isEditing}
                        >
                          <option value="">Assign role</option>
                          {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="ghost-button small"
                          onClick={() => handleAssignRole(item)}
                          disabled={rowLocked || isEditing}
                        >
                          Assign
                        </button>
                        <button
                          type="button"
                          className="ghost-button small"
                          onClick={() => handleToggleActiveStatus(item)}
                          disabled={rowLocked || isSelf || isEditing}
                        >
                          {item.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              className="ghost-button small"
                              onClick={() => handleSaveUserDetails(item)}
                              disabled={isBusy}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              className="ghost-button small"
                              onClick={cancelEditingUser}
                              disabled={isBusy}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="ghost-button small"
                            onClick={() => startEditingUser(item)}
                            disabled={rowLocked}
                          >
                            Edit
                          </button>
                        )}
                        {isResettingPassword ? (
                          <>
                            <input
                              className="table-edit-input"
                              type="password"
                              value={resetPasswordValue}
                              onChange={(event) =>
                                setResetPasswordValue(event.target.value)
                              }
                              placeholder="New password"
                              disabled={isBusy}
                            />
                            <button
                              type="button"
                              className="ghost-button small"
                              onClick={() => handleResetPassword(item)}
                              disabled={isBusy}
                            >
                              Save Password
                            </button>
                            <button
                              type="button"
                              className="ghost-button small"
                              onClick={cancelResetPassword}
                              disabled={isBusy}
                            >
                              Cancel Password
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="ghost-button small"
                            onClick={() => startResetPassword(item)}
                            disabled={rowLocked}
                          >
                            Reset Password
                          </button>
                        )}
                        {item.roles.map((roleName) => (
                          <button
                            key={`${item.id}-${roleName}`}
                            type="button"
                            className="ghost-button small"
                            onClick={() => handleRemoveRole(item, roleName)}
                            disabled={
                              rowLocked ||
                              isEditing ||
                              (isSelf && roleName === 'Admin')
                            }
                          >
                            Remove {roleName}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <div className="pagination-row">
            <p className="pagination-meta">
              Showing {pageStart}-{pageEnd} of {sortedUsers.length} users
            </p>
            <div className="pagination-actions">
              <button
                type="button"
                className="ghost-button small"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="pagination-meta">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                className="ghost-button small"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        cancelLabel={confirmDialog.cancelLabel}
        isDestructive={confirmDialog.isDestructive}
        onConfirm={() => resolveConfirmation(true)}
        onCancel={() => resolveConfirmation(false)}
      />
    </section>
  )
}

export default UserManagementPage
