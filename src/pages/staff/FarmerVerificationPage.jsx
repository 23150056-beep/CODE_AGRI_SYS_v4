import { useEffect, useMemo, useState } from 'react'
import { getFarmers, verifyFarmerCredentials } from '../../services/farmers'

const STATUS_OPTIONS = ['Verified', 'Pending', 'Rejected']

function FarmerVerificationPage() {
  const [farmers, setFarmers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [error, setError] = useState('')

  const filteredFarmers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return farmers.filter((farmer) => {
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : (farmer.credentials_status || '').toLowerCase() === statusFilter

      if (!matchesStatus) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      return [
        `${farmer.last_name}, ${farmer.first_name}`,
        farmer.contact_number,
        farmer.farm_location,
        farmer.address,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedSearch))
    })
  }, [farmers, searchTerm, statusFilter])

  const verifiedCount = useMemo(
    () =>
      farmers.filter(
        (farmer) => (farmer.credentials_status || '').toLowerCase() === 'verified',
      ).length,
    [farmers],
  )

  const pendingCount = useMemo(
    () =>
      farmers.filter(
        (farmer) => (farmer.credentials_status || '').toLowerCase() === 'pending',
      ).length,
    [farmers],
  )

  const rejectedCount = useMemo(
    () =>
      farmers.filter(
        (farmer) => (farmer.credentials_status || '').toLowerCase() === 'rejected',
      ).length,
    [farmers],
  )

  useEffect(() => {
    async function fetchFarmers() {
      try {
        setIsLoading(true)
        const data = await getFarmers()
        setFarmers(data)
      } catch (requestError) {
        setError(
          requestError?.response?.data?.detail ||
            'Unable to load farmers for verification.',
        )
      } finally {
        setIsLoading(false)
      }
    }

    fetchFarmers()
  }, [])

  async function handleStatusChange(farmer, nextStatus) {
    try {
      setError('')
      const result = await verifyFarmerCredentials(farmer.id, {
        credentials_status: nextStatus,
      })
      setFarmers((prev) =>
        prev.map((item) =>
          item.id === farmer.id ? { ...item, ...result.profile } : item,
        ),
      )
    } catch (requestError) {
      setError(
        requestError?.response?.data?.detail ||
          'Failed to update credentials status.',
      )
    }
  }

  return (
    <section className="page-shell">
      <div className="page-hero">
        <div>
          <p className="eyebrow">Staff Validation Desk</p>
          <h3 className="page-title">Farmer Verification</h3>
          <p className="page-subtitle">
            Validate community agricultural producers and update credential status.
          </p>
        </div>
      </div>

      <article className="panel page-card page-card--elevated">

      <div className="dashboard-grid">
        <article className="metric-card">
          <p className="metric-card__title">Awaiting Review</p>
          <p className="metric-card__value">{pendingCount}</p>
          <p className="metric-card__hint">Pending verification queue</p>
        </article>
        <article className="metric-card">
          <p className="metric-card__title">Verified Farmers</p>
          <p className="metric-card__value">{verifiedCount}</p>
          <p className="metric-card__hint">Approved credentials</p>
        </article>
        <article className="metric-card">
          <p className="metric-card__title">Rejected Records</p>
          <p className="metric-card__value">{rejectedCount}</p>
          <p className="metric-card__hint">Needs follow-up remediation</p>
        </article>
      </div>

      <div className="toolbar-row top-gap">
        <label htmlFor="verification-status-filter">Status Filter</label>
        <select
          id="verification-status-filter"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </select>

        <label htmlFor="verification-search">Search</label>
        <input
          id="verification-search"
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Name, contact, location, or address"
        />
      </div>

      {error ? <p className="error-text">{error}</p> : null}

      {isLoading ? <p>Loading farmer records...</p> : null}

      {!isLoading && filteredFarmers.length === 0 ? (
        <p>No farmers found yet.</p>
      ) : null}

      {!isLoading && filteredFarmers.length > 0 ? (
        <div className="data-table-wrap">
          <div className="section-head">
            <h4>Pending Applications</h4>
            <span className="section-chip">Live Queue</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Farmer</th>
                <th>Contact</th>
                <th>Location</th>
                <th>Status</th>
                <th>Update</th>
              </tr>
            </thead>
            <tbody>
              {filteredFarmers.map((farmer) => (
                <tr key={farmer.id}>
                  <td>{farmer.last_name}, {farmer.first_name}</td>
                  <td>{farmer.contact_number}</td>
                  <td>{farmer.farm_location}</td>
                  <td>
                    <span
                      className={`status-pill ${
                        farmer.credentials_status === 'Verified'
                          ? 'status-pill--active'
                          : farmer.credentials_status === 'Rejected'
                            ? 'status-pill--inactive'
                            : 'status-pill--warning'
                      }`}
                    >
                      {farmer.credentials_status}
                    </span>
                  </td>
                  <td>
                    <div className="inline-actions">
                      {STATUS_OPTIONS.map((status) => (
                        <button
                          key={status}
                          type="button"
                          className="ghost-button small"
                          onClick={() => handleStatusChange(farmer, status)}
                          disabled={farmer.credentials_status === status}
                        >
                          {status}
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
      </article>
    </section>
  )
}

export default FarmerVerificationPage
