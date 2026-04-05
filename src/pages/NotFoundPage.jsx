import { Link, useNavigate } from 'react-router-dom'

function NotFoundPage() {
  const navigate = useNavigate()

  const handleRetry = () => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }

    navigate('/', { replace: true })
  }

  return (
    <main className="centered-page">
      <section className="notfound-shell">
        <div className="notfound-mark">404</div>
        <div className="notfound-card">
          <div className="notfound-icon">
            <span className="material-symbols-outlined">leak_remove</span>
          </div>
          <h1>Page not found</h1>
          <p>
            The page you requested does not exist in this build. It may have been
            moved or archived from the active workflow.
          </p>
          <div className="notfound-actions">
            <Link to="/" className="primary-button">
              <span className="material-symbols-outlined">home</span>
              Return Home
            </Link>
            <button
              type="button"
              className="ghost-button"
              onClick={handleRetry}
            >
              <span className="material-symbols-outlined">refresh</span>
              Retry Request
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}

export default NotFoundPage
