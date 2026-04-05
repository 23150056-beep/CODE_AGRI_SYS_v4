import { useEffect, useMemo, useState } from 'react'
import {
  createFarmerApplication,
  getFarmerApplications,
  getFarmers,
} from '../../services/farmers'
import { getInterventions } from '../../services/programs'

function ApplyInterventionPage() {
  const [farmerId, setFarmerId] = useState(null)
  const [interventions, setInterventions] = useState([])
  const [applications, setApplications] = useState([])
  const [selectedInterventionId, setSelectedInterventionId] = useState('')
  const [remarks, setRemarks] = useState('')
  const [historyStatusFilter, setHistoryStatusFilter] = useState('all')
  const [historySearchTerm, setHistorySearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const pendingCount = useMemo(
    () =>
      applications.filter((item) => (item.status || '').toLowerCase() === 'pending')
        .length,
    [applications],
  )

  const approvedCount = useMemo(
    () =>
      applications.filter((item) => (item.status || '').toLowerCase() === 'approved')
        .length,
    [applications],
  )

  const rejectedCount = useMemo(
    () =>
      applications.filter((item) => (item.status || '').toLowerCase() === 'rejected')
        .length,
    [applications],
  )

  const interventionNameMap = useMemo(
    () =>
      Object.fromEntries(interventions.map((item) => [item.id, item.name])),
    [interventions],
  )

  const filteredApplications = useMemo(() => {
    const normalizedSearch = historySearchTerm.trim().toLowerCase()

    return applications.filter((item) => {
      const matchesStatus =
        historyStatusFilter === 'all'
          ? true
          : (item.status || '').toLowerCase() === historyStatusFilter

      if (!matchesStatus) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      return [
        interventionNameMap[item.intervention] || `Intervention #${item.intervention}`,
        item.status,
        item.remarks,
        String(item.id),
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedSearch))
    })
  }, [applications, historySearchTerm, historyStatusFilter, interventionNameMap])

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true)
        const [profiles, interventionList] = await Promise.all([
          getFarmers(),
          getInterventions(),
        ])

        const profile = profiles[0]
        if (!profile) {
          setError('No farmer profile is linked to your account yet.')
          return
        }

        const apps = await getFarmerApplications(profile.id)

        setFarmerId(profile.id)
        setInterventions(interventionList)
        setApplications(apps)

        if (interventionList.length > 0) {
          setSelectedInterventionId(String(interventionList[0].id))
        }
      } catch (requestError) {
        setError(
          requestError?.response?.data?.detail ||
            'Unable to load interventions and applications.',
        )
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()

    if (!farmerId || !selectedInterventionId) {
      setError('Select an intervention before applying.')
      return
    }

    try {
      setIsSubmitting(true)
      setError('')
      const created = await createFarmerApplication(farmerId, {
        intervention: Number(selectedInterventionId),
        remarks,
      })
      setApplications((prev) => [created, ...prev])
      setRemarks('')
    } catch (requestError) {
      const apiError = requestError?.response?.data
      const message =
        apiError?.non_field_errors?.[0] ||
        apiError?.detail ||
        'Unable to submit application.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  function interventionNameById(interventionId) {
    return interventionNameMap[interventionId] || `Intervention #${interventionId}`
  }

  return (
    <section className="page-shell">
      <div className="page-hero">
        <div>
          <p className="eyebrow">Farmer Applications</p>
          <h3 className="page-title">Apply for Intervention</h3>
          <p className="page-subtitle">
            Submit intervention requests and monitor status progression.
          </p>
        </div>
      </div>

      <article className="panel page-card page-card--elevated">

      <div className="dashboard-grid">
        <article className="metric-card">
          <p className="metric-card__title">Total Applications</p>
          <p className="metric-card__value">{applications.length}</p>
          <p className="metric-card__hint">Filed intervention requests</p>
        </article>
        <article className="metric-card">
          <p className="metric-card__title">Approved</p>
          <p className="metric-card__value">{approvedCount}</p>
          <p className="metric-card__hint">Ready for assignment</p>
        </article>
        <article className="metric-card">
          <p className="metric-card__title">Pending</p>
          <p className="metric-card__value">{pendingCount}</p>
          <p className="metric-card__hint">Awaiting staff review</p>
        </article>
      </div>

      {error ? <p className="error-text">{error}</p> : null}
      {isLoading ? <p>Loading interventions...</p> : null}

      {!isLoading && interventions.length > 0 ? (
        <form className="stacked-form" onSubmit={handleSubmit}>
          <div className="section-head">
            <h3>Create Application</h3>
            <span className="section-chip">Action</span>
          </div>
          <label htmlFor="intervention">Intervention</label>
          <select
            id="intervention"
            value={selectedInterventionId}
            onChange={(event) => setSelectedInterventionId(event.target.value)}
          >
            {interventions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <label htmlFor="remarks">Remarks</label>
          <textarea
            id="remarks"
            rows="3"
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
            placeholder="Optional details for staff review"
          />

          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      ) : null}

      {!isLoading && interventions.length === 0 ? (
        <p>No interventions are available for application yet.</p>
      ) : null}

      {!isLoading && applications.length > 0 ? (
        <div className="data-table-wrap top-gap">
          <div className="section-head">
            <h3>Application History</h3>
            <span className="section-chip">Recent</span>
          </div>

          <div className="toolbar-row">
            <label htmlFor="application-history-status">Status</label>
            <select
              id="application-history-status"
              value={historyStatusFilter}
              onChange={(event) => setHistoryStatusFilter(event.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <label htmlFor="application-history-search">Search</label>
            <input
              id="application-history-search"
              type="search"
              value={historySearchTerm}
              onChange={(event) => setHistorySearchTerm(event.target.value)}
              placeholder="Intervention, status, remarks, or ID"
            />
          </div>

          {filteredApplications.length === 0 ? (
            <p>No application records match your current filters.</p>
          ) : null}

          {rejectedCount > 0 ? (
            <p className="top-gap">
              <strong>{rejectedCount}</strong> rejected application(s) may need
              updated remarks and resubmission.
            </p>
          ) : null}

          {filteredApplications.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Intervention</th>
                <th>Status</th>
                <th>Applied On</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.map((item) => (
                <tr key={item.id}>
                  <td>{interventionNameById(item.intervention)}</td>
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
                </tr>
              ))}
            </tbody>
          </table>
          ) : null}
        </div>
      ) : null}
      </article>
    </section>
  )
}

export default ApplyInterventionPage
