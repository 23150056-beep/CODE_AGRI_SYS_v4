import { useEffect, useState } from 'react'
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
  const [error, setError] = useState('')

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
    <section className="panel">
      <h3>Delivery Status Updates</h3>

      {error ? <p className="error-text">{error}</p> : null}
      {isLoading ? <p>Loading assigned deliveries...</p> : null}

      {!isLoading && distributions.length === 0 ? (
        <p>No assigned deliveries found.</p>
      ) : null}

      {!isLoading && distributions.length > 0 ? (
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
              {distributions.map((item) => (
                <tr key={item.id}>
                  <td>{item.farmer_name || `Farmer #${item.farmer}`}</td>
                  <td>{item.input_name || `Input #${item.input_inventory}`}</td>
                  <td>{item.quantity_released}</td>
                  <td>{item.status}</td>
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
          <h4>Delivery Timeline #{timelineDistributionId}</h4>
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
    </section>
  )
}

export default DeliveryStatusPage
