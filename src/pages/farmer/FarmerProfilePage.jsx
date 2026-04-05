import { useEffect, useMemo, useState } from 'react'
import { getFarmers } from '../../services/farmers'

function FarmerProfilePage() {
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const fullName = useMemo(() => {
    if (!profile) return ''
    return `${profile.first_name} ${profile.last_name}`
  }, [profile])

  const profileStatusTone = useMemo(() => {
    if (!profile) {
      return 'status-pill--warning'
    }

    if (profile.credentials_status === 'Verified') {
      return 'status-pill--active'
    }

    if (profile.credentials_status === 'Rejected') {
      return 'status-pill--inactive'
    }

    return 'status-pill--warning'
  }, [profile])

  useEffect(() => {
    async function fetchProfile() {
      try {
        setIsLoading(true)
        const records = await getFarmers()
        const selfProfile = records[0]

        if (!selfProfile) {
          setError('No farmer profile is linked to this account yet.')
          return
        }

        setProfile(selfProfile)
      } catch (requestError) {
        setError(
          requestError?.response?.data?.detail ||
            'Unable to load your farmer profile.',
        )
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [])

  return (
    <section className="page-shell">
      <div className="page-hero">
        <div>
          <p className="eyebrow">Farmer Identity</p>
          <h3 className="page-title">Farmer Profile</h3>
          <p className="page-subtitle">
            Your profile is view-only. Contact an admin for any corrections.
          </p>
        </div>
      </div>

      <article className="panel page-card page-card--elevated">

      {error ? <p className="error-text">{error}</p> : null}

      {isLoading ? <p>Loading profile...</p> : null}

      {!isLoading && profile ? (
        <>
        <div className="dashboard-grid">
          <article className="metric-card">
            <p className="metric-card__title">Verification</p>
            <p className="metric-card__value">{profile.credentials_status}</p>
            <p className="metric-card__hint">Current profile credential status</p>
          </article>
          <article className="metric-card">
            <p className="metric-card__title">Planting Season</p>
            <p className="metric-card__value">{profile.planting_season || 'N/A'}</p>
            <p className="metric-card__hint">Recorded seasonal cycle</p>
          </article>
          <article className="metric-card">
            <p className="metric-card__title">Farm Location</p>
            <p className="metric-card__value">{profile.farm_location || 'N/A'}</p>
            <p className="metric-card__hint">Primary farming site</p>
          </article>
        </div>

        <div className="dashboard-grid top-gap">
          <article className="panel">
            <div className="section-head">
              <h3>Profile Summary</h3>
              <span className={`status-pill ${profileStatusTone}`}>
                {profile.credentials_status}
              </span>
            </div>

            <p>
              <strong>Name:</strong> {fullName}
            </p>
            <p>
              <strong>Contact:</strong> {profile.contact_number || 'N/A'}
            </p>
            <p>
              <strong>Address:</strong> {profile.address || 'N/A'}
            </p>
            <p>
              <strong>Farmer ID:</strong> #{profile.id}
            </p>
          </article>

        <article className="panel stacked-form">
          <div className="section-head">
            <h3>Profile Details</h3>
            <span className="section-chip">Read-only</span>
          </div>

          <label htmlFor="profile-name">Full Name</label>
          <input id="profile-name" value={fullName} readOnly />

          <label htmlFor="profile-status">Credentials Status</label>
          <input id="profile-status" value={profile.credentials_status} readOnly />

          <label htmlFor="contact_number">Contact Number</label>
          <input
            id="contact_number"
            value={profile.contact_number || ''}
            readOnly
          />

          <label htmlFor="farm_location">Farm Location</label>
          <input
            id="farm_location"
            value={profile.farm_location || ''}
            readOnly
          />

          <label htmlFor="planting_season">Planting Season</label>
          <input
            id="planting_season"
            value={profile.planting_season || ''}
            readOnly
          />

          <label htmlFor="address">Address</label>
          <textarea
            id="address"
            rows="3"
            value={profile.address || ''}
            readOnly
          />

          <p className="top-gap">
            Submit any profile changes to the admin for review and update.
          </p>
        </article>
        </div>
        </>
      ) : null}
      </article>
    </section>
  )
}

export default FarmerProfilePage
