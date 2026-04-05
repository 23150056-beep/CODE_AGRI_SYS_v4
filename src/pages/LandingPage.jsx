import { Link } from 'react-router-dom'

function LandingPage() {
  return (
    <main className="landing-shell">
      <header className="landing-topbar glass-nav">
        <div className="landing-logo">
          <span className="material-symbols-outlined">agriculture</span>
          <strong>Bauang DMS</strong>
        </div>
        <nav className="landing-nav" aria-label="Primary">
          <a href="#features">Features</a>
          <a href="#roles">Roles</a>
          <a href="#footer">Support</a>
        </nav>
        <Link className="primary-button" to="/login">
          Access System
        </Link>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-content">
          <p className="eyebrow">State Logistics Portal</p>
          <h1>
            Track every bag, route, and delivery in one command center.
          </h1>
          <p>
            The Cultivated Ledger provides role-aware monitoring for Admin, Staff,
            Farmers, and Distributors with audit-ready inventory and delivery flows.
          </p>
          <div className="landing-hero-actions">
            <Link className="primary-button" to="/login">
              Sign In
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
            <a className="ghost-button" href="#features">
              Learn More
            </a>
          </div>
          <div className="landing-trust-row">
            <span>
              <i className="material-symbols-outlined">verified_user</i>
              Verified Assets
            </span>
            <span>
              <i className="material-symbols-outlined">security</i>
              Encrypted Ledger
            </span>
          </div>
        </div>

        <aside className="landing-hero-card">
          <div className="landing-hero-card-head">
            <h3>Live Operations Snapshot</h3>
            <span className="section-chip">Bauang Center</span>
          </div>
          <ul>
            <li>
              <strong>Inventory Monitoring</strong>
              <small>Track low-stock thresholds and release readiness.</small>
            </li>
            <li>
              <strong>Farmer Verification</strong>
              <small>Review eligibility and credential status changes.</small>
            </li>
            <li>
              <strong>Delivery Status</strong>
              <small>Update in-field progress with full timeline history.</small>
            </li>
          </ul>
        </aside>
      </section>

      <section id="features" className="landing-feature-section">
        <div className="landing-feature-head">
          <p className="eyebrow">System Capabilities</p>
          <h2>Engineered for Agricultural Resilience</h2>
        </div>
        <div className="landing-feature-grid">
          <article>
            <span className="material-symbols-outlined">inventory_2</span>
            <h3>Inventory Monitoring</h3>
            <p>Batch-level visibility with low-stock forecasting and expiry awareness.</p>
          </article>
          <article>
            <span className="material-symbols-outlined">verified</span>
            <h3>Farmer Verification</h3>
            <p>Credential and profile validation to protect fair intervention access.</p>
          </article>
          <article>
            <span className="material-symbols-outlined">route</span>
            <h3>Mobile Delivery Updates</h3>
            <p>Distributor-led route progression and delivery confirmations.</p>
          </article>
          <article>
            <span className="material-symbols-outlined">campaign</span>
            <h3>Program Windows</h3>
            <p>Intervention periods with date-aware filtering and queue management.</p>
          </article>
          <article>
            <span className="material-symbols-outlined">assignment</span>
            <h3>Distribution Assignment</h3>
            <p>Link approved applications to inventory and assigned distributors.</p>
          </article>
          <article>
            <span className="material-symbols-outlined">analytics</span>
            <h3>Operational Reporting</h3>
            <p>Role-level summaries for planning, monitoring, and decision support.</p>
          </article>
        </div>
      </section>

      <section id="roles" className="landing-roles-section">
        <h2>Tailored Experience for Every Stakeholder</h2>
        <div className="landing-role-grid">
          <article>
            <h3>Admin</h3>
            <p>Program governance, user-role control, and cross-module monitoring.</p>
          </article>
          <article>
            <h3>Staff</h3>
            <p>Verification queues, assignment workflows, and release operations.</p>
          </article>
          <article>
            <h3>Farmer</h3>
            <p>Profile maintenance, intervention applications, and status tracking.</p>
          </article>
          <article>
            <h3>Distributor</h3>
            <p>Delivery status updates with complete timeline audit visibility.</p>
          </article>
        </div>
      </section>

      <footer id="footer" className="landing-footer">
        <p>Bauang Agricultural Trade Center Distribution Management System</p>
        <div>
          <a href="#features">Capabilities</a>
          <a href="#roles">Role Access</a>
          <Link to="/login">Sign In</Link>
        </div>
      </footer>
    </main>
  )
}

export default LandingPage
