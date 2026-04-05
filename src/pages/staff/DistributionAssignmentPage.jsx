import { useEffect, useMemo, useState } from 'react'
import { getDistributors } from '../../services/distributors'
import {
  bulkReleaseDistributions,
  createDistribution,
  getDistributions,
  getDistributionTimeline,
  releaseDistribution,
} from '../../services/distributions'
import {
  getFarmers,
  getInterventionApplications,
  updateInterventionApplication,
} from '../../services/farmers'
import { getInventoryItems } from '../../services/inventory'
import { getInterventions } from '../../services/programs'

const STATUS_FILTERS = ['All', 'Pending', 'Approved', 'Rejected']
const STATUS_ACTIONS = ['Pending', 'Approved', 'Rejected']

function DistributionAssignmentPage() {
  const [applications, setApplications] = useState([])
  const [farmers, setFarmers] = useState([])
  const [interventions, setInterventions] = useState([])
  const [distributors, setDistributors] = useState([])
  const [inventoryItems, setInventoryItems] = useState([])
  const [distributions, setDistributions] = useState([])
  const [statusFilter, setStatusFilter] = useState('All')
  const [applicationSearchTerm, setApplicationSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [busyIds, setBusyIds] = useState([])
  const [releaseBusyIds, setReleaseBusyIds] = useState([])
  const [selectedDistributionIds, setSelectedDistributionIds] = useState([])
  const [isBulkReleasing, setIsBulkReleasing] = useState(false)
  const [isCreatingAssignment, setIsCreatingAssignment] = useState(false)
  const [timelineDistributionId, setTimelineDistributionId] = useState(null)
  const [timelineEntries, setTimelineEntries] = useState([])
  const [isTimelineLoading, setIsTimelineLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [assignmentForm, setAssignmentForm] = useState({
    applicationId: '',
    inventoryId: '',
    distributorId: '',
    quantityReleased: '1',
    remarks: '',
  })

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true)
        const [
          applicationData,
          farmerData,
          interventionData,
          distributorData,
          inventoryData,
          distributionData,
        ] = await Promise.all([
          getInterventionApplications(),
          getFarmers(),
          getInterventions(),
          getDistributors(),
          getInventoryItems(),
          getDistributions(),
        ])

        setApplications(applicationData)
        setFarmers(farmerData)
        setInterventions(interventionData)
        setDistributors(distributorData)
        setInventoryItems(inventoryData)
        setDistributions(distributionData)

        if (distributorData.length > 0 || inventoryData.length > 0) {
          setAssignmentForm((prev) => ({
            ...prev,
            distributorId:
              prev.distributorId ||
              (distributorData[0] ? String(distributorData[0].id) : ''),
            inventoryId:
              prev.inventoryId || (inventoryData[0] ? String(inventoryData[0].id) : ''),
          }))
        }
      } catch (requestError) {
        setError(
          requestError?.response?.data?.detail ||
            'Unable to load distribution assignment data.',
        )
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const farmerNameById = useMemo(() => {
    const entries = farmers.map((item) => [
      item.id,
      `${item.last_name}, ${item.first_name}`,
    ])
    return Object.fromEntries(entries)
  }, [farmers])

  const interventionNameById = useMemo(() => {
    const entries = interventions.map((item) => [item.id, item.name])
    return Object.fromEntries(entries)
  }, [interventions])

  const inventoryNameById = useMemo(() => {
    const entries = inventoryItems.map((item) => [item.id, item.input_name])
    return Object.fromEntries(entries)
  }, [inventoryItems])

  const distributorNameById = useMemo(() => {
    const entries = distributors.map((item) => [item.id, item.name])
    return Object.fromEntries(entries)
  }, [distributors])

  const filteredApplications = useMemo(() => {
    const normalizedSearch = applicationSearchTerm.trim().toLowerCase()

    const byStatus =
      statusFilter === 'All'
        ? applications
        : applications.filter((item) => item.status === statusFilter)

    return byStatus.filter((item) => {
      if (!normalizedSearch) {
        return true
      }

      const farmerName = farmerNameById[item.farmer] || `Farmer #${item.farmer}`
      const interventionName =
        interventionNameById[item.intervention] ||
        `Intervention #${item.intervention}`

      return [farmerName, interventionName, item.status, item.remarks, String(item.id)]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedSearch))
    })
  }, [
    applicationSearchTerm,
    applications,
    farmerNameById,
    interventionNameById,
    statusFilter,
  ])

  const approvedApplications = useMemo(
    () => applications.filter((item) => item.status === 'Approved'),
    [applications],
  )

  const pendingDistributionIds = useMemo(
    () => distributions.filter((item) => item.status === 'Pending').map((item) => item.id),
    [distributions],
  )

  const pendingApplicationCount = useMemo(
    () => applications.filter((item) => item.status === 'Pending').length,
    [applications],
  )

  const rejectedApplicationCount = useMemo(
    () => applications.filter((item) => item.status === 'Rejected').length,
    [applications],
  )

  const pendingDistributionCount = pendingDistributionIds.length

  const releasableSelectedIds = useMemo(() => {
    const pendingIds = new Set(
      distributions
        .filter((item) => item.status === 'Pending')
        .map((item) => item.id),
    )

    return selectedDistributionIds.filter((id) => pendingIds.has(id))
  }, [distributions, selectedDistributionIds])

  useEffect(() => {
    setSelectedDistributionIds((prev) =>
      prev.filter((id) => distributions.some((item) => item.id === id)),
    )
  }, [distributions])

  async function updateStatus(applicationId, status) {
    try {
      setError('')
      setSuccessMessage('')
      setBusyIds((prev) => [...prev, applicationId])
      const updated = await updateInterventionApplication(applicationId, { status })

      setApplications((prev) =>
        prev.map((item) => (item.id === applicationId ? updated : item)),
      )
    } catch (requestError) {
      setError(
        requestError?.response?.data?.detail ||
          'Unable to update application status.',
      )
    } finally {
      setBusyIds((prev) => prev.filter((id) => id !== applicationId))
    }
  }

  function isBusy(applicationId) {
    return busyIds.includes(applicationId)
  }

  function isReleasing(distributionId) {
    return releaseBusyIds.includes(distributionId)
  }

  function isSelected(distributionId) {
    return selectedDistributionIds.includes(distributionId)
  }

  function toggleDistributionSelection(distributionId) {
    setSelectedDistributionIds((prev) =>
      prev.includes(distributionId)
        ? prev.filter((id) => id !== distributionId)
        : [...prev, distributionId],
    )
  }

  function inventoryLabel(item) {
    return `${item.input_name} (Available: ${item.quantity_available})`
  }

  function handleAssignmentInputChange(event) {
    const { name, value } = event.target
    setAssignmentForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleCreateAssignment(event) {
    event.preventDefault()

    const applicationId = Number(assignmentForm.applicationId)
    const inventoryId = Number(assignmentForm.inventoryId)
    const distributorId = Number(assignmentForm.distributorId)
    const quantityReleased = Number(assignmentForm.quantityReleased)

    const selectedApplication = approvedApplications.find(
      (item) => item.id === applicationId,
    )

    if (!selectedApplication) {
      setError('Please select an approved application to assign.')
      return
    }

    if (!inventoryId || !distributorId || quantityReleased <= 0) {
      setError('Select inventory, distributor, and a valid quantity.')
      return
    }

    try {
      setError('')
      setSuccessMessage('')
      setIsCreatingAssignment(true)

      const created = await createDistribution({
        farmer: selectedApplication.farmer,
        input_inventory: inventoryId,
        quantity_released: quantityReleased,
        assigned_distributor: distributorId,
        remarks: assignmentForm.remarks,
      })

      setDistributions((prev) => [created, ...prev])
      setAssignmentForm((prev) => ({
        ...prev,
        applicationId: '',
        quantityReleased: '1',
        remarks: '',
      }))
      setSuccessMessage('Distribution assignment created successfully.')
    } catch (requestError) {
      setError(
        requestError?.response?.data?.detail || 'Unable to create distribution assignment.',
      )
    } finally {
      setIsCreatingAssignment(false)
    }
  }

  async function handleReleaseDistribution(distributionId) {
    try {
      setError('')
      setSuccessMessage('')
      setReleaseBusyIds((prev) => [...prev, distributionId])
      const updated = await releaseDistribution(distributionId)
      setDistributions((prev) =>
        prev.map((item) => (item.id === distributionId ? updated : item)),
      )
      setSelectedDistributionIds((prev) => prev.filter((id) => id !== distributionId))
      setSuccessMessage(`Distribution #${distributionId} released successfully.`)

      if (timelineDistributionId === distributionId) {
        await handleViewTimeline(distributionId)
      }
    } catch (requestError) {
      setError(
        requestError?.response?.data?.detail ||
          'Unable to release distribution record.',
      )
    } finally {
      setReleaseBusyIds((prev) => prev.filter((id) => id !== distributionId))
    }
  }

  async function handleBulkRelease() {
    if (releasableSelectedIds.length === 0) {
      setError('Select at least one pending distribution record for bulk release.')
      return
    }

    try {
      setError('')
      setSuccessMessage('')
      setIsBulkReleasing(true)
      const result = await bulkReleaseDistributions(releasableSelectedIds)

      if (result.released_ids?.length) {
        const refreshed = await getDistributions()
        setDistributions(refreshed)
      }

      setSelectedDistributionIds([])

      if (result.released_ids?.length) {
        setSuccessMessage(
          `Released ${result.released_ids.length} distribution record(s) successfully.`,
        )
      }

      if (result.skipped?.length) {
        setError(
          `Some records were skipped: ${result.skipped
            .map((item) => `#${item.id} (${item.reason})`)
            .join(', ')}`,
        )
      }
    } catch (requestError) {
      setError(
        requestError?.response?.data?.detail ||
          'Unable to perform bulk release operation.',
      )
    } finally {
      setIsBulkReleasing(false)
    }
  }

  async function handleViewTimeline(distributionId) {
    try {
      setError('')
      setSuccessMessage('')
      setIsTimelineLoading(true)
      setTimelineDistributionId(distributionId)
      const timeline = await getDistributionTimeline(distributionId)
      setTimelineEntries(timeline)
    } catch (requestError) {
      setError(
        requestError?.response?.data?.detail ||
          'Unable to load distribution timeline.',
      )
    } finally {
      setIsTimelineLoading(false)
    }
  }

  function handleSelectAllPending() {
    setSelectedDistributionIds(pendingDistributionIds)
  }

  function handleClearSelection() {
    setSelectedDistributionIds([])
  }

  return (
    <section className="page-shell">
      <div className="page-hero">
        <div>
          <p className="eyebrow">Staff Distribution Desk</p>
          <h3 className="page-title">Distribution Assignment</h3>
          <p className="page-subtitle">
            Move approved applications into assignment and release workflows.
          </p>
        </div>
      </div>

      <article className="panel page-card page-card--elevated">

      <div className="dashboard-grid">
        <article className="metric-card">
          <p className="metric-card__title">Pending Applications</p>
          <p className="metric-card__value">{pendingApplicationCount}</p>
          <p className="metric-card__hint">Needs status review by staff</p>
        </article>
        <article className="metric-card">
          <p className="metric-card__title">Approved for Assignment</p>
          <p className="metric-card__value">{approvedApplications.length}</p>
          <p className="metric-card__hint">Eligible for distribution release</p>
        </article>
        <article className="metric-card">
          <p className="metric-card__title">Pending Distributions</p>
          <p className="metric-card__value">{pendingDistributionCount}</p>
          <p className="metric-card__hint">Queued records ready for dispatch</p>
        </article>
      </div>

      {error ? <p className="error-text">{error}</p> : null}
      {successMessage ? <p className="success-text">{successMessage}</p> : null}

      <div className="section-head">
        <h4>Intervention Applications</h4>
        <span className="section-chip">Verification</span>
      </div>

      <div className="toolbar-row">
        <label htmlFor="status-filter">Filter by Status</label>
        <select
          id="status-filter"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          {STATUS_FILTERS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <label htmlFor="application-search">Search</label>
        <input
          id="application-search"
          type="search"
          value={applicationSearchTerm}
          onChange={(event) => setApplicationSearchTerm(event.target.value)}
          placeholder="Farmer, intervention, status, or ID"
        />
      </div>

      {isLoading ? <p>Loading intervention applications...</p> : null}

      {!isLoading && filteredApplications.length === 0 ? (
        <p>No intervention applications found for this filter.</p>
      ) : null}

      {!isLoading && filteredApplications.length > 0 ? (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Farmer</th>
                <th>Intervention</th>
                <th>Status</th>
                <th>Applied On</th>
                <th>Remarks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.map((item) => (
                <tr key={item.id}>
                  <td>{farmerNameById[item.farmer] || `Farmer #${item.farmer}`}</td>
                  <td>
                    {interventionNameById[item.intervention] ||
                      `Intervention #${item.intervention}`}
                  </td>
                  <td>
                    <span
                      className={`status-pill ${
                        item.status === 'Approved'
                          ? 'status-pill--active'
                          : item.status === 'Rejected'
                            ? 'status-pill--inactive'
                            : 'status-pill--warning'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td>{new Date(item.application_date).toLocaleDateString()}</td>
                  <td>{item.remarks || 'No remarks'}</td>
                  <td>
                    <div className="inline-actions">
                      {STATUS_ACTIONS.map((status) => (
                        <button
                          key={status}
                          type="button"
                          className="ghost-button small"
                          onClick={() => updateStatus(item.id, status)}
                          disabled={isBusy(item.id) || item.status === status}
                        >
                          {isBusy(item.id) ? 'Updating...' : status}
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

      <hr className="divider" />

      <div className="section-head">
        <h4>Create Distribution Assignment</h4>
        <span className="section-chip">Assignment</span>
      </div>
      {approvedApplications.length === 0 ? (
        <p>No approved applications available for assignment.</p>
      ) : (
        <form className="stacked-form" onSubmit={handleCreateAssignment}>
          <label htmlFor="applicationId">Approved Application</label>
          <select
            id="applicationId"
            name="applicationId"
            value={assignmentForm.applicationId}
            onChange={handleAssignmentInputChange}
          >
            <option value="">Select application</option>
            {approvedApplications.map((item) => (
              <option key={item.id} value={item.id}>
                {(farmerNameById[item.farmer] || `Farmer #${item.farmer}`) +
                  ' - ' +
                  (interventionNameById[item.intervention] ||
                    `Intervention #${item.intervention}`)}
              </option>
            ))}
          </select>

          <label htmlFor="inventoryId">Inventory Item</label>
          <select
            id="inventoryId"
            name="inventoryId"
            value={assignmentForm.inventoryId}
            onChange={handleAssignmentInputChange}
          >
            {inventoryItems.map((item) => (
              <option key={item.id} value={item.id}>
                {inventoryLabel(item)}
              </option>
            ))}
          </select>

          <label htmlFor="distributorId">Assigned Distributor</label>
          <select
            id="distributorId"
            name="distributorId"
            value={assignmentForm.distributorId}
            onChange={handleAssignmentInputChange}
          >
            {distributors.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <label htmlFor="quantityReleased">Quantity Released</label>
          <input
            id="quantityReleased"
            name="quantityReleased"
            type="number"
            min="1"
            value={assignmentForm.quantityReleased}
            onChange={handleAssignmentInputChange}
          />

          <label htmlFor="remarks">Assignment Remarks</label>
          <textarea
            id="remarks"
            name="remarks"
            rows="3"
            value={assignmentForm.remarks}
            onChange={handleAssignmentInputChange}
            placeholder="Optional instructions for distributor"
          />

          <button
            type="submit"
            className="primary-button"
            disabled={isCreatingAssignment}
          >
            {isCreatingAssignment ? 'Assigning...' : 'Create Assignment'}
          </button>
        </form>
      )}

      <div className="top-gap page-card">
        <div className="section-head">
          <h4>Recent Distribution Records</h4>
          <span className="section-chip">Release</span>
        </div>
        <div className="inline-actions">
          <button
            type="button"
            className="ghost-button small"
            onClick={handleSelectAllPending}
            disabled={pendingDistributionIds.length === 0}
          >
            Select All Pending
          </button>
          <button
            type="button"
            className="ghost-button small"
            onClick={handleClearSelection}
            disabled={selectedDistributionIds.length === 0}
          >
            Clear Selection
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={handleBulkRelease}
            disabled={isBulkReleasing || releasableSelectedIds.length === 0}
          >
            {isBulkReleasing ? 'Bulk Releasing...' : 'Bulk Release Selected'}
          </button>
        </div>
        <p>{releasableSelectedIds.length} pending record(s) selected.</p>
        {rejectedApplicationCount > 0 ? (
          <p>
            <strong>{rejectedApplicationCount}</strong> rejected application(s)
            currently require farmer updates before assignment.
          </p>
        ) : null}
        {distributions.length === 0 ? (
          <p>No distribution records yet.</p>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Select</th>
                  <th>Farmer</th>
                  <th>Inventory</th>
                  <th>Distributor</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Release</th>
                  <th>Timeline</th>
                </tr>
              </thead>
              <tbody>
                {distributions.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={isSelected(item.id)}
                        onChange={() => toggleDistributionSelection(item.id)}
                        disabled={item.status !== 'Pending'}
                      />
                    </td>
                    <td>{farmerNameById[item.farmer] || `Farmer #${item.farmer}`}</td>
                    <td>
                      {inventoryNameById[item.input_inventory] ||
                        `Inventory #${item.input_inventory}`}
                    </td>
                    <td>
                      {distributorNameById[item.assigned_distributor] ||
                        (item.assigned_distributor
                          ? `Distributor #${item.assigned_distributor}`
                          : 'Unassigned')}
                    </td>
                    <td>{item.quantity_released}</td>
                    <td>
                      <span
                        className={`status-pill ${
                          item.status === 'Released' || item.status === 'Delivered'
                            ? 'status-pill--active'
                            : item.status === 'Delayed' || item.status === 'Rejected'
                              ? 'status-pill--inactive'
                              : 'status-pill--warning'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td>{new Date(item.distribution_date).toLocaleDateString()}</td>
                    <td>
                      <button
                        type="button"
                        className="ghost-button small"
                        onClick={() => handleReleaseDistribution(item.id)}
                        disabled={item.status !== 'Pending' || isReleasing(item.id)}
                      >
                        {isReleasing(item.id) ? 'Releasing...' : 'Release'}
                      </button>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="ghost-button small"
                        onClick={() => handleViewTimeline(item.id)}
                      >
                        View Timeline
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {timelineDistributionId ? (
          <div className="timeline-block top-gap">
            <h5>Distribution #{timelineDistributionId} Timeline</h5>
            {isTimelineLoading ? (
              <p>Loading timeline...</p>
            ) : timelineEntries.length === 0 ? (
              <p>No timeline events recorded yet.</p>
            ) : (
              <ul className="timeline-list">
                {timelineEntries.map((entry) => (
                  <li className="timeline-item" key={entry.id}>
                    <p>
                        {entry.previous_status || 'None'} {' -> '} {entry.new_status}
                    </p>
                    <p>
                      By {entry.updated_by_username || 'System'} on{' '}
                      {new Date(entry.created_at).toLocaleString()}
                    </p>
                    <p>{entry.remarks || 'No remarks'}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>
      </article>
    </section>
  )
}

export default DistributionAssignmentPage
