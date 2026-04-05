import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import MetricCard from '../../components/common/MetricCard'
import { getDistributions } from '../../services/distributions'
import { getInterventionApplications, getFarmers } from '../../services/farmers'
import { getInventoryItems } from '../../services/inventory'
import { getInterventions } from '../../services/programs'

function StaffDashboardPage() {
  const [metrics, setMetrics] = useState({
    farmersPendingVerification: 0,
    interventionsOpen: 0,
    distributionsToAssign: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadMetrics = useCallback(async () => {
    try {
      setIsLoading(true)
      setError('')

      const [farmers, applications, interventions, inventoryItems, distributions] =
        await Promise.all([
          getFarmers(),
          getInterventionApplications(),
          getInterventions(),
          getInventoryItems(),
          getDistributions(),
        ])

      const farmersPendingVerification = farmers.filter(
        (item) => item.credentials_status === 'Pending',
      ).length

      const now = new Date()
      const interventionsOpen = interventions.filter((item) => {
        const startDate = item.start_date ? new Date(item.start_date) : null
        const endDate = item.end_date ? new Date(item.end_date) : null

        if (!startDate || !endDate) {
          return false
        }

        return startDate <= now && now <= endDate
      }).length

      const inventoryInterventionById = Object.fromEntries(
        inventoryItems.map((item) => [item.id, item.intervention]),
      )

      const existingAssignmentKeys = new Set(
        distributions
          .filter((item) => item.status !== 'Cancelled')
          .map((item) => {
            const interventionId = inventoryInterventionById[item.input_inventory]
            return interventionId ? `${item.farmer}:${interventionId}` : null
          })
          .filter(Boolean),
      )

      const distributionsToAssign = applications.filter((item) => {
        if (item.status !== 'Approved') {
          return false
        }

        const key = `${item.farmer}:${item.intervention}`
        return !existingAssignmentKeys.has(key)
      }).length

      setMetrics({
        farmersPendingVerification,
        interventionsOpen,
        distributionsToAssign,
      })
    } catch (requestError) {
      setError(
        requestError?.response?.data?.detail ||
          'Unable to load live staff dashboard metrics.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  const priorities = useMemo(() => {
    return [
      {
        label: `Review ${metrics.farmersPendingVerification} farmer credential record(s).`,
        to: '/staff/farmers',
      },
      {
        label: `Track ${metrics.interventionsOpen} active intervention window(s).`,
        to: '/staff/dashboard',
      },
      {
        label: `Create assignments for ${metrics.distributionsToAssign} approved application(s).`,
        to: '/staff/distributions',
      },
    ]
  }, [metrics])

  useEffect(() => {
    loadMetrics()
  }, [loadMetrics])

  return (
    <section className="page-shell">
      <div className="page-hero">
        <div>
          <p className="eyebrow">Staff Operations</p>
          <h3 className="page-title">Staff Dashboard</h3>
          <p className="page-subtitle">
            Review priority queues for verification, intervention windows, and
            pending assignments.
          </p>
        </div>
        <div className="page-hero-actions">
          <button
            type="button"
            className="ghost-button small"
            onClick={loadMetrics}
            disabled={isLoading}
          >
            {isLoading ? 'Refreshing...' : 'Refresh Metrics'}
          </button>
        </div>
      </div>

      <div className="dashboard-grid">
        <MetricCard
          title="Farmers Pending Verification"
          value={isLoading ? '...' : String(metrics.farmersPendingVerification)}
          icon="person_search"
          tone="secondary"
          hint="Needs credential check"
        />
        <MetricCard
          title="Interventions Open"
          value={isLoading ? '...' : String(metrics.interventionsOpen)}
          icon="assignment_turned_in"
          tone="tertiary"
          hint="Active today"
        />
        <MetricCard
          title="Distributions to Assign"
          value={isLoading ? '...' : String(metrics.distributionsToAssign)}
          icon="local_shipping"
          hint="Approved applications awaiting assignment"
        />

        <article className="panel wide page-card">
          <div className="section-head">
            <h3>Today&apos;s Staff Priorities</h3>
            <span className="section-chip">Operations</span>
          </div>
          {error ? <p className="error-text">{error}</p> : null}
          <ul>
            {priorities.map((item) => (
              <li key={item.label}>
                <Link to={item.to} className="dashboard-queue-link">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  )
}

export default StaffDashboardPage
