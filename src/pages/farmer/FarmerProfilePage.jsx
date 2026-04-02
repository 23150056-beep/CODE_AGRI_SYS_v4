import { useEffect, useMemo, useState } from 'react'
import { getFarmers, updateFarmerProfile } from '../../services/farmers'

function FarmerProfilePage() {
  const [profile, setProfile] = useState(null)
  const [formState, setFormState] = useState({
    contact_number: '',
    farm_location: '',
    planting_season: '',
    address: '',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const fullName = useMemo(() => {
    if (!profile) return ''
    return `${profile.first_name} ${profile.last_name}`
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
        setFormState({
          contact_number: selfProfile.contact_number ?? '',
          farm_location: selfProfile.farm_location ?? '',
          planting_season: selfProfile.planting_season ?? '',
          address: selfProfile.address ?? '',
        })
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

  async function handleSubmit(event) {
    event.preventDefault()

    if (!profile) return

    try {
      setIsSaving(true)
      setError('')
      setSuccessMessage('')
      const updated = await updateFarmerProfile(profile.id, formState)
      setProfile(updated)
      setSuccessMessage('Profile updated successfully.')
    } catch (requestError) {
      setError(
        requestError?.response?.data?.detail ||
          'Unable to save profile changes.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  function handleInputChange(event) {
    const { name, value } = event.target
    setFormState((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <section className="panel">
      <h3>Farmer Profile</h3>

      {error ? <p className="error-text">{error}</p> : null}
      {successMessage ? <p className="success-text">{successMessage}</p> : null}

      {isLoading ? <p>Loading profile...</p> : null}

      {!isLoading && profile ? (
        <form className="stacked-form" onSubmit={handleSubmit}>
          <p>
            <strong>Name:</strong> {fullName}
          </p>
          <p>
            <strong>Credentials Status:</strong> {profile.credentials_status}
          </p>

          <label htmlFor="contact_number">Contact Number</label>
          <input
            id="contact_number"
            name="contact_number"
            value={formState.contact_number}
            onChange={handleInputChange}
          />

          <label htmlFor="farm_location">Farm Location</label>
          <input
            id="farm_location"
            name="farm_location"
            value={formState.farm_location}
            onChange={handleInputChange}
          />

          <label htmlFor="planting_season">Planting Season</label>
          <input
            id="planting_season"
            name="planting_season"
            value={formState.planting_season}
            onChange={handleInputChange}
          />

          <label htmlFor="address">Address</label>
          <textarea
            id="address"
            name="address"
            rows="3"
            value={formState.address}
            onChange={handleInputChange}
          />

          <button type="submit" className="primary-button" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      ) : null}
    </section>
  )
}

export default FarmerProfilePage
