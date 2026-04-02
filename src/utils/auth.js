const ROLE_HOME_PATHS = {
  Admin: '/admin/dashboard',
  Staff: '/staff/dashboard',
  Farmer: '/farmer/dashboard',
  Distributor: '/distributor/dashboard',
}

export function resolveActiveRole(roles = []) {
  return roles.find((role) => ROLE_HOME_PATHS[role]) ?? null
}

export function homePathForRole(role) {
  return ROLE_HOME_PATHS[role] ?? '/login'
}
