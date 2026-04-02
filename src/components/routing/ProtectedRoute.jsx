import { Navigate, Outlet, useLocation } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import { homePathForRole } from '../../utils/auth'

function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, activeRole } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && !allowedRoles.includes(activeRole)) {
    return <Navigate to={homePathForRole(activeRole)} replace />
  }

  return <Outlet />
}

export default ProtectedRoute
