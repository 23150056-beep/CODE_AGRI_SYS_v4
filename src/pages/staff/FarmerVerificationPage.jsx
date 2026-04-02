import { useEffect, useState } from 'react'
import { getFarmers, verifyFarmerCredentials } from '../../services/farmers'

const STATUS_OPTIONS = ['Verified', 'Pending', 'Rejected']

function FarmerVerificationPage() {
  const [farmers, setFarmers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

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
    <section className="panel">
      <h3>Farmer Verification</h3>

      {error ? <p className="error-text">{error}</p> : null}

      {isLoading ? <p>Loading farmer records...</p> : null}

      {!isLoading && farmers.length === 0 ? (
        <p>No farmers found yet.</p>
      ) : null}

      {!isLoading && farmers.length > 0 ? (
        <div className="data-table-wrap">
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
              {farmers.map((farmer) => (
                <tr key={farmer.id}>
                  <td>{farmer.last_name}, {farmer.first_name}</td>
                  <td>{farmer.contact_number}</td>
                  <td>{farmer.farm_location}</td>
                  <td>{farmer.credentials_status}</td>
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
    </section>
  )
}

export default FarmerVerificationPage
