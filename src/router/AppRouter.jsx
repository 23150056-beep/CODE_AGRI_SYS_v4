import { Navigate, Route, Routes } from 'react-router-dom'
import DashboardLayout from '../layouts/DashboardLayout'
import ProtectedRoute from '../components/routing/ProtectedRoute'
import LandingPage from '../pages/LandingPage'
import LoginPage from '../pages/LoginPage'
import NotFoundPage from '../pages/NotFoundPage'
import AdminDashboardPage from '../pages/admin/AdminDashboardPage'
import InventoryManagementPage from '../pages/admin/InventoryManagementPage'
import ProgramManagementPage from '../pages/admin/ProgramManagementPage'
import UserManagementPage from '../pages/admin/UserManagementPage'
import DistributorDashboardPage from '../pages/distributor/DistributorDashboardPage'
import DeliveryStatusPage from '../pages/distributor/DeliveryStatusPage'
import ApplyInterventionPage from '../pages/farmer/ApplyInterventionPage'
import FarmerDashboardPage from '../pages/farmer/FarmerDashboardPage'
import FarmerProfilePage from '../pages/farmer/FarmerProfilePage'
import DistributionAssignmentPage from '../pages/staff/DistributionAssignmentPage'
import FarmerVerificationPage from '../pages/staff/FarmerVerificationPage'
import StaffDashboardPage from '../pages/staff/StaffDashboardPage'

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<UserManagementPage />} />
          <Route path="/admin/programs" element={<ProgramManagementPage />} />
          <Route path="/admin/inventory" element={<InventoryManagementPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['Staff']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/staff/dashboard" element={<StaffDashboardPage />} />
          <Route path="/staff/farmers" element={<FarmerVerificationPage />} />
          <Route
            path="/staff/distributions"
            element={<DistributionAssignmentPage />}
          />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['Farmer']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/farmer/dashboard" element={<FarmerDashboardPage />} />
          <Route path="/farmer/profile" element={<FarmerProfilePage />} />
          <Route
            path="/farmer/interventions"
            element={<ApplyInterventionPage />}
          />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['Distributor']} />}>
        <Route element={<DashboardLayout />}>
          <Route
            path="/distributor/dashboard"
            element={<DistributorDashboardPage />}
          />
          <Route
            path="/distributor/deliveries"
            element={<DeliveryStatusPage />}
          />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
      <Route path="/dashboard" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default AppRouter
