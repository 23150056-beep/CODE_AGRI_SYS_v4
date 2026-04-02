function MetricCard({ title, value, hint }) {
  return (
    <article className="metric-card">
      <p className="metric-card__title">{title}</p>
      <p className="metric-card__value">{value}</p>
      <p className="metric-card__hint">{hint}</p>
    </article>
  )
}

export default MetricCard
