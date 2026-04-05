import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import {
  createFarmerProfile,
  getFarmers,
  verifyFarmerCredentials,
} from '../../services/farmers'
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
const FARMER_CREDENTIAL_STATUS_OPTIONS = ['Verified', 'Pending', 'Rejected']

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

function createEmptyLinkFarmerFormState() {
  return {
    first_name: '',
    last_name: '',
    address: '',
    contact_number: '',
    farm_location: '',
    planting_season: '',
  }
}

function UserManagementPage() {
  const [searchParams] = useSearchParams()
  const { user: signedInUser } = useAuth()
  const [users, setUsers] = useState([])
  const [farmers, setFarmers] = useState([])
  const [roles, setRoles] = useState([])
  const [selectedRoleByUser, setSelectedRoleByUser] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [sortKey, setSortKey] = useState('joined_desc')
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingFarmers, setIsLoadingFarmers] = useState(true)
  const [isCreatingUser, setIsCreatingUser] = useState(false)
  const [editingUserId, setEditingUserId] = useState(null)
  const [editForm, setEditForm] = useState({ username: '', email: '' })
  const [resettingPasswordUserId, setResettingPasswordUserId] = useState(null)
  const [resetPasswordValue, setResetPasswordValue] = useState('')
  const [linkingFarmerUserId, setLinkingFarmerUserId] = useState(null)
  const [linkFarmerForm, setLinkFarmerForm] = useState(createEmptyLinkFarmerFormState)
  const [busyUserId, setBusyUserId] = useState(null)
  const [verifyingFarmerId, setVerifyingFarmerId] = useState(null)
  const [error, setError] = useState('')
  const [farmerVerificationError, setFarmerVerificationError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [shareableLinkMessage, setShareableLinkMessage] = useState('')
  const [recentActions, setRecentActions] = useState([])
  const [confirmDialog, setConfirmDialog] = useState(createClosedConfirmDialogState)
  const confirmResolverRef = useRef(null)
  const farmerVerificationSectionRef = useRef(null)
  const [createForm, setCreateForm] = useState({
    username: '',
    email: '',
    password: '',
    roleId: '',
    isActive: true,
  })
  const [farmerVerificationSearchTerm, setFarmerVerificationSearchTerm] =
    useState('')
  const [farmerVerificationStatusFilter, setFarmerVerificationStatusFilter] =
    useState('all')

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

  const activeUsersCount = useMemo(
    () => users.filter((item) => item.is_active).length,
    [users],
  )

  const inactiveUsersCount = useMemo(
    () => users.filter((item) => !item.is_active).length,
    [users],
  )

  const farmerUsersCount = useMemo(
    () => users.filter((item) => item.roles.includes('Farmer')).length,
    [users],
  )

  const unassignedUsersCount = useMemo(
    () => users.filter((item) => item.roles.length === 0).length,
    [users],
  )

  const filteredVerificationFarmers = useMemo(() => {
    const normalizedSearch = farmerVerificationSearchTerm.trim().toLowerCase()

    return farmers.filter((farmer) => {
      const matchesStatus =
        farmerVerificationStatusFilter === 'all'
          ? true
          : (farmer.credentials_status || '').toLowerCase() ===
            farmerVerificationStatusFilter

      if (!matchesStatus) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      return [
        `${farmer.last_name}, ${farmer.first_name}`,
        farmer.contact_number,
        farmer.farm_location,
        farmer.address,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedSearch))
    })
  }, [farmers, farmerVerificationSearchTerm, farmerVerificationStatusFilter])

  const pendingFarmerVerificationsCount = useMemo(
    () =>
      farmers.filter(
        (farmer) => (farmer.credentials_status || '').toLowerCase() === 'pending',
      ).length,
    [farmers],
  )

  const verifiedFarmerVerificationsCount = useMemo(
    () =>
      farmers.filter(
        (farmer) => (farmer.credentials_status || '').toLowerCase() === 'verified',
      ).length,
    [farmers],
  )

  const rejectedFarmerVerificationsCount = useMemo(
    () =>
      farmers.filter(
        (farmer) => (farmer.credentials_status || '').toLowerCase() === 'rejected',
      ).length,
    [farmers],
  )

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
    async function fetchFarmersForVerification() {
      try {
        setIsLoadingFarmers(true)
        const farmerList = await getFarmers()
        setFarmers(farmerList)
      } catch (requestError) {
        setFarmerVerificationError(
          requestError?.response?.data?.detail ||
            'Unable to load farmers for verification.',
        )
      } finally {
        setIsLoadingFarmers(false)
      }
    }

    fetchFarmersForVerification()
  }, [])

  useEffect(() => {
    const filterParam = (searchParams.get('filter') || '').trim().toLowerCase()
    const searchParam = (searchParams.get('search') || '').trim()
    const sortParam = (searchParams.get('sort') || '').trim().toLowerCase()
    const pageSizeParam = Number(searchParams.get('page_size'))
    const verificationStatusParam =
      (searchParams.get('verification_status') || '').trim().toLowerCase()
    const verificationSearchParam =
      (searchParams.get('verification_search') || '').trim()

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

    if (['pending', 'verified', 'rejected'].includes(verificationStatusParam)) {
      setFarmerVerificationStatusFilter(verificationStatusParam)
    } else {
      setFarmerVerificationStatusFilter('all')
    }

    setFarmerVerificationSearchTerm(verificationSearchParam)
  }, [searchParams])

  useEffect(() => {
    const hasVerificationContext =
      Boolean((searchParams.get('verification_status') || '').trim()) ||
      Boolean((searchParams.get('verification_search') || '').trim())

    if (!hasVerificationContext || !farmerVerificationSectionRef.current) {
      return
    }

    const frameId = window.requestAnimationFrame(() => {
      farmerVerificationSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })

    return () => window.cancelAnimationFrame(frameId)
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
    setLinkingFarmerUserId(null)
    setLinkFarmerForm(createEmptyLinkFarmerFormState())
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
    setLinkingFarmerUserId(null)
    setLinkFarmerForm(createEmptyLinkFarmerFormState())
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

  function startLinkFarmerProfile(targetUser) {
    setEditingUserId(null)
    setEditForm({ username: '', email: '' })
    setResettingPasswordUserId(null)
    setResetPasswordValue('')
    setError('')
    setSuccessMessage('')

    const usernameParts = (targetUser.username || '').split(/[._-]+/)
    const fallbackFirstName = usernameParts[0] || 'Farmer'
    const fallbackLastName = usernameParts[1] || 'User'

    setLinkingFarmerUserId(targetUser.id)
    setLinkFarmerForm({
      first_name: fallbackFirstName,
      last_name: fallbackLastName,
      address: '',
      contact_number: '',
      farm_location: '',
      planting_season: '',
    })
  }

  function cancelLinkFarmerProfile() {
    setLinkingFarmerUserId(null)
    setLinkFarmerForm(createEmptyLinkFarmerFormState())
  }

  function handleLinkFarmerInputChange(event) {
    const { name, value } = event.target
    setLinkFarmerForm((prev) => ({ ...prev, [name]: value }))
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

    if (!createForm.roleId) {
      setError('An initial role is required to create an active user account.')
      return
    }

    payload.role_id = Number(createForm.roleId)

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

  async function handleLinkFarmerProfile(targetUser) {
    const payload = {
      user: targetUser.id,
      first_name: linkFarmerForm.first_name.trim(),
      last_name: linkFarmerForm.last_name.trim(),
      address: linkFarmerForm.address.trim(),
      contact_number: linkFarmerForm.contact_number.trim(),
      farm_location: linkFarmerForm.farm_location.trim(),
      planting_season: linkFarmerForm.planting_season.trim(),
    }

    if (
      !payload.first_name ||
      !payload.last_name ||
      !payload.address ||
      !payload.contact_number ||
      !payload.farm_location ||
      !payload.planting_season
    ) {
      setError('Complete all farmer profile fields before linking.')
      return
    }

    try {
      setBusyUserId(targetUser.id)
      setError('')
      setSuccessMessage('')
      await createFarmerProfile(payload)

      setUsers((prev) =>
        prev.map((item) =>
          item.id === targetUser.id
            ? { ...item, has_farmer_profile: true }
            : item,
        ),
      )

      setLinkingFarmerUserId(null)
      setLinkFarmerForm(createEmptyLinkFarmerFormState())
      setSuccessMessage(`Linked farmer profile for ${targetUser.username}.`)
      addRecentAction('success', `Linked farmer profile for ${targetUser.username}.`)
    } catch (requestError) {
      const apiError = requestError?.response?.data
      const message =
        apiError?.user?.[0] ||
        apiError?.first_name?.[0] ||
        apiError?.last_name?.[0] ||
        apiError?.detail ||
        'Unable to link farmer profile for this user.'

      setError(message)
      addRecentAction(
        'error',
        `Failed to link farmer profile for ${targetUser.username}: ${message}`,
      )
    } finally {
      setBusyUserId(null)
    }
  }

  async function handleFarmerCredentialStatusChange(farmer, nextStatus) {
    try {
      setVerifyingFarmerId(farmer.id)
      setFarmerVerificationError('')
      const result = await verifyFarmerCredentials(farmer.id, {
        credentials_status: nextStatus,
      })

      setFarmers((prev) =>
        prev.map((item) =>
          item.id === farmer.id ? { ...item, ...result.profile } : item,
        ),
      )

      setSuccessMessage(
        `Updated credentials status for ${farmer.last_name}, ${farmer.first_name}.`,
      )
      addRecentAction(
        'success',
        `Updated farmer credentials for ${farmer.last_name}, ${farmer.first_name} to ${nextStatus}.`,
      )
    } catch (requestError) {
      const message =
        requestError?.response?.data?.detail ||
        'Failed to update farmer credentials status.'
      setFarmerVerificationError(message)
      addRecentAction(
        'error',
        `Failed farmer verification update for ${farmer.last_name}, ${farmer.first_name}: ${message}`,
      )
    } finally {
      setVerifyingFarmerId(null)
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

    if (farmerVerificationStatusFilter !== 'all') {
      params.set('verification_status', farmerVerificationStatusFilter)
    }

    if (farmerVerificationSearchTerm.trim()) {
      params.set('verification_search', farmerVerificationSearchTerm.trim())
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
    <section className="page-shell">
      <div className="page-hero">
        <div>
          <p className="eyebrow">Admin Access Desk</p>
          <h3 className="page-title">User Management</h3>
          <p className="page-subtitle">
            Manage platform users, assign roles, and activate or disable accounts.
          </p>
        </div>
      </div>

      <article className="panel page-card page-card--elevated">

      {error ? <p className="error-text">{error}</p> : null}
      {successMessage ? <p className="success-text">{successMessage}</p> : null}

      <div className="dashboard-grid top-gap">
        <article className="metric-card">
          <p className="metric-card__title">Total Users</p>
          <p className="metric-card__value">{users.length}</p>
          <p className="metric-card__hint">Registered accounts in the platform</p>
        </article>
        <article className="metric-card">
          <p className="metric-card__title">Active Accounts</p>
          <p className="metric-card__value">{activeUsersCount}</p>
          <p className="metric-card__hint">
            {inactiveUsersCount} inactive account(s)
          </p>
        </article>
        <article className="metric-card">
          <p className="metric-card__title">Farmer Users</p>
          <p className="metric-card__value">{farmerUsersCount}</p>
          <p className="metric-card__hint">
            {unassignedUsersCount} user(s) without any role
          </p>
        </article>
      </div>

      <div className="timeline-block top-gap" ref={farmerVerificationSectionRef}>
        <div className="section-head">
          <h4>Farmer Verification</h4>
          <span className="section-chip">Credential Review</span>
        </div>

        <div className="dashboard-grid">
          <article className="metric-card">
            <p className="metric-card__title">Awaiting Review</p>
            <p className="metric-card__value">{pendingFarmerVerificationsCount}</p>
            <p className="metric-card__hint">Pending verification queue</p>
          </article>
          <article className="metric-card">
            <p className="metric-card__title">Verified Farmers</p>
            <p className="metric-card__value">{verifiedFarmerVerificationsCount}</p>
            <p className="metric-card__hint">Approved credentials</p>
          </article>
          <article className="metric-card">
            <p className="metric-card__title">Rejected Records</p>
            <p className="metric-card__value">{rejectedFarmerVerificationsCount}</p>
            <p className="metric-card__hint">Needs follow-up remediation</p>
          </article>
        </div>

        <div className="toolbar-row top-gap">
          <label htmlFor="admin-verification-status-filter">Status Filter</label>
          <select
            id="admin-verification-status-filter"
            value={farmerVerificationStatusFilter}
            onChange={(event) => setFarmerVerificationStatusFilter(event.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>

          <label htmlFor="admin-verification-search">Search</label>
          <input
            id="admin-verification-search"
            type="search"
            value={farmerVerificationSearchTerm}
            onChange={(event) => setFarmerVerificationSearchTerm(event.target.value)}
            placeholder="Name, contact, location, or address"
          />
        </div>

        {farmerVerificationError ? (
          <p className="error-text">{farmerVerificationError}</p>
        ) : null}

        {isLoadingFarmers ? <p>Loading farmer records...</p> : null}

        {!isLoadingFarmers && filteredVerificationFarmers.length === 0 ? (
          <p>No farmers found for verification filters.</p>
        ) : null}

        {!isLoadingFarmers && filteredVerificationFarmers.length > 0 ? (
          <div className="data-table-wrap top-gap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Farmer</th>
                  <th>Contact</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Update</th>
                </tr>
              </thead>
              <tbody>
                {filteredVerificationFarmers.map((farmer) => (
                  <tr key={farmer.id}>
                    <td>{farmer.last_name}, {farmer.first_name}</td>
                    <td>{farmer.contact_number}</td>
                    <td>{farmer.farm_location}</td>
                    <td>
                      <span
                        className={`status-pill ${
                          farmer.credentials_status === 'Verified'
                            ? 'status-pill--active'
                            : farmer.credentials_status === 'Rejected'
                              ? 'status-pill--inactive'
                              : 'status-pill--warning'
                        }`}
                      >
                        {farmer.credentials_status}
                      </span>
                    </td>
                    <td>
                      <div className="inline-actions">
                        {FARMER_CREDENTIAL_STATUS_OPTIONS.map((status) => (
                          <button
                            key={status}
                            type="button"
                            className="ghost-button small"
                            onClick={() =>
                              handleFarmerCredentialStatusChange(farmer, status)
                            }
                            disabled={
                              farmer.credentials_status === status ||
                              verifyingFarmerId === farmer.id
                            }
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      <div className="timeline-block top-gap">
        <div className="section-head">
          <h4>Recent Admin Actions</h4>
          <span className="section-chip">Audit</span>
        </div>
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
        <div className="section-head">
          <h4>Create User</h4>
          <span className="section-chip">Onboarding</span>
        </div>
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
            <option value="">Select initial role</option>
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
          <div className="section-head">
            <h4>User Directory</h4>
            <span className="section-chip">RBAC</span>
          </div>
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
                const isLinkingFarmerProfile = linkingFarmerUserId === item.id
                const isAnotherRowBeingEdited =
                  editingUserId !== null && editingUserId !== item.id
                const isAnotherRowResettingPassword =
                  resettingPasswordUserId !== null &&
                  resettingPasswordUserId !== item.id
                const isAnotherRowLinkingFarmer =
                  linkingFarmerUserId !== null && linkingFarmerUserId !== item.id
                const actionDisabled = isBusy || isAnotherRowBeingEdited
                const rowLocked =
                  actionDisabled ||
                  isAnotherRowResettingPassword ||
                  isResettingPassword ||
                  isAnotherRowLinkingFarmer ||
                  isLinkingFarmerProfile
                const isSelf = signedInUser?.id === item.id
                const selectedRole = selectedRoleByUser[item.id] ?? ''
                const canLinkFarmerProfile =
                  item.roles.includes('Farmer') && !item.has_farmer_profile

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
                        {isLinkingFarmerProfile ? (
                          <>
                            <input
                              className="table-edit-input"
                              name="first_name"
                              value={linkFarmerForm.first_name}
                              onChange={handleLinkFarmerInputChange}
                              placeholder="First name"
                              disabled={isBusy}
                            />
                            <input
                              className="table-edit-input"
                              name="last_name"
                              value={linkFarmerForm.last_name}
                              onChange={handleLinkFarmerInputChange}
                              placeholder="Last name"
                              disabled={isBusy}
                            />
                            <input
                              className="table-edit-input"
                              name="contact_number"
                              value={linkFarmerForm.contact_number}
                              onChange={handleLinkFarmerInputChange}
                              placeholder="Contact number"
                              disabled={isBusy}
                            />
                            <input
                              className="table-edit-input"
                              name="farm_location"
                              value={linkFarmerForm.farm_location}
                              onChange={handleLinkFarmerInputChange}
                              placeholder="Farm location"
                              disabled={isBusy}
                            />
                            <input
                              className="table-edit-input"
                              name="planting_season"
                              value={linkFarmerForm.planting_season}
                              onChange={handleLinkFarmerInputChange}
                              placeholder="Planting season"
                              disabled={isBusy}
                            />
                            <input
                              className="table-edit-input"
                              name="address"
                              value={linkFarmerForm.address}
                              onChange={handleLinkFarmerInputChange}
                              placeholder="Address"
                              disabled={isBusy}
                            />
                            <button
                              type="button"
                              className="ghost-button small"
                              onClick={() => handleLinkFarmerProfile(item)}
                              disabled={isBusy}
                            >
                              Save Farmer Profile
                            </button>
                            <button
                              type="button"
                              className="ghost-button small"
                              onClick={cancelLinkFarmerProfile}
                              disabled={isBusy}
                            >
                              Cancel Link
                            </button>
                          </>
                        ) : null}
                        {!isLinkingFarmerProfile && canLinkFarmerProfile ? (
                          <button
                            type="button"
                            className="ghost-button small"
                            onClick={() => startLinkFarmerProfile(item)}
                            disabled={rowLocked || isEditing || isResettingPassword}
                          >
                            Link Farmer Profile
                          </button>
                        ) : null}
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
      </article>
    </section>
  )
}

export default UserManagementPage
