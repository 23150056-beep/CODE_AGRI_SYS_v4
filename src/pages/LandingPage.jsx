import { Link } from 'react-router-dom'

function LandingPage() {
  return (
    <main className="landing-page">
      <section className="hero-panel">
        <p className="eyebrow">Government Intervention Distribution</p>
        <h1>Track every bag, route, and delivery in one command center.</h1>
        <p>
          This starter build includes role-based dashboards for Admin, Staff,
          Farmer, and Distributor users with a clean path to connect the Django
          APIs.
        </p>
        <Link className="primary-button" to="/login">
          Access System
        </Link>
      </section>

      <section className="feature-grid">
        <article>
          <h2>Inventory Monitoring</h2>
          <p>See stock by intervention, product, and received date.</p>
        </article>
        <article>
          <h2>Farmer Verification</h2>
          <p>Manage credentials and intervention application statuses.</p>
        </article>
        <article>
          <h2>Mobile Delivery Updates</h2>
          <p>Distributors can update statuses with minimal taps.</p>
        </article>
      </section>
    </main>
  )
}

export default LandingPage
