import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <main className="centered-page">
      <h1>Page not found</h1>
      <p>The page you requested does not exist in this build.</p>
      <Link to="/" className="primary-button">
        Return Home
      </Link>
    </main>
  )
}

export default NotFoundPage
