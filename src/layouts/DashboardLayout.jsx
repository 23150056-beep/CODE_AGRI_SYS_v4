import { Link, Outlet } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

const LINKS_BY_ROLE = {
  Admin: [
    { to: '/admin/dashboard', label: 'Dashboard' },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/programs', label: 'Programs' },
    { to: '/admin/inventory', label: 'Inventory' },
  ],
  Staff: [
    { to: '/staff/dashboard', label: 'Dashboard' },
    { to: '/staff/farmers', label: 'Farmer Verification' },
    { to: '/staff/distributions', label: 'Distribution Assignment' },
  ],
  Farmer: [
    { to: '/farmer/dashboard', label: 'Dashboard' },
    { to: '/farmer/profile', label: 'Profile' },
    { to: '/farmer/interventions', label: 'Apply Intervention' },
  ],
  Distributor: [
    { to: '/distributor/dashboard', label: 'Dashboard' },
    { to: '/distributor/deliveries', label: 'Deliveries' },
  ],
}

function DashboardLayout() {
  const { user, activeRole, logout } = useAuth()
  const links = LINKS_BY_ROLE[activeRole] ?? []

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div>
          <p className="eyebrow">Bauang Agricultural Trade Center</p>
          <h1 className="sidebar-title">Distribution Management System</h1>
        </div>

        <nav>
          {links.map((link) => (
            <Link key={link.to} className="sidebar-link" to={link.to}>
              {link.label}
            </Link>
          ))}
        </nav>

        <button type="button" className="ghost-button" onClick={logout}>
          Sign out
        </button>
      </aside>

      <main className="dashboard-content">
        <header className="dashboard-header">
          <p className="eyebrow">Signed in as</p>
          <h2>
            {user?.username} <span className="role-pill">{activeRole}</span>
          </h2>
        </header>

        <Outlet />
      </main>
    </div>
  )
}

export default DashboardLayout
