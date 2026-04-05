function MetricCard({ title, value, hint, icon = 'analytics', tone = 'primary' }) {
  return (
    <article className="metric-card">
      <div className="metric-card__top">
        <div className={`metric-card__icon metric-card__icon--${tone}`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
      </div>
      <p className="metric-card__title">{title}</p>
      <p className="metric-card__value">{value}</p>
      <p className="metric-card__hint">{hint}</p>
    </article>
  )
}

export default MetricCard
