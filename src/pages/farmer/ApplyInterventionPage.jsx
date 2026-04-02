import { useEffect, useState } from 'react'
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
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

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
    const intervention = interventions.find((item) => item.id === interventionId)
    return intervention ? intervention.name : `Intervention #${interventionId}`
  }

  return (
    <section className="panel">
      <h3>Apply for Intervention</h3>

      {error ? <p className="error-text">{error}</p> : null}
      {isLoading ? <p>Loading interventions...</p> : null}

      {!isLoading && interventions.length > 0 ? (
        <form className="stacked-form" onSubmit={handleSubmit}>
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
              {applications.map((item) => (
                <tr key={item.id}>
                  <td>{interventionNameById(item.intervention)}</td>
                  <td>{item.status}</td>
                  <td>{new Date(item.application_date).toLocaleDateString()}</td>
                  <td>{item.remarks || 'No remarks'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  )
}

export default ApplyInterventionPage
