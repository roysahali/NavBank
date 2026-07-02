import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import PrivateRoute from './components/PrivateRoute'

import Login from './pages/Login'
import Register from './pages/Register'

// Customer pages
import CustomerDashboard from './pages/customer/Dashboard'
import CustomerAccounts from './pages/customer/Accounts'
import CustomerTransactions from './pages/customer/Transactions'
import CustomerTransfer from './pages/customer/Transfer'
import CustomerUPI from './pages/customer/UPI'
import CustomerCreditCards from './pages/customer/CreditCards'
import CustomerLoans from './pages/customer/Loans'
import CustomerReports from './pages/customer/Reports'
import CustomerNotifications from './pages/customer/Notifications'
import CustomerSupport from './pages/customer/Support'
import CustomerChat from './pages/customer/Chat'
import CustomerInsurance from './pages/customer/Insurance'

// Admin pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminAccounts from './pages/admin/Accounts'
import AdminTransactions from './pages/admin/Transactions'
import AdminSupport from './pages/admin/Support'
import AdminDeposits from './pages/admin/Deposits'
import AdminAuditLog from './pages/admin/AuditLog'
import AdminLoanApplications from './pages/admin/LoanApplications'
import AdminUserProfile from './pages/admin/UserProfile'

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
      <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Customer routes */}
          <Route path="/dashboard" element={<PrivateRoute role="customer"><CustomerDashboard /></PrivateRoute>} />
          <Route path="/accounts" element={<PrivateRoute role="customer"><CustomerAccounts /></PrivateRoute>} />
          <Route path="/transactions" element={<PrivateRoute role="customer"><CustomerTransactions /></PrivateRoute>} />
          <Route path="/transfer" element={<PrivateRoute role="customer"><CustomerTransfer /></PrivateRoute>} />
          <Route path="/upi" element={<PrivateRoute role="customer"><CustomerUPI /></PrivateRoute>} />
          <Route path="/credit-cards" element={<PrivateRoute role="customer"><CustomerCreditCards /></PrivateRoute>} />
          <Route path="/loans" element={<PrivateRoute role="customer"><CustomerLoans /></PrivateRoute>} />
          <Route path="/reports" element={<PrivateRoute role="customer"><CustomerReports /></PrivateRoute>} />
          <Route path="/notifications" element={<PrivateRoute role="customer"><CustomerNotifications /></PrivateRoute>} />
          <Route path="/support" element={<PrivateRoute role="customer"><CustomerSupport /></PrivateRoute>} />
          <Route path="/chat" element={<PrivateRoute role="customer"><CustomerChat /></PrivateRoute>} />
          <Route path="/insurance" element={<PrivateRoute role="customer"><CustomerInsurance /></PrivateRoute>} />

          {/* Admin routes */}
          <Route path="/admin" element={<PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>} />
          <Route path="/admin/users" element={<PrivateRoute role="admin"><AdminUsers /></PrivateRoute>} />
          <Route path="/admin/accounts" element={<PrivateRoute role="admin"><AdminAccounts /></PrivateRoute>} />
          <Route path="/admin/transactions" element={<PrivateRoute role="admin"><AdminTransactions /></PrivateRoute>} />
          <Route path="/admin/deposits" element={<PrivateRoute role="admin"><AdminDeposits /></PrivateRoute>} />
          <Route path="/admin/loan-applications" element={<PrivateRoute role="admin"><AdminLoanApplications /></PrivateRoute>} />
          <Route path="/admin/audit" element={<PrivateRoute role="admin"><AdminAuditLog /></PrivateRoute>} />
          <Route path="/admin/support" element={<PrivateRoute role="admin"><AdminSupport /></PrivateRoute>} />
          <Route path="/admin/users/:userId/profile" element={<PrivateRoute role="admin"><AdminUserProfile /></PrivateRoute>} />

          {/* Fallback */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </NotificationProvider>
      </AuthProvider>
  )
}
