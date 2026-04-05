import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import { homePathForRole } from '../utils/auth'

function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [staySignedIn, setStaySignedIn] = useState(true)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!username.trim() || !password) {
      setError('Please enter your username and password.')
      return
    }

    try {
      setIsSubmitting(true)
      const session = await login({ username, password })

      const redirect =
        location.state?.from?.pathname || homePathForRole(session.activeRole)
      navigate(redirect, { replace: true })
    } catch (requestError) {
      setError(
        requestError?.response?.data?.detail ||
          requestError?.message ||
          'Unable to sign in at this time.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-brand-block">
        <div className="auth-brand-icon">
          <span className="material-symbols-outlined">agriculture</span>
        </div>
        <h1>Bauang Agricultural Trade Center</h1>
        <p>The Cultivated Ledger</p>
      </section>

      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-card-head">
          <p className="eyebrow">DMS Sign In</p>
          <h2>Welcome back</h2>
          <p>Official access point for authorized agricultural logistics users.</p>
        </div>

        <label htmlFor="username">Username</label>
        <div className="auth-input-wrap">
          <span className="material-symbols-outlined">person</span>
          <input
            id="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="e.g. staff.bauang"
            autoComplete="username"
          />
        </div>

        <div className="auth-label-row">
          <label htmlFor="password">Password</label>
          <button type="button" className="auth-inline-link" onClick={() => setPassword('')}>
            Clear
          </button>
        </div>
        <div className="auth-input-wrap">
          <span className="material-symbols-outlined">lock</span>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
          <button
            type="button"
            className="auth-visibility-toggle"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            <span className="material-symbols-outlined">
              {showPassword ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        </div>

        <label className="checkbox-row" htmlFor="remember-login">
          <input
            id="remember-login"
            type="checkbox"
            checked={staySignedIn}
            onChange={(event) => setStaySignedIn(event.target.checked)}
          />
          Stay signed in for this device
        </label>

        {error ? <p className="error-text">{error}</p> : null}

        <button type="submit" className="primary-button" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Sign In'}
          {!isSubmitting ? (
            <span className="material-symbols-outlined">arrow_forward</span>
          ) : null}
        </button>

        <div className="auth-meta-links">
          <Link to="/">Public Portal</Link>
          <a href="#">Help Center</a>
        </div>
      </form>
    </main>
  )
}

export default LoginPage
