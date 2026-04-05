import { useEffect, useMemo, useState } from 'react'
import {
  getDistributionTimeline,
  getDistributions,
  updateDeliveryStatus,
} from '../../services/distributions'

const DELIVERY_STATUSES = ['Delivered', 'Delayed', 'Rescheduled']

function DeliveryStatusPage() {
  const [distributions, setDistributions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [busyIds, setBusyIds] = useState([])
  const [timelineDistributionId, setTimelineDistributionId] = useState(null)
  const [timelineEntries, setTimelineEntries] = useState([])
  const [isTimelineLoading, setIsTimelineLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState('')

  const deliveredCount = useMemo(
    () =>
      distributions.filter((item) => (item.status || '').toLowerCase() === 'delivered')
        .length,
    [distributions],
  )

  const delayedCount = useMemo(
    () =>
      distributions.filter((item) => (item.status || '').toLowerCase() === 'delayed')
        .length,
    [distributions],
  )

  const pendingCount = useMemo(
    () =>
      distributions.filter((item) => (item.status || '').toLowerCase() === 'pending')
        .length,
    [distributions],
  )

  const filteredDistributions = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return distributions.filter((item) => {
      const status = (item.status || '').toLowerCase()
      const matchesStatus =
        statusFilter === 'all' ? true : status === statusFilter

      if (!matchesStatus) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      return [
        item.farmer_name,
        item.input_name,
        item.status,
        String(item.id),
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedSearch))
    })
  }, [distributions, searchTerm, statusFilter])

  useEffect(() => {
    async function loadDistributions() {
      try {
        setIsLoading(true)
        const data = await getDistributions()
        setDistributions(data)
      } catch (requestError) {
        setError(
          requestError?.response?.data?.detail ||
            'Unable to load assigned deliveries.',
        )
      } finally {
        setIsLoading(false)
      }
    }

    loadDistributions()
  }, [])

  async function handleStatusUpdate(distributionId, status) {
    try {
      setError('')
      setBusyIds((prev) => [...prev, distributionId])
      const updated = await updateDeliveryStatus(distributionId, { status })
      setDistributions((prev) =>
        prev.map((item) => (item.id === distributionId ? updated : item)),
      )

      if (timelineDistributionId === distributionId) {
        await handleViewTimeline(distributionId)
      }
    } catch (requestError) {
      setError(
        requestError?.response?.data?.detail ||
          'Unable to update delivery status.',
      )
    } finally {
      setBusyIds((prev) => prev.filter((id) => id !== distributionId))
    }
  }

  function isBusy(distributionId) {
    return busyIds.includes(distributionId)
  }

  async function handleViewTimeline(distributionId) {
    try {
      setError('')
      setTimelineDistributionId(distributionId)
      setIsTimelineLoading(true)
      const timeline = await getDistributionTimeline(distributionId)
      setTimelineEntries(timeline)
    } catch (requestError) {
      setError(
        requestError?.response?.data?.detail ||
          'Unable to load delivery timeline.',
      )
    } finally {
      setIsTimelineLoading(false)
    }
  }

  return (
    <section className="page-shell">
      <div className="page-hero">
        <div>
          <p className="eyebrow">Distributor Delivery Desk</p>
          <h3 className="page-title">Delivery Status Updates</h3>
          <p className="page-subtitle">
            Update delivery outcomes and review full status timelines.
          </p>
        </div>
      </div>

      <article className="panel page-card page-card--elevated">

      <div className="dashboard-grid">
        <article className="metric-card">
          <p className="metric-card__title">Assigned Deliveries</p>
          <p className="metric-card__value">{distributions.length}</p>
          <p className="metric-card__hint">Total delivery records</p>
        </article>
        <article className="metric-card">
          <p className="metric-card__title">Delivered</p>
          <p className="metric-card__value">{deliveredCount}</p>
          <p className="metric-card__hint">Completed handovers</p>
        </article>
        <article className="metric-card">
          <p className="metric-card__title">Needs Attention</p>
          <p className="metric-card__value">{delayedCount + pendingCount}</p>
          <p className="metric-card__hint">Pending and delayed records</p>
        </article>
      </div>

      <div className="section-head">
        <h3>Assigned Distributions</h3>
        <span className="section-chip">In Queue</span>
      </div>

      <div className="toolbar-row">
        <label htmlFor="delivery-status-filter">Status Filter</label>
        <select
          id="delivery-status-filter"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="delivered">Delivered</option>
          <option value="delayed">Delayed</option>
          <option value="rescheduled">Rescheduled</option>
          <option value="released">Released</option>
        </select>

        <label htmlFor="delivery-search">Search</label>
        <input
          id="delivery-search"
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Farmer, input, status, or ID"
        />
      </div>

      {error ? <p className="error-text">{error}</p> : null}
      {isLoading ? <p>Loading assigned deliveries...</p> : null}

      {!isLoading && filteredDistributions.length === 0 ? (
        <p>No assigned deliveries found.</p>
      ) : null}

      {!isLoading && filteredDistributions.length > 0 ? (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Farmer</th>
                <th>Input</th>
                <th>Quantity</th>
                <th>Current Status</th>
                <th>Update</th>
                <th>Timeline</th>
              </tr>
            </thead>
            <tbody>
              {filteredDistributions.map((item) => (
                <tr key={item.id}>
                  <td>{item.farmer_name || `Farmer #${item.farmer}`}</td>
                  <td>{item.input_name || `Input #${item.input_inventory}`}</td>
                  <td>{item.quantity_released}</td>
                  <td>
                    <span
                      className={`status-pill ${
                        item.status === 'Delivered'
                          ? 'status-pill--active'
                          : item.status === 'Delayed'
                            ? 'status-pill--inactive'
                            : 'status-pill--warning'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <div className="inline-actions">
                      {DELIVERY_STATUSES.map((status) => (
                        <button
                          key={status}
                          type="button"
                          className="ghost-button small"
                          onClick={() => handleStatusUpdate(item.id, status)}
                          disabled={isBusy(item.id) || item.status === status}
                        >
                          {isBusy(item.id) ? 'Updating...' : status}
                        </button>
                      ))}
                    </div>
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
      ) : null}

      {timelineDistributionId ? (
        <div className="timeline-block top-gap">
          <div className="section-head">
            <h4>Delivery Timeline #{timelineDistributionId}</h4>
            <span className="section-chip">History</span>
          </div>
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
      </article>
    </section>
  )
}

export default DeliveryStatusPage
