import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import {
  createIntervention,
  createProgram,
  deleteIntervention,
  deleteProgram,
  getInterventions,
  getPrograms,
  updateIntervention,
  updateProgram,
} from '../../services/programs'

function parseApiErrorDetails(error, fallbackMessage) {
  const payload = error?.response?.data

  if (!payload) {
    return {
      message: fallbackMessage,
      fieldErrors: {},
    }
  }

  if (typeof payload.detail === 'string') {
    return {
      message: payload.detail,
      fieldErrors: {},
    }
  }

  const fieldErrors = {}

  Object.entries(payload).forEach(([field, value]) => {
    if (Array.isArray(value) && value.length > 0) {
      fieldErrors[field] = String(value[0])
      return
    }

    if (typeof value === 'string') {
      fieldErrors[field] = value
    }
  })

  const firstFieldError = Object.values(fieldErrors)[0]

  return {
    message: firstFieldError || fallbackMessage,
    fieldErrors,
  }
}

function clearFieldError(setter, fieldName) {
  setter((prev) => {
    if (!prev[fieldName]) {
      return prev
    }

    const next = { ...prev }
    delete next[fieldName]
    return next
  })
}

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

function ProgramManagementPage() {
  const [searchParams] = useSearchParams()
  const interventionsSectionRef = useRef(null)
  const [programs, setPrograms] = useState([])
  const [interventions, setInterventions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingProgram, setIsCreatingProgram] = useState(false)
  const [isCreatingIntervention, setIsCreatingIntervention] = useState(false)
  const [isUpdatingProgram, setIsUpdatingProgram] = useState(false)
  const [isUpdatingIntervention, setIsUpdatingIntervention] = useState(false)
  const [deletingProgramIds, setDeletingProgramIds] = useState([])
  const [deletingInterventionIds, setDeletingInterventionIds] = useState([])
  const [editingProgramId, setEditingProgramId] = useState(null)
  const [editingInterventionId, setEditingInterventionId] = useState(null)
  const [selectedProgramFilter, setSelectedProgramFilter] = useState('all')
  const [interventionSearchTerm, setInterventionSearchTerm] = useState('')
  const [interventionSortKey, setInterventionSortKey] = useState('start_asc')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [shareableLinkMessage, setShareableLinkMessage] = useState('')
  const [programCreateSuccess, setProgramCreateSuccess] = useState('')
  const [interventionCreateSuccess, setInterventionCreateSuccess] = useState('')
  const [programEditSuccess, setProgramEditSuccess] = useState('')
  const [interventionEditSuccess, setInterventionEditSuccess] = useState('')
  const [programFieldErrors, setProgramFieldErrors] = useState({})
  const [interventionFieldErrors, setInterventionFieldErrors] = useState({})
  const [programEditFieldErrors, setProgramEditFieldErrors] = useState({})
  const [interventionEditFieldErrors, setInterventionEditFieldErrors] = useState({})
  const [confirmDialog, setConfirmDialog] = useState(createClosedConfirmDialogState)
  const confirmResolverRef = useRef(null)

  const [programForm, setProgramForm] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
  })

  const [interventionForm, setInterventionForm] = useState({
    program: '',
    name: '',
    description: '',
    start_date: '',
    end_date: '',
  })

  const [programEditForm, setProgramEditForm] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
  })

  const [interventionEditForm, setInterventionEditForm] = useState({
    program: '',
    name: '',
    description: '',
    start_date: '',
    end_date: '',
  })

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true)
        const [programData, interventionData] = await Promise.all([
          getPrograms(),
          getInterventions(),
        ])

        setPrograms(programData)
        setInterventions(interventionData)

        if (programData.length > 0) {
          setInterventionForm((prev) => ({
            ...prev,
            program: prev.program || String(programData[0].id),
          }))
        }
      } catch (requestError) {
        const parsed = parseApiErrorDetails(requestError, 'Unable to load programs.')
        setError(parsed.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const programNameById = useMemo(() => {
    const entries = programs.map((item) => [item.id, item.name])
    return Object.fromEntries(entries)
  }, [programs])

  const interventionCountByProgramId = useMemo(() => {
    const counts = {}

    interventions.forEach((item) => {
      counts[item.program] = (counts[item.program] || 0) + 1
    })

    return counts
  }, [interventions])

  const filteredInterventions = useMemo(() => {
    const normalizedSearch = interventionSearchTerm.trim().toLowerCase()

    const byProgram =
      selectedProgramFilter === 'all'
        ? interventions
        : interventions.filter((item) => String(item.program) === selectedProgramFilter)

    const bySearch = byProgram.filter((item) => {
      if (!normalizedSearch) {
        return true
      }

      const programName = programNameById[item.program] || ''

      return [item.name, item.description, programName]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedSearch))
    })

    return [...bySearch].sort((left, right) => {
      if (interventionSortKey === 'name_asc') {
        return left.name.localeCompare(right.name)
      }

      if (interventionSortKey === 'name_desc') {
        return right.name.localeCompare(left.name)
      }

      if (interventionSortKey === 'end_asc') {
        return new Date(left.end_date) - new Date(right.end_date)
      }

      if (interventionSortKey === 'end_desc') {
        return new Date(right.end_date) - new Date(left.end_date)
      }

      if (interventionSortKey === 'start_desc') {
        return new Date(right.start_date) - new Date(left.start_date)
      }

      return new Date(left.start_date) - new Date(right.start_date)
    })
  }, [
    interventionSearchTerm,
    interventionSortKey,
    interventions,
    programNameById,
    selectedProgramFilter,
  ])

  const editingProgram = useMemo(
    () => programs.find((item) => item.id === editingProgramId) || null,
    [programs, editingProgramId],
  )

  const editingIntervention = useMemo(
    () => interventions.find((item) => item.id === editingInterventionId) || null,
    [interventions, editingInterventionId],
  )

  const hasUnsavedProgramEditChanges = useMemo(() => {
    if (!editingProgram) {
      return false
    }

    return (
      programEditForm.name !== editingProgram.name ||
      programEditForm.description !== (editingProgram.description || '') ||
      programEditForm.start_date !== editingProgram.start_date ||
      programEditForm.end_date !== editingProgram.end_date
    )
  }, [editingProgram, programEditForm])

  const hasUnsavedInterventionEditChanges = useMemo(() => {
    if (!editingIntervention) {
      return false
    }

    return (
      interventionEditForm.program !== String(editingIntervention.program) ||
      interventionEditForm.name !== editingIntervention.name ||
      interventionEditForm.description !== (editingIntervention.description || '') ||
      interventionEditForm.start_date !== editingIntervention.start_date ||
      interventionEditForm.end_date !== editingIntervention.end_date
    )
  }, [editingIntervention, interventionEditForm])

  useEffect(() => {
    if (!hasUnsavedProgramEditChanges && !hasUnsavedInterventionEditChanges) {
      return undefined
    }

    function handleBeforeUnload(event) {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedProgramEditChanges, hasUnsavedInterventionEditChanges])

  useEffect(
    () => () => {
      if (confirmResolverRef.current) {
        confirmResolverRef.current(false)
        confirmResolverRef.current = null
      }
    },
    [],
  )

  useEffect(() => {
    const requestedProgramFilter = (searchParams.get('program') || '').trim()
    const requestedInterventionSearch =
      (searchParams.get('intervention_search') || '').trim()
    const requestedInterventionSort =
      (searchParams.get('intervention_sort') || '').trim().toLowerCase()

    if (!requestedProgramFilter) {
      setSelectedProgramFilter('all')
    } else if (requestedProgramFilter === 'all') {
      setSelectedProgramFilter('all')
    } else if (
      programs.some((item) => String(item.id) === requestedProgramFilter)
    ) {
      setSelectedProgramFilter(requestedProgramFilter)
    } else {
      setSelectedProgramFilter('all')
    }

    setInterventionSearchTerm(requestedInterventionSearch)

    if (
      [
        'start_asc',
        'start_desc',
        'end_asc',
        'end_desc',
        'name_asc',
        'name_desc',
      ].includes(requestedInterventionSort)
    ) {
      setInterventionSortKey(requestedInterventionSort)
    } else {
      setInterventionSortKey('start_asc')
    }
  }, [programs, searchParams])

  useEffect(() => {
    const requestedFocus = (searchParams.get('focus') || '').trim().toLowerCase()

    if (requestedFocus !== 'interventions' || isLoading) {
      return
    }

    interventionsSectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }, [isLoading, searchParams])

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

  function updateProgramForm(event) {
    const { name, value } = event.target
    clearFieldError(setProgramFieldErrors, name)
    setProgramForm((prev) => ({ ...prev, [name]: value }))
  }

  function updateInterventionForm(event) {
    const { name, value } = event.target
    clearFieldError(setInterventionFieldErrors, name)
    setInterventionForm((prev) => ({ ...prev, [name]: value }))
  }

  function updateProgramEditForm(event) {
    const { name, value } = event.target
    clearFieldError(setProgramEditFieldErrors, name)
    setProgramEditForm((prev) => ({ ...prev, [name]: value }))
  }

  function updateInterventionEditForm(event) {
    const { name, value } = event.target
    clearFieldError(setInterventionEditFieldErrors, name)
    setInterventionEditForm((prev) => ({ ...prev, [name]: value }))
  }

  function validateDates(startDate, endDate, contextLabel, setFieldErrors) {
    if (startDate && endDate && startDate > endDate) {
      setError(`${contextLabel}: start date cannot be later than end date.`)
      if (setFieldErrors) {
        setFieldErrors((prev) => ({
          ...prev,
          end_date: 'End date must be on or after start date.',
        }))
      }
      return false
    }

    return true
  }

  async function handleCreateProgram(event) {
    event.preventDefault()

    if (
      !validateDates(
        programForm.start_date,
        programForm.end_date,
        'Program',
        setProgramFieldErrors,
      )
    ) {
      return
    }

    try {
      setError('')
      setSuccessMessage('')
      setProgramCreateSuccess('')
      setProgramFieldErrors({})
      setIsCreatingProgram(true)

      const created = await createProgram(programForm)
      setPrograms((prev) => [created, ...prev])
      setProgramForm({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
      })

      setInterventionForm((prev) => ({
        ...prev,
        program: prev.program || String(created.id),
      }))

      setProgramCreateSuccess('Program created successfully.')
    } catch (requestError) {
      const parsed = parseApiErrorDetails(requestError, 'Unable to create program.')
      setError(parsed.message)
      setProgramFieldErrors(parsed.fieldErrors)
      setProgramCreateSuccess('')
    } finally {
      setIsCreatingProgram(false)
    }
  }

  async function handleCreateIntervention(event) {
    event.preventDefault()

    if (!interventionForm.program) {
      setError('Select a program before creating an intervention.')
      setInterventionFieldErrors((prev) => ({
        ...prev,
        program: 'Program is required.',
      }))
      return
    }

    if (
      !validateDates(
        interventionForm.start_date,
        interventionForm.end_date,
        'Intervention',
        setInterventionFieldErrors,
      )
    ) {
      return
    }

    try {
      setError('')
      setSuccessMessage('')
      setInterventionCreateSuccess('')
      setInterventionFieldErrors({})
      setIsCreatingIntervention(true)

      const created = await createIntervention({
        ...interventionForm,
        program: Number(interventionForm.program),
      })

      setInterventions((prev) => [created, ...prev])
      setInterventionForm((prev) => ({
        ...prev,
        name: '',
        description: '',
        start_date: '',
        end_date: '',
      }))

      setInterventionCreateSuccess('Intervention created successfully.')
    } catch (requestError) {
      const parsed = parseApiErrorDetails(
        requestError,
        'Unable to create intervention.',
      )
      setError(parsed.message)
      setInterventionFieldErrors(parsed.fieldErrors)
      setInterventionCreateSuccess('')
    } finally {
      setIsCreatingIntervention(false)
    }
  }

  async function handleDeleteProgram(programId) {
    const targetProgram = programs.find((item) => item.id === programId)
    const linkedInterventionCount = interventions.filter(
      (item) => item.program === programId,
    ).length

    const confirmationMessage = linkedInterventionCount
      ? `Delete program "${targetProgram?.name || programId}"? This will also delete ${linkedInterventionCount} linked intervention(s).`
      : `Delete program "${targetProgram?.name || programId}"?`

    const confirmed = await requestConfirmation({
      title: 'Delete Program',
      message: confirmationMessage,
      confirmLabel: 'Delete Program',
      isDestructive: true,
    })

    if (!confirmed) {
      return
    }

    try {
      setError('')
      setSuccessMessage('')
      setDeletingProgramIds((prev) => [...prev, programId])

      await deleteProgram(programId)
      const remainingPrograms = programs.filter((item) => item.id !== programId)
      const remainingInterventions = interventions.filter(
        (item) => item.program !== programId,
      )

      setPrograms(remainingPrograms)
      setInterventions(remainingInterventions)

      if (editingProgramId === programId) {
        setEditingProgramId(null)
      }

      if (
        editingInterventionId &&
        !remainingInterventions.some((item) => item.id === editingInterventionId)
      ) {
        setEditingInterventionId(null)
      }

      if (interventionForm.program === String(programId)) {
        setInterventionForm((prev) => ({
          ...prev,
          program: remainingPrograms[0] ? String(remainingPrograms[0].id) : '',
        }))
      }

      if (selectedProgramFilter === String(programId)) {
        setSelectedProgramFilter('all')
      }

      setSuccessMessage('Program deleted successfully.')
    } catch (requestError) {
      const parsed = parseApiErrorDetails(requestError, 'Unable to delete program.')
      setError(parsed.message)
    } finally {
      setDeletingProgramIds((prev) => prev.filter((id) => id !== programId))
    }
  }

  async function handleDeleteIntervention(interventionId) {
    const targetIntervention = interventions.find((item) => item.id === interventionId)
    const parentProgramName = programNameById[targetIntervention?.program]

    const confirmed = await requestConfirmation({
      title: 'Delete Intervention',
      message: `Delete intervention "${targetIntervention?.name || interventionId}"${
        parentProgramName ? ` under program "${parentProgramName}"` : ''
      }?`,
      confirmLabel: 'Delete Intervention',
      isDestructive: true,
    })

    if (!confirmed) {
      return
    }

    try {
      setError('')
      setSuccessMessage('')
      setDeletingInterventionIds((prev) => [...prev, interventionId])

      await deleteIntervention(interventionId)
      setInterventions((prev) => prev.filter((item) => item.id !== interventionId))

      if (editingInterventionId === interventionId) {
        setEditingInterventionId(null)
      }

      setSuccessMessage('Intervention deleted successfully.')
    } catch (requestError) {
      const parsed = parseApiErrorDetails(
        requestError,
        'Unable to delete intervention.',
      )
      setError(parsed.message)
    } finally {
      setDeletingInterventionIds((prev) => prev.filter((id) => id !== interventionId))
    }
  }

  function isDeletingProgram(programId) {
    return deletingProgramIds.includes(programId)
  }

  function isDeletingIntervention(interventionId) {
    return deletingInterventionIds.includes(interventionId)
  }

  function resetProgramEditState() {
    setEditingProgramId(null)
    setProgramEditSuccess('')
    setProgramEditFieldErrors({})
    setProgramEditForm({
      name: '',
      description: '',
      start_date: '',
      end_date: '',
    })
  }

  function resetInterventionEditState() {
    setEditingInterventionId(null)
    setInterventionEditSuccess('')
    setInterventionEditFieldErrors({})
    setInterventionEditForm({
      program: '',
      name: '',
      description: '',
      start_date: '',
      end_date: '',
    })
  }

  async function startEditingProgram(program) {
    if (
      editingProgramId !== null &&
      editingProgramId !== program.id &&
      hasUnsavedProgramEditChanges
    ) {
      const confirmed = await requestConfirmation({
        title: 'Discard Program Edits?',
        message: 'Discard unsaved program edits and switch to another program?',
        confirmLabel: 'Discard Changes',
        isDestructive: true,
      })

      if (!confirmed) {
        return
      }
    }

    setError('')
    setSuccessMessage('')
    setProgramEditSuccess('')
    setProgramEditFieldErrors({})
    setEditingProgramId(program.id)
    setProgramEditForm({
      name: program.name,
      description: program.description || '',
      start_date: program.start_date,
      end_date: program.end_date,
    })
  }

  async function cancelEditingProgram() {
    if (hasUnsavedProgramEditChanges) {
      const confirmed = await requestConfirmation({
        title: 'Discard Program Edits?',
        message: 'Discard unsaved program changes?',
        confirmLabel: 'Discard Changes',
        isDestructive: true,
      })

      if (!confirmed) {
        return
      }
    }

    resetProgramEditState()
  }

  async function handleUpdateProgram(event) {
    event.preventDefault()

    if (!editingProgramId) {
      return
    }

    if (
      !validateDates(
        programEditForm.start_date,
        programEditForm.end_date,
        'Program',
        setProgramEditFieldErrors,
      )
    ) {
      return
    }

    try {
      setError('')
      setSuccessMessage('')
      setProgramEditSuccess('')
      setProgramEditFieldErrors({})
      setIsUpdatingProgram(true)

      const updated = await updateProgram(editingProgramId, programEditForm)
      setPrograms((prev) =>
        prev.map((item) => (item.id === editingProgramId ? updated : item)),
      )

      setEditingProgramId(null)
      setProgramEditSuccess('Program updated successfully.')
    } catch (requestError) {
      const parsed = parseApiErrorDetails(requestError, 'Unable to update program.')
      setError(parsed.message)
      setProgramEditFieldErrors(parsed.fieldErrors)
      setProgramEditSuccess('')
    } finally {
      setIsUpdatingProgram(false)
    }
  }

  async function startEditingIntervention(intervention) {
    if (
      editingInterventionId !== null &&
      editingInterventionId !== intervention.id &&
      hasUnsavedInterventionEditChanges
    ) {
      const confirmed = await requestConfirmation({
        title: 'Discard Intervention Edits?',
        message:
          'Discard unsaved intervention edits and switch to another intervention?',
        confirmLabel: 'Discard Changes',
        isDestructive: true,
      })

      if (!confirmed) {
        return
      }
    }

    setError('')
    setSuccessMessage('')
    setInterventionEditSuccess('')
    setInterventionEditFieldErrors({})
    setEditingInterventionId(intervention.id)
    setInterventionEditForm({
      program: String(intervention.program),
      name: intervention.name,
      description: intervention.description || '',
      start_date: intervention.start_date,
      end_date: intervention.end_date,
    })
  }

  async function cancelEditingIntervention() {
    if (hasUnsavedInterventionEditChanges) {
      const confirmed = await requestConfirmation({
        title: 'Discard Intervention Edits?',
        message: 'Discard unsaved intervention changes?',
        confirmLabel: 'Discard Changes',
        isDestructive: true,
      })

      if (!confirmed) {
        return
      }
    }

    resetInterventionEditState()
  }

  useEffect(() => {
    if (editingProgramId === null && editingInterventionId === null) {
      return undefined
    }

    async function handleEscapeCancel(event) {
      if (event.key !== 'Escape') {
        return
      }

      if (isUpdatingProgram || isUpdatingIntervention) {
        return
      }

      if (confirmDialog.isOpen) {
        return
      }

      if (editingInterventionId !== null) {
        event.preventDefault()

        if (hasUnsavedInterventionEditChanges) {
          const confirmed = await requestConfirmation({
            title: 'Discard Intervention Edits?',
            message: 'Discard unsaved intervention changes?',
            confirmLabel: 'Discard Changes',
            isDestructive: true,
          })

          if (!confirmed) {
            return
          }
        }

        resetInterventionEditState()
        return
      }

      if (editingProgramId !== null) {
        event.preventDefault()

        if (hasUnsavedProgramEditChanges) {
          const confirmed = await requestConfirmation({
            title: 'Discard Program Edits?',
            message: 'Discard unsaved program changes?',
            confirmLabel: 'Discard Changes',
            isDestructive: true,
          })

          if (!confirmed) {
            return
          }
        }

        resetProgramEditState()
      }
    }

    window.addEventListener('keydown', handleEscapeCancel)
    return () => window.removeEventListener('keydown', handleEscapeCancel)
  }, [
    editingProgramId,
    editingInterventionId,
    hasUnsavedProgramEditChanges,
    hasUnsavedInterventionEditChanges,
    isUpdatingProgram,
    isUpdatingIntervention,
    confirmDialog.isOpen,
  ])

  async function handleUpdateIntervention(event) {
    event.preventDefault()

    if (!editingInterventionId) {
      return
    }

    if (!interventionEditForm.program) {
      setError('Select a program for intervention update.')
      setInterventionEditFieldErrors((prev) => ({
        ...prev,
        program: 'Program is required.',
      }))
      return
    }

    if (
      !validateDates(
        interventionEditForm.start_date,
        interventionEditForm.end_date,
        'Intervention',
        setInterventionEditFieldErrors,
      )
    ) {
      return
    }

    try {
      setError('')
      setSuccessMessage('')
      setInterventionEditSuccess('')
      setInterventionEditFieldErrors({})
      setIsUpdatingIntervention(true)

      const updated = await updateIntervention(editingInterventionId, {
        ...interventionEditForm,
        program: Number(interventionEditForm.program),
      })
      setInterventions((prev) =>
        prev.map((item) => (item.id === editingInterventionId ? updated : item)),
      )

      setEditingInterventionId(null)
      setInterventionEditSuccess('Intervention updated successfully.')
    } catch (requestError) {
      const parsed = parseApiErrorDetails(
        requestError,
        'Unable to update intervention.',
      )
      setError(parsed.message)
      setInterventionEditFieldErrors(parsed.fieldErrors)
      setInterventionEditSuccess('')
    } finally {
      setIsUpdatingIntervention(false)
    }
  }

  function buildShareableViewUrl() {
    const params = new URLSearchParams()
    params.set('focus', 'interventions')

    if (selectedProgramFilter !== 'all') {
      params.set('program', selectedProgramFilter)
    }

    if (interventionSearchTerm.trim()) {
      params.set('intervention_search', interventionSearchTerm.trim())
    }

    if (interventionSortKey !== 'start_asc') {
      params.set('intervention_sort', interventionSortKey)
    }

    return `${window.location.origin}${window.location.pathname}?${params.toString()}`
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
      <h3>Program Management</h3>
      <p>Manage programs and interventions used by staff assignment workflows.</p>

      {error ? <p className="error-text">{error}</p> : null}
      {successMessage ? <p className="success-text">{successMessage}</p> : null}

      {isLoading ? <p>Loading programs and interventions...</p> : null}

      {!isLoading ? (
        <>
          <div className="dashboard-grid top-gap">
            <div className="panel">
              <h4>Create Program</h4>
              <form className="stacked-form" onSubmit={handleCreateProgram}>
                <label htmlFor="program-name">Name</label>
                <input
                  id="program-name"
                  name="name"
                  type="text"
                  value={programForm.name}
                  onChange={updateProgramForm}
                  required
                />
                {programFieldErrors.name ? (
                  <p className="error-text">{programFieldErrors.name}</p>
                ) : null}

                <label htmlFor="program-description">Description</label>
                <textarea
                  id="program-description"
                  name="description"
                  rows="3"
                  value={programForm.description}
                  onChange={updateProgramForm}
                />
                {programFieldErrors.description ? (
                  <p className="error-text">{programFieldErrors.description}</p>
                ) : null}

                <label htmlFor="program-start-date">Start Date</label>
                <input
                  id="program-start-date"
                  name="start_date"
                  type="date"
                  value={programForm.start_date}
                  onChange={updateProgramForm}
                  required
                />
                {programFieldErrors.start_date ? (
                  <p className="error-text">{programFieldErrors.start_date}</p>
                ) : null}

                <label htmlFor="program-end-date">End Date</label>
                <input
                  id="program-end-date"
                  name="end_date"
                  type="date"
                  value={programForm.end_date}
                  onChange={updateProgramForm}
                  required
                />
                {programFieldErrors.end_date ? (
                  <p className="error-text">{programFieldErrors.end_date}</p>
                ) : null}

                <button
                  type="submit"
                  className="primary-button"
                  disabled={isCreatingProgram}
                >
                  {isCreatingProgram ? 'Creating...' : 'Create Program'}
                </button>
                {programCreateSuccess ? (
                  <p className="success-text">{programCreateSuccess}</p>
                ) : null}
              </form>
            </div>

            <div className="panel">
              <h4>Create Intervention</h4>
              {programs.length === 0 ? (
                <p>Create a program first before adding interventions.</p>
              ) : (
                <form className="stacked-form" onSubmit={handleCreateIntervention}>
                  <label htmlFor="intervention-program">Program</label>
                  <select
                    id="intervention-program"
                    name="program"
                    value={interventionForm.program}
                    onChange={updateInterventionForm}
                    required
                  >
                    <option value="">Select program</option>
                    {programs.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  {interventionFieldErrors.program ? (
                    <p className="error-text">{interventionFieldErrors.program}</p>
                  ) : null}

                  <label htmlFor="intervention-name">Name</label>
                  <input
                    id="intervention-name"
                    name="name"
                    type="text"
                    value={interventionForm.name}
                    onChange={updateInterventionForm}
                    required
                  />
                  {interventionFieldErrors.name ? (
                    <p className="error-text">{interventionFieldErrors.name}</p>
                  ) : null}

                  <label htmlFor="intervention-description">Description</label>
                  <textarea
                    id="intervention-description"
                    name="description"
                    rows="3"
                    value={interventionForm.description}
                    onChange={updateInterventionForm}
                  />
                  {interventionFieldErrors.description ? (
                    <p className="error-text">{interventionFieldErrors.description}</p>
                  ) : null}

                  <label htmlFor="intervention-start-date">Start Date</label>
                  <input
                    id="intervention-start-date"
                    name="start_date"
                    type="date"
                    value={interventionForm.start_date}
                    onChange={updateInterventionForm}
                    required
                  />
                  {interventionFieldErrors.start_date ? (
                    <p className="error-text">{interventionFieldErrors.start_date}</p>
                  ) : null}

                  <label htmlFor="intervention-end-date">End Date</label>
                  <input
                    id="intervention-end-date"
                    name="end_date"
                    type="date"
                    value={interventionForm.end_date}
                    onChange={updateInterventionForm}
                    required
                  />
                  {interventionFieldErrors.end_date ? (
                    <p className="error-text">{interventionFieldErrors.end_date}</p>
                  ) : null}

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={isCreatingIntervention}
                  >
                    {isCreatingIntervention ? 'Creating...' : 'Create Intervention'}
                  </button>
                  {interventionCreateSuccess ? (
                    <p className="success-text">{interventionCreateSuccess}</p>
                  ) : null}
                </form>
              )}
            </div>
          </div>

          <div className="top-gap">
            <h4>Programs</h4>
            {programs.length === 0 ? (
              <p>No programs yet.</p>
            ) : (
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Start</th>
                      <th>End</th>
                      <th>Interventions</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {programs.map((item) => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{item.start_date}</td>
                        <td>{item.end_date}</td>
                        <td>{interventionCountByProgramId[item.id] || 0}</td>
                        <td>
                          <div className="inline-actions">
                            <button
                              type="button"
                              className="ghost-button small"
                              onClick={() => startEditingProgram(item)}
                              disabled={isDeletingProgram(item.id)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="ghost-button small"
                              onClick={() => handleDeleteProgram(item.id)}
                              disabled={isDeletingProgram(item.id)}
                            >
                              {isDeletingProgram(item.id) ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {editingProgramId ? (
              <div className="panel top-gap">
                <h5>Edit Program</h5>
                <p>Press Esc to cancel editing.</p>
                <form className="stacked-form" onSubmit={handleUpdateProgram}>
                  <label htmlFor="edit-program-name">Name</label>
                  <input
                    id="edit-program-name"
                    name="name"
                    type="text"
                    value={programEditForm.name}
                    onChange={updateProgramEditForm}
                    required
                  />
                  {programEditFieldErrors.name ? (
                    <p className="error-text">{programEditFieldErrors.name}</p>
                  ) : null}

                  <label htmlFor="edit-program-description">Description</label>
                  <textarea
                    id="edit-program-description"
                    name="description"
                    rows="3"
                    value={programEditForm.description}
                    onChange={updateProgramEditForm}
                  />
                  {programEditFieldErrors.description ? (
                    <p className="error-text">{programEditFieldErrors.description}</p>
                  ) : null}

                  <label htmlFor="edit-program-start">Start Date</label>
                  <input
                    id="edit-program-start"
                    name="start_date"
                    type="date"
                    value={programEditForm.start_date}
                    onChange={updateProgramEditForm}
                    required
                  />
                  {programEditFieldErrors.start_date ? (
                    <p className="error-text">{programEditFieldErrors.start_date}</p>
                  ) : null}

                  <label htmlFor="edit-program-end">End Date</label>
                  <input
                    id="edit-program-end"
                    name="end_date"
                    type="date"
                    value={programEditForm.end_date}
                    onChange={updateProgramEditForm}
                    required
                  />
                  {programEditFieldErrors.end_date ? (
                    <p className="error-text">{programEditFieldErrors.end_date}</p>
                  ) : null}

                  <div className="inline-actions">
                    <button
                      type="submit"
                      className="primary-button"
                      disabled={isUpdatingProgram}
                    >
                      {isUpdatingProgram ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      className="ghost-button small"
                      onClick={cancelEditingProgram}
                      aria-keyshortcuts="Escape"
                      title="Esc"
                      disabled={isUpdatingProgram}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : null}
            {programEditSuccess ? (
              <p className="success-text top-gap">{programEditSuccess}</p>
            ) : null}
          </div>

          <div className="top-gap" ref={interventionsSectionRef}>
            <h4>Interventions</h4>
            <div className="toolbar-row">
              <label htmlFor="intervention-filter">Filter by Program</label>
              <select
                id="intervention-filter"
                value={selectedProgramFilter}
                onChange={(event) => setSelectedProgramFilter(event.target.value)}
              >
                <option value="all">All Programs</option>
                {programs.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>

              <label htmlFor="intervention-search">Search</label>
              <input
                id="intervention-search"
                type="search"
                value={interventionSearchTerm}
                onChange={(event) => setInterventionSearchTerm(event.target.value)}
                placeholder="Search intervention or program"
              />

              <label htmlFor="intervention-sort">Sort</label>
              <select
                id="intervention-sort"
                value={interventionSortKey}
                onChange={(event) => setInterventionSortKey(event.target.value)}
              >
                <option value="start_asc">Start Date (Oldest)</option>
                <option value="start_desc">Start Date (Newest)</option>
                <option value="end_asc">End Date (Soonest)</option>
                <option value="end_desc">End Date (Latest)</option>
                <option value="name_asc">Name A-Z</option>
                <option value="name_desc">Name Z-A</option>
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
              <label htmlFor="program-shareable-view-url">Shareable URL</label>
              <input
                id="program-shareable-view-url"
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

            {filteredInterventions.length === 0 ? (
              <p>No interventions found for this filter.</p>
            ) : (
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Program</th>
                      <th>Name</th>
                      <th>Start</th>
                      <th>End</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInterventions.map((item) => (
                      <tr key={item.id}>
                        <td>{programNameById[item.program] || `Program #${item.program}`}</td>
                        <td>{item.name}</td>
                        <td>{item.start_date}</td>
                        <td>{item.end_date}</td>
                        <td>
                          <div className="inline-actions">
                            <button
                              type="button"
                              className="ghost-button small"
                              onClick={() => startEditingIntervention(item)}
                              disabled={isDeletingIntervention(item.id)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="ghost-button small"
                              onClick={() => handleDeleteIntervention(item.id)}
                              disabled={isDeletingIntervention(item.id)}
                            >
                              {isDeletingIntervention(item.id) ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {editingInterventionId ? (
              <div className="panel top-gap">
                <h5>Edit Intervention</h5>
                <p>Press Esc to cancel editing.</p>
                <form className="stacked-form" onSubmit={handleUpdateIntervention}>
                  <label htmlFor="edit-intervention-program">Program</label>
                  <select
                    id="edit-intervention-program"
                    name="program"
                    value={interventionEditForm.program}
                    onChange={updateInterventionEditForm}
                    required
                  >
                    <option value="">Select program</option>
                    {programs.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  {interventionEditFieldErrors.program ? (
                    <p className="error-text">{interventionEditFieldErrors.program}</p>
                  ) : null}

                  <label htmlFor="edit-intervention-name">Name</label>
                  <input
                    id="edit-intervention-name"
                    name="name"
                    type="text"
                    value={interventionEditForm.name}
                    onChange={updateInterventionEditForm}
                    required
                  />
                  {interventionEditFieldErrors.name ? (
                    <p className="error-text">{interventionEditFieldErrors.name}</p>
                  ) : null}

                  <label htmlFor="edit-intervention-description">Description</label>
                  <textarea
                    id="edit-intervention-description"
                    name="description"
                    rows="3"
                    value={interventionEditForm.description}
                    onChange={updateInterventionEditForm}
                  />
                  {interventionEditFieldErrors.description ? (
                    <p className="error-text">{interventionEditFieldErrors.description}</p>
                  ) : null}

                  <label htmlFor="edit-intervention-start">Start Date</label>
                  <input
                    id="edit-intervention-start"
                    name="start_date"
                    type="date"
                    value={interventionEditForm.start_date}
                    onChange={updateInterventionEditForm}
                    required
                  />
                  {interventionEditFieldErrors.start_date ? (
                    <p className="error-text">{interventionEditFieldErrors.start_date}</p>
                  ) : null}

                  <label htmlFor="edit-intervention-end">End Date</label>
                  <input
                    id="edit-intervention-end"
                    name="end_date"
                    type="date"
                    value={interventionEditForm.end_date}
                    onChange={updateInterventionEditForm}
                    required
                  />
                  {interventionEditFieldErrors.end_date ? (
                    <p className="error-text">{interventionEditFieldErrors.end_date}</p>
                  ) : null}

                  <div className="inline-actions">
                    <button
                      type="submit"
                      className="primary-button"
                      disabled={isUpdatingIntervention}
                    >
                      {isUpdatingIntervention ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      className="ghost-button small"
                      onClick={cancelEditingIntervention}
                      aria-keyshortcuts="Escape"
                      title="Esc"
                      disabled={isUpdatingIntervention}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : null}
            {interventionEditSuccess ? (
              <p className="success-text top-gap">{interventionEditSuccess}</p>
            ) : null}
          </div>
        </>
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

export default ProgramManagementPage
