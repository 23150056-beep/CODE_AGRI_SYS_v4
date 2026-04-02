import MetricCard from '../../components/common/MetricCard'

function StaffDashboardPage() {
  return (
    <section className="dashboard-grid">
      <MetricCard title="Farmers Pending Verification" value="18" hint="Needs credential check" />
      <MetricCard title="Interventions Open" value="7" hint="Accepting applications" />
      <MetricCard title="Distributions to Assign" value="14" hint="Need distributor mapping" />

      <article className="panel wide">
        <h3>Today&apos;s Staff Priorities</h3>
        <ul>
          <li>Verify submitted farm location documents.</li>
          <li>Approve intervention requests for wet season package.</li>
          <li>Assign unresolved deliveries to available trucks.</li>
        </ul>
      </article>
    </section>
  )
}

export default StaffDashboardPage
