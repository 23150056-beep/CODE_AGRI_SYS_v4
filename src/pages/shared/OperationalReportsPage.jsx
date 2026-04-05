import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import MetricCard from '../../components/common/MetricCard'
import useAuth from '../../hooks/useAuth'
import { getDistributions } from '../../services/distributions'
import { getFarmers, getInterventionApplications } from '../../services/farmers'
import { getInventoryItems } from '../../services/inventory'
import { getInterventions } from '../../services/programs'

const LOW_STOCK_THRESHOLD = 10

function parseDateStart(value) {
  if (!value) {
    return null
  }

  return new Date(`${value}T00:00:00`)
}

function parseDateEnd(value) {
  if (!value) {
    return null
  }

  return new Date(`${value}T23:59:59.999`)
}

function parseDateTime(value) {
  if (!value) {
    return null
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return parsed
}

function parseDateOnly(value) {
  if (!value) {
    return null
  }

  return new Date(`${value}T00:00:00`)
}

function isDateInRange(value, fromDate, toDate) {
  const parsed = parseDateTime(value)

  if (!parsed) {
    return false
  }

  if (fromDate && parsed < fromDate) {
    return false
  }

  if (toDate && parsed > toDate) {
    return false
  }

  return true
}

function doRangesOverlap(startDate, endDate, fromDate, toDate) {
  if (!startDate || !endDate) {
    return false
  }

  if (fromDate && endDate < fromDate) {
    return false
  }

  if (toDate && startDate > toDate) {
    return false
  }

  return true
}

function csvEscape(value) {
  const asString = String(value ?? '')

  if (asString.includes(',') || asString.includes('"') || asString.includes('\n')) {
    return `"${asString.replace(/"/g, '""')}"`
  }

  return asString
}

function buildInterventionCsv(rows) {
  const headers = [
    'Intervention',
    'Start Date',
    'End Date',
    'Applications',
    'Approved',
    'Pending',
    'Rejected',
    'Assigned',
    'Awaiting Assignment',
  ]

  const lines = [headers.join(',')]

  rows.forEach((row) => {
    lines.push(
      [
        row.interventionName,
        row.startDate,
        row.endDate,
        row.applications,
        row.approved,
        row.pending,
        row.rejected,
        row.assigned,
        row.awaitingAssignment,
      ]
        .map(csvEscape)
        .join(','),
    )
  })

  return lines.join('\n')
}

function formatDate(value) {
  if (!value) {
    return 'n/a'
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return 'n/a'
  }

  return parsed.toLocaleDateString()
}

function OperationalReportsPage() {
  const { activeRole } = useAuth()
  const isAdmin = activeRole === 'Admin'
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null)
  const [metrics, setMetrics] = useState({
    farmersPendingVerification: 0,
    pendingApplications: 0,
    approvedAwaitingAssignment: 0,
    pendingReleases: 0,
    lowStockItems: 0,
    activeInterventions: 0,
  })
  const [queueItems, setQueueItems] = useState([])
  const [interventionRows, setInterventionRows] = useState([])
  const hasDateFilter = Boolean(dateFrom || dateTo)

  function clearDateFilter() {
    setDateFrom('')
    setDateTo('')
  }

  function handleExportCsv() {
    if (interventionRows.length === 0) {
      setError('No report rows available to export.')
      return
    }

    const csvContent = buildInterventionCsv(interventionRows)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const fileDate = new Date().toISOString().slice(0, 10)
    const roleTag = (activeRole || 'authorized').toLowerCase()

    link.href = URL.createObjectURL(blob)
    link.download = `operational-reports-${roleTag}-${fileDate}.csv`

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
  }

  const loadReport = useCallback(
    async (options = {}) => {
      const { silent = false } = options
      const fromDate = parseDateStart(dateFrom)
      const toDate = parseDateEnd(dateTo)

      try {
        if (silent) {
          setIsRefreshing(true)
        } else {
          setIsLoading(true)
        }

        setError('')

        if (fromDate && toDate && fromDate > toDate) {
          setError('Start date must be on or before end date.')
          setQueueItems([])
          setInterventionRows([])
          setMetrics({
            farmersPendingVerification: 0,
            pendingApplications: 0,
            approvedAwaitingAssignment: 0,
            pendingReleases: 0,
            lowStockItems: 0,
            activeInterventions: 0,
          })
          return
        }

        const [
          farmersResult,
          applicationsResult,
          interventionsResult,
          inventoryResult,
          distributionsResult,
        ] = await Promise.allSettled([
          getFarmers(),
          getInterventionApplications(),
          getInterventions(),
          getInventoryItems(),
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

        const farmers = unwrap(farmersResult, 'farmers')
        const applications = unwrap(applicationsResult, 'intervention applications')
        const interventions = unwrap(interventionsResult, 'interventions')
        const inventoryItems = unwrap(inventoryResult, 'inventory')
        const distributions = unwrap(distributionsResult, 'distributions')

        const filteredApplications = applications.filter((item) =>
          isDateInRange(item.application_date, fromDate, toDate),
        )

        const filteredDistributions = distributions.filter((item) =>
          isDateInRange(item.distribution_date, fromDate, toDate),
        )

        const farmersPendingVerification = farmers.filter(
          (item) => item.credentials_status === 'Pending',
        ).length

        const pendingApplications = filteredApplications.filter(
          (item) => item.status === 'Pending',
        ).length

        const pendingReleases = filteredDistributions.filter(
          (item) => item.status === 'Pending',
        ).length

        const lowStockItems = inventoryItems.filter(
          (item) => Number(item.quantity_available) <= LOW_STOCK_THRESHOLD,
        ).length

        const today = new Date()

        const activeInterventions = interventions.filter((item) => {
          const startDate = parseDateOnly(item.start_date)
          const endDate = parseDateOnly(item.end_date)

          if (!startDate || !endDate) {
            return false
          }

          if (fromDate || toDate) {
            return doRangesOverlap(startDate, endDate, fromDate, toDate)
          }

          return startDate <= today && endDate >= today
        }).length

        const inventoryInterventionById = Object.fromEntries(
          inventoryItems.map((item) => [item.id, item.intervention]),
        )

        const existingAssignmentKeys = new Set(
          filteredDistributions
            .filter((item) => item.status !== 'Cancelled')
            .map((item) => {
              const interventionId = inventoryInterventionById[item.input_inventory]
              return interventionId ? `${item.farmer}:${interventionId}` : null
            })
            .filter(Boolean),
        )

        const approvedAwaitingAssignment = filteredApplications.filter((item) => {
          if (item.status !== 'Approved') {
            return false
          }

          const key = `${item.farmer}:${item.intervention}`
          return !existingAssignmentKeys.has(key)
        }).length

        const interventionById = Object.fromEntries(
          interventions.map((item) => [item.id, item]),
        )

        const rowsByInterventionId = new Map()

        const interventionsInScope = interventions.filter((item) => {
          const startDate = parseDateOnly(item.start_date)
          const endDate = parseDateOnly(item.end_date)

          if (!fromDate && !toDate) {
            return true
          }

          return doRangesOverlap(startDate, endDate, fromDate, toDate)
        })

        interventionsInScope.forEach((item) => {
          rowsByInterventionId.set(item.id, {
            interventionId: item.id,
            interventionName: item.name,
            startDate: item.start_date,
            endDate: item.end_date,
            applications: 0,
            approved: 0,
            pending: 0,
            rejected: 0,
            assigned: 0,
          })
        })

        filteredApplications.forEach((item) => {
          if (!rowsByInterventionId.has(item.intervention)) {
            rowsByInterventionId.set(item.intervention, {
              interventionId: item.intervention,
              interventionName:
                interventionById[item.intervention]?.name ||
                `Intervention #${item.intervention}`,
              startDate: interventionById[item.intervention]?.start_date || '',
              endDate: interventionById[item.intervention]?.end_date || '',
              applications: 0,
              approved: 0,
              pending: 0,
              rejected: 0,
              assigned: 0,
            })
          }

          const target = rowsByInterventionId.get(item.intervention)
          target.applications += 1

          if (item.status === 'Approved') {
            target.approved += 1
          } else if (item.status === 'Pending') {
            target.pending += 1
          } else if (item.status === 'Rejected') {
            target.rejected += 1
          }
        })

        filteredDistributions.forEach((item) => {
          if (item.status === 'Cancelled') {
            return
          }

          const interventionId = inventoryInterventionById[item.input_inventory]

          if (!interventionId) {
            return
          }

          if (!rowsByInterventionId.has(interventionId)) {
            rowsByInterventionId.set(interventionId, {
              interventionId,
              interventionName:
                interventionById[interventionId]?.name ||
                `Intervention #${interventionId}`,
              startDate: interventionById[interventionId]?.start_date || '',
              endDate: interventionById[interventionId]?.end_date || '',
              applications: 0,
              approved: 0,
              pending: 0,
              rejected: 0,
              assigned: 0,
            })
          }

          const target = rowsByInterventionId.get(interventionId)
          target.assigned += 1
        })

        const rows = [...rowsByInterventionId.values()]
          .map((item) => ({
            ...item,
            awaitingAssignment: Math.max(item.approved - item.assigned, 0),
          }))
          .sort((left, right) => {
            if (right.applications !== left.applications) {
              return right.applications - left.applications
            }

            return right.awaitingAssignment - left.awaitingAssignment
          })

        const nextQueueItems = [
          farmersPendingVerification > 0
            ? {
                id: 'farmers-pending',
                label: `Verify ${farmersPendingVerification} farmer credential record(s).`,
                to: isAdmin
                  ? '/admin/users?verification_status=pending'
                  : '/staff/farmers',
              }
            : null,
          approvedAwaitingAssignment > 0
            ? {
                id: 'assignments-awaiting',
                label: `Assign inventory for ${approvedAwaitingAssignment} approved application(s).`,
                to: isAdmin
                  ? '/admin/inventory?distribution=pending&distribution_sort=date_asc'
                  : '/staff/distributions',
              }
            : null,
          pendingReleases > 0
            ? {
                id: 'releases-pending',
                label: `Release ${pendingReleases} prepared distribution record(s).`,
                to: isAdmin
                  ? '/admin/inventory?distribution=pending&distribution_sort=date_asc'
                  : '/staff/distributions',
              }
            : null,
          lowStockItems > 0
            ? {
                id: 'inventory-low',
                label: `${lowStockItems} inventory input(s) are at or below ${LOW_STOCK_THRESHOLD} units.`,
                to: isAdmin
                  ? '/admin/inventory?inventory=low-stock&inventory_sort=quantity_asc'
                  : '/staff/distributions',
              }
            : null,
        ].filter(Boolean)

        setMetrics({
          farmersPendingVerification,
          pendingApplications,
          approvedAwaitingAssignment,
          pendingReleases,
          lowStockItems,
          activeInterventions,
        })
        setInterventionRows(rows)
        setQueueItems(nextQueueItems)
        setLastUpdatedAt(new Date())

        if (failedSources.length > 0) {
          setError(
            `Some report data could not be loaded (${failedSources.join(', ')}).`,
          )
        }
      } finally {
        if (silent) {
          setIsRefreshing(false)
        } else {
          setIsLoading(false)
        }
      }
    },
    [dateFrom, dateTo, isAdmin],
  )

  useEffect(() => {
    loadReport()
  }, [loadReport])

  return (
    <section className="page-shell">
      <div className="page-hero">
        <div>
          <p className="eyebrow">Operations Intelligence</p>
          <h3 className="page-title">Operational Reports</h3>
          <p className="page-subtitle">
            Consolidated intervention, inventory, and distribution reporting for
            {` ${activeRole || 'authorized'} `}
            operations.
          </p>
        </div>
        <div className="page-hero-actions">
          <button
            type="button"
            className="ghost-button small"
            onClick={() => loadReport({ silent: true })}
            disabled={isRefreshing}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh Report'}
          </button>
        </div>
      </div>

      <article className="panel wide page-card">
        <div className="section-head">
          <h3>Report Filters</h3>
          <span className="section-chip">Date Range</span>
        </div>
        <div className="toolbar-row">
          <label htmlFor="reports-date-from">From</label>
          <input
            id="reports-date-from"
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
          />

          <label htmlFor="reports-date-to">To</label>
          <input
            id="reports-date-to"
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
          />

          <button
            type="button"
            className="ghost-button small"
            onClick={clearDateFilter}
            disabled={!hasDateFilter}
          >
            Clear Dates
          </button>
          <button
            type="button"
            className="ghost-button small"
            onClick={handleExportCsv}
            disabled={isLoading || interventionRows.length === 0}
          >
            Export CSV
          </button>
        </div>
        <p className="dashboard-queue-meta">
          Date filters apply to application and distribution activity; intervention
          scope follows overlapping intervention windows.
        </p>
      </article>

      {error ? <p className="error-text panel wide">{error}</p> : null}

      <div className="dashboard-grid">
        <MetricCard
          title="Pending Farmer Verification"
          value={isLoading ? '...' : String(metrics.farmersPendingVerification)}
          icon="person_search"
          tone="secondary"
          hint="Credential records awaiting review"
        />
        <MetricCard
          title="Pending Applications"
          value={isLoading ? '...' : String(metrics.pendingApplications)}
          icon="fact_check"
          tone="tertiary"
          hint="Applications currently in pending state"
        />
        <MetricCard
          title="Awaiting Assignment"
          value={isLoading ? '...' : String(metrics.approvedAwaitingAssignment)}
          icon="assignment"
          hint="Approved applications without a distribution assignment"
        />
        <MetricCard
          title="Pending Releases"
          value={isLoading ? '...' : String(metrics.pendingReleases)}
          icon="local_shipping"
          tone="warning"
          hint="Distribution records still pending release"
        />
        <MetricCard
          title="Inventory Alerts"
          value={isLoading ? '...' : String(metrics.lowStockItems)}
          icon="inventory_2"
          tone="error"
          hint={`Inputs with quantity <= ${LOW_STOCK_THRESHOLD}`}
        />
        <MetricCard
          title="Interventions in Scope"
          value={isLoading ? '...' : String(metrics.activeInterventions)}
          icon="campaign"
          tone="primary"
          hint={
            hasDateFilter
              ? 'Interventions overlapping selected range'
              : 'Intervention windows currently active'
          }
        />

        <article className="panel wide page-card">
          <div className="dashboard-queue-header">
            <h3>Report Action Queue</h3>
            <span className="section-chip">Actionable</span>
          </div>
          {lastUpdatedAt ? (
            <p className="dashboard-queue-meta">
              Last updated: {lastUpdatedAt.toLocaleString()}
            </p>
          ) : null}

          {isLoading ? <p>Loading report queue...</p> : null}

          {!isLoading && queueItems.length === 0 ? (
            <p>No immediate report actions found.</p>
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

        <article className="panel wide page-card">
          <div className="section-head">
            <h3>Intervention Demand Report</h3>
            <span className="section-chip">Live Data</span>
          </div>

          {isLoading ? <p>Loading intervention report...</p> : null}

          {!isLoading && interventionRows.length === 0 ? (
            <p>No intervention report data available yet.</p>
          ) : null}

          {!isLoading && interventionRows.length > 0 ? (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Intervention</th>
                    <th>Window</th>
                    <th>Applications</th>
                    <th>Approved</th>
                    <th>Pending</th>
                    <th>Rejected</th>
                    <th>Assigned</th>
                    <th>Awaiting Assignment</th>
                  </tr>
                </thead>
                <tbody>
                  {interventionRows.map((row) => (
                    <tr key={row.interventionId}>
                      <td>{row.interventionName}</td>
                      <td>
                        {formatDate(row.startDate)} - {formatDate(row.endDate)}
                      </td>
                      <td>{row.applications}</td>
                      <td>{row.approved}</td>
                      <td>{row.pending}</td>
                      <td>{row.rejected}</td>
                      <td>{row.assigned}</td>
                      <td>{row.awaitingAssignment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </article>
      </div>
    </section>
  )
}

export default OperationalReportsPage