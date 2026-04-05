import { Link } from 'react-router-dom'
import MetricCard from '../../components/common/MetricCard'

function FarmerDashboardPage() {
  return (
    <section className="page-shell">
      <div className="page-hero">
        <div>
          <p className="eyebrow">Farmer Portal</p>
          <h3 className="page-title">Farmer Dashboard</h3>
          <p className="page-subtitle">
            Review application progress, delivery updates, and profile readiness.
          </p>
        </div>
      </div>

      <div className="dashboard-grid">
        <MetricCard
          title="Application Status"
          value="Pending"
          icon="fact_check"
          tone="secondary"
          hint="Rice seed intervention"
        />
        <MetricCard
          title="Recent Deliveries"
          value="2"
          icon="local_shipping"
          tone="tertiary"
          hint="Last update: Mar 29"
        />
        <MetricCard
          title="Planting Season"
          value="Wet Season"
          icon="grass"
          hint="Editable from profile"
        />

        <article className="panel wide page-card">
          <div className="section-head">
            <h3>Farmer Actions</h3>
            <span className="section-chip">Quick Guide</span>
          </div>
          <ul>
            <li>
              <Link to="/farmer/profile" className="dashboard-queue-link">
                Update contact number and farm location metadata.
              </Link>
            </li>
            <li>
              <Link to="/farmer/interventions" className="dashboard-queue-link">
                Submit intervention application with latest requirements.
              </Link>
            </li>
            <li>
              <Link to="/farmer/interventions" className="dashboard-queue-link">
                Track distribution status from assigned distributor.
              </Link>
            </li>
          </ul>
        </article>
      </div>
    </section>
  )
}

export default FarmerDashboardPage
