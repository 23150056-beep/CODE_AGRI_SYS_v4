import MetricCard from '../../components/common/MetricCard'
import { useEffect, useMemo, useState } from 'react'
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
    <section className="dashboard-grid">
      <MetricCard
        title="Assigned Deliveries"
        value={String(assignedCount)}
        hint="Current records assigned to your account"
      />
      <MetricCard
        title="Delivered"
        value={String(deliveredCount)}
        hint="Updated through delivery status screen"
      />
      <MetricCard
        title="Delayed"
        value={String(delayedCount)}
        hint="Requires route follow-up"
      />

      {error ? <p className="error-text">{error}</p> : null}

      <article className="panel wide">
        <h3>Route Snapshot</h3>
        {isLoading ? (
          <p>Loading assigned routes...</p>
        ) : latestRoutes.length === 0 ? (
          <p>No route assignments yet.</p>
        ) : (
          <ul>
            {latestRoutes.map((item) => (
              <li key={item.id}>
                {item.farmer_name || `Farmer #${item.farmer}`}: {item.input_name} ({item.status})
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  )
}

export default DistributorDashboardPage
