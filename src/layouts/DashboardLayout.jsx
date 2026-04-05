import { NavLink, Outlet, useLocation } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

const LINKS_BY_ROLE = {
  Admin: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { to: '/admin/users', label: 'Users', icon: 'group' },
    { to: '/admin/programs', label: 'Programs', icon: 'campaign' },
    { to: '/admin/inventory', label: 'Inventory', icon: 'inventory_2' },
    {
      to: '/admin/distributions',
      label: 'Distribution Management',
      icon: 'local_shipping',
    },
    { to: '/admin/reports', label: 'Reports', icon: 'analytics' },
  ],
  Staff: [
    { to: '/staff/dashboard', label: 'Dashboard', icon: 'dashboard' },
    {
      to: '/staff/farmers',
      label: 'Farmer Verification',
      icon: 'agriculture',
    },
    {
      to: '/staff/distributions',
      label: 'Distribution Assignment',
      icon: 'local_shipping',
    },
    {
      to: '/staff/reports',
      label: 'Reports',
      icon: 'analytics',
    },
  ],
  Farmer: [
    { to: '/farmer/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { to: '/farmer/profile', label: 'Profile', icon: 'badge' },
    {
      to: '/farmer/interventions',
      label: 'Apply Intervention',
      icon: 'assignment',
    },
  ],
  Distributor: [
    { to: '/distributor/dashboard', label: 'Dashboard', icon: 'dashboard' },
    {
      to: '/distributor/deliveries',
      label: 'Deliveries',
      icon: 'local_shipping',
    },
  ],
}

function DashboardLayout() {
  const location = useLocation()
  const { user, activeRole, logout } = useAuth()
  const links = LINKS_BY_ROLE[activeRole] ?? []
  const firstActionLink = links[1] ?? links[0] ?? null

  function pageThemeClass(pathname) {
    const routeThemes = {
      '/admin/dashboard': 'route-admin-dashboard',
      '/admin/users': 'route-admin-users',
      '/admin/programs': 'route-admin-programs',
      '/admin/inventory': 'route-admin-inventory',
      '/admin/distributions': 'route-staff-distributions',
      '/admin/reports': 'route-admin-reports',
      '/staff/dashboard': 'route-staff-dashboard',
      '/staff/farmers': 'route-staff-farmers',
      '/staff/distributions': 'route-staff-distributions',
      '/staff/reports': 'route-staff-reports',
      '/farmer/dashboard': 'route-farmer-dashboard',
      '/farmer/profile': 'route-farmer-profile',
      '/farmer/interventions': 'route-farmer-interventions',
      '/distributor/dashboard': 'route-distributor-dashboard',
      '/distributor/deliveries': 'route-distributor-deliveries',
    }

    return routeThemes[pathname] || 'route-generic'
  }

  const activeThemeClass = pageThemeClass(location.pathname)

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar glass-nav">
        <div className="dashboard-brand-block">
          <div className="dashboard-brand-icon">
            <span className="material-symbols-outlined">agriculture</span>
          </div>
          <div>
            <h1 className="sidebar-title">The Cultivated Ledger</h1>
            <p className="sidebar-subtitle">State Logistics Portal</p>
          </div>
        </div>

        {firstActionLink ? (
          <NavLink to={firstActionLink.to} className="primary-button sidebar-cta">
            <span className="material-symbols-outlined">add</span>
            New Record
          </NavLink>
        ) : null}

        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              className={({ isActive }) =>
                `sidebar-link${isActive ? ' active' : ''}`
              }
              to={link.to}
            >
              <span className="material-symbols-outlined sidebar-link-icon">
                {link.icon}
              </span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="ghost-button" onClick={logout}>
            <span className="material-symbols-outlined">logout</span>
            Sign out
          </button>
        </div>
      </aside>

      <main className="dashboard-content">
        <header className="dashboard-topbar glass-nav">
          <div className="dashboard-topbar-search">
            <span className="material-symbols-outlined">search</span>
            <input
              type="text"
              placeholder="Search records, queues, and interventions..."
              aria-label="Search dashboard"
            />
          </div>
          <div className="dashboard-topbar-actions">
            <button type="button" className="icon-button" aria-label="Notifications">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button type="button" className="icon-button" aria-label="Help">
              <span className="material-symbols-outlined">help_outline</span>
            </button>
            <div className="topbar-user-meta">
              <p>{user?.username || 'User'}</p>
              <span>{activeRole || 'Role'}</span>
            </div>
            <span className="role-pill">{activeRole}</span>
          </div>
        </header>

        <section className={`dashboard-main ${activeThemeClass}`}>
          <Outlet />
        </section>
      </main>
    </div>
  )
}

export default DashboardLayout
