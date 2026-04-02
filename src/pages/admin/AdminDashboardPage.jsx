import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import MetricCard from '../../components/common/MetricCard'
import { getDistributions } from '../../services/distributions'
import { getFarmers, getInterventionApplications } from '../../services/farmers'
import { getInventoryItems } from '../../services/inventory'
import { getInterventions, getPrograms } from '../../services/programs'
import { getUsers } from '../../services/users'

const DASHBOARD_REFRESH_MS = 60000

function parseDateOnly(value) {
  if (!value) {
    return null
  }

  return new Date(`${value}T00:00:00`)
}

function AdminDashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null)
  const [error, setError] = useState('')
  const [metrics, setMetrics] = useState({
    activePrograms: 0,
    endingSoonPrograms: 0,
    totalInterventions: 0,
    inventoryAlerts: 0,
    inventoryTracked: 0,
    pendingActions: 0,
    usersWithoutRole: 0,
    pendingFarmerVerifications: 0,
    pendingApplications: 0,
    pendingDistributions: 0,
  })
  const [queueItems, setQueueItems] = useState([])

  const loadDashboardMetrics = useCallback(async (options = {}) => {
    const { silent = false } = options

    try {
      if (silent) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

      setError('')

      const [
        programsResult,
        interventionsResult,
        inventoryResult,
        usersResult,
        farmersResult,
        applicationsResult,
        distributionsResult,
      ] = await Promise.allSettled([
        getPrograms(),
        getInterventions(),
        getInventoryItems(),
        getUsers(),
        getFarmers(),
        getInterventionApplications(),
        getDistributions(),
      ])

      const failedSources = []

      function unwrap(result, sourceName) {
        if (result.status === 'fulfilled') {
          return result.value
        }

        failedSources.push(sourceName)
        return []
      }

      const programs = unwrap(programsResult, 'programs')
      const interventions = unwrap(interventionsResult, 'interventions')
      const inventoryItems = unwrap(inventoryResult, 'inventory')
      const users = unwrap(usersResult, 'users')
      const farmers = unwrap(farmersResult, 'farmers')
      const applications = unwrap(applicationsResult, 'intervention applications')
      const distributions = unwrap(distributionsResult, 'distributions')

      const today = new Date()
      const ninetyDaysLater = new Date(today)
      ninetyDaysLater.setDate(today.getDate() + 90)

      const activePrograms = programs.filter((item) => {
        const start = parseDateOnly(item.start_date)
        const end = parseDateOnly(item.end_date)

        if (!start || !end) {
          return false
        }

        return start <= today && end >= today
      }).length

      const endingSoonPrograms = programs.filter((item) => {
        const end = parseDateOnly(item.end_date)

        if (!end) {
          return false
        }

        return end >= today && end <= ninetyDaysLater
      }).length

      const inventoryAlerts = inventoryItems.filter(
        (item) => Number(item.quantity_available) <= 10,
      ).length

      const usersWithoutRole = users.filter(
        (item) => !Array.isArray(item.roles) || item.roles.length === 0,
      ).length

      const pendingFarmerVerifications = farmers.filter(
        (item) => item.credentials_status === 'Pending',
      ).length

      const pendingApplications = applications.filter(
        (item) => item.status === 'Pending',
      ).length

      const pendingDistributions = distributions.filter(
        (item) => item.status === 'Pending',
      ).length

      const pendingActions =
        usersWithoutRole +
        pendingFarmerVerifications +
        pendingApplications +
        pendingDistributions

      const nextQueueItems = [
        pendingFarmerVerifications > 0
          ? {
              id: 'farmers-pending',
              label: `Prepare staff coverage for ${pendingFarmerVerifications} farmer credential verification(s).`,
              to: '/admin/users?filter=staff&sort=joined_desc&page_size=20',
            }
          : null,
        pendingApplications > 0
          ? {
              id: 'applications-pending',
              label: `Review intervention windows for ${pendingApplications} pending application(s).`,
              to: '/admin/programs?focus=interventions&intervention_sort=end_asc',
            }
          : null,
        pendingDistributions > 0
          ? {
              id: 'distributions-pending',
              label: `Resolve ${pendingDistributions} pending distribution assignment(s).`,
              to: '/admin/inventory?distribution=pending&distribution_sort=date_asc',
            }
          : null,
        usersWithoutRole > 0
          ? {
              id: 'users-without-roles',
              label: `Assign roles for ${usersWithoutRole} user account(s) without roles.`,
              to: '/admin/users?filter=unassigned&sort=joined_asc&page_size=20',
            }
          : null,
      ].filter(Boolean)

      setMetrics({
        activePrograms,
        endingSoonPrograms,
        totalInterventions: interventions.length,
        inventoryAlerts,
        inventoryTracked: inventoryItems.length,
        pendingActions,
        usersWithoutRole,
        pendingFarmerVerifications,
        pendingApplications,
        pendingDistributions,
      })

      setQueueItems(nextQueueItems)
      setLastUpdatedAt(new Date())

      if (failedSources.length > 0) {
        setError(
          `Some dashboard data could not be loaded (${failedSources.join(', ')}).`,
        )
      }
    } finally {
      if (silent) {
        setIsRefreshing(false)
      } else {
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    loadDashboardMetrics()

    const refreshTimer = setInterval(() => {
      loadDashboardMetrics({ silent: true })
    }, DASHBOARD_REFRESH_MS)

    return () => {
      clearInterval(refreshTimer)
    }
  }, [loadDashboardMetrics])

  return (
    <section className="dashboard-grid">
      {error ? <p className="error-text panel wide">{error}</p> : null}

      <MetricCard
        title="Active Programs"
        value={isLoading ? '...' : String(metrics.activePrograms)}
        hint={
          isLoading
            ? 'Loading program metrics...'
            : `${metrics.endingSoonPrograms} ending within 90 days, ${metrics.totalInterventions} interventions configured`
        }
      />
      <MetricCard
        title="Inventory Alerts"
        value={isLoading ? '...' : String(metrics.inventoryAlerts)}
        hint={
          isLoading
            ? 'Loading inventory metrics...'
            : `${metrics.inventoryTracked} items tracked, threshold <= 10 units`
        }
      />
      <MetricCard
        title="Pending User Actions"
        value={isLoading ? '...' : String(metrics.pendingActions)}
        hint={
          isLoading
            ? 'Loading queue metrics...'
            : `${metrics.usersWithoutRole} users w/o roles, ${metrics.pendingFarmerVerifications} farmer verifications pending`
        }
      />

      <article className="panel wide">
        <div className="dashboard-queue-header">
          <h3>Administration Queue</h3>
          <button
            type="button"
            className="ghost-button small"
            onClick={() => loadDashboardMetrics({ silent: true })}
            disabled={isRefreshing}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        {lastUpdatedAt ? (
          <p className="dashboard-queue-meta">
            Last updated: {lastUpdatedAt.toLocaleString()}
          </p>
        ) : null}
        {isLoading ? <p>Loading action queue...</p> : null}
        {!isLoading && queueItems.length === 0 ? (
          <p>No pending admin actions right now.</p>
        ) : null}
        {!isLoading && queueItems.length > 0 ? (
          <ul>
            {queueItems.map((item) => (
              <li key={item.id}>
                <Link to={item.to} className="dashboard-queue-link">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </article>
    </section>
  )
}

export default AdminDashboardPage
