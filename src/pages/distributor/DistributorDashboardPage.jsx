import MetricCard from '../../components/common/MetricCard'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDistributions } from '../../services/distributions'

function DistributorDashboardPage() {
  const [distributions, setDistributions] = useState([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadDistributions() {
      try {
        setIsLoading(true)
        const data = await getDistributions()
        setDistributions(data)
      } catch (requestError) {
        setError(
          requestError?.response?.data?.detail ||
            'Unable to load assigned distributions.',
        )
      } finally {
        setIsLoading(false)
      }
    }

    loadDistributions()
  }, [])

  const assignedCount = distributions.length
  const deliveredCount = distributions.filter((item) => item.status === 'Delivered').length
  const delayedCount = distributions.filter((item) => item.status === 'Delayed').length

  const latestRoutes = useMemo(() => distributions.slice(0, 3), [distributions])

  return (
    <section className="page-shell">
      <div className="page-hero">
        <div>
          <p className="eyebrow">Distributor Operations</p>
          <h3 className="page-title">Distributor Dashboard</h3>
          <p className="page-subtitle">
            Track assigned deliveries, completed records, and route exceptions.
          </p>
        </div>
      </div>

      <div className="dashboard-grid">
        <MetricCard
          title="Assigned Deliveries"
          value={String(assignedCount)}
          icon="inventory_2"
          tone="secondary"
          hint="Current records assigned to your account"
        />
        <MetricCard
          title="Delivered"
          value={String(deliveredCount)}
          icon="check_circle"
          tone="tertiary"
          hint="Updated through delivery status screen"
        />
        <MetricCard
          title="Delayed"
          value={String(delayedCount)}
          icon="priority_high"
          tone="error"
          hint="Requires route follow-up"
        />

        {error ? <p className="error-text">{error}</p> : null}

        <article className="panel wide page-card">
          <div className="section-head">
            <h3>Route Snapshot</h3>
            <span className="section-chip">Latest</span>
          </div>
          {isLoading ? (
            <p>Loading assigned routes...</p>
          ) : latestRoutes.length === 0 ? (
            <p>No route assignments yet.</p>
          ) : (
            <ul>
              {latestRoutes.map((item) => (
                <li key={item.id}>
                  <Link
                    to="/distributor/deliveries"
                    className="dashboard-queue-link"
                  >
                    {item.farmer_name || `Farmer #${item.farmer}`}: {item.input_name} ({item.status})
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>
    </section>
  )
}

export default DistributorDashboardPage
