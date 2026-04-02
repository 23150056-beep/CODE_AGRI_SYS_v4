import MetricCard from '../../components/common/MetricCard'

function FarmerDashboardPage() {
  return (
    <section className="dashboard-grid">
      <MetricCard title="Application Status" value="Pending" hint="Rice seed intervention" />
      <MetricCard title="Recent Deliveries" value="2" hint="Last update: Mar 29" />
      <MetricCard title="Planting Season" value="Wet Season" hint="Editable from profile" />

      <article className="panel wide">
        <h3>Farmer Actions</h3>
        <ul>
          <li>Update contact number and farm location metadata.</li>
          <li>Submit intervention application with latest requirements.</li>
          <li>Track distribution status from assigned distributor.</li>
        </ul>
      </article>
    </section>
  )
}

export default FarmerDashboardPage
