import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';


// Savitha Admnin Dashboard
import DashSavi from './pages/Dashboard';

// Public Pages
import Login from './components/Login';
import Register from './components/Register';

// Admin Pages
import Dashboard from './pages/admin/Dashboard';
import Employees from './pages/admin/Employees';
import Salary from './pages/admin/Salary';
import Attendance from './pages/admin/Attendance';
import Reports from './pages/admin/Reports';
import LeaveRequestsAdmin from './pages/admin/LeaveRequests';
import DailySummary from './pages/admin/DailySummary';


import AttendancePage from './pages/employee/AttendancePage';
import Leave from './pages/employee/ApplyAndStatus';
import EditUser from './components/EditUser';
import PendingUsers from './pages/admin/PendingUsers';
import AllUsers from './pages/admin/AllUsers';
import Holidays from './pages/admin/Holidays';
import TaskManagerPage from './pages/employee/TaskManagerPage';

// Layout
import Layout from './components/admin-dashboard/layout/Layout';

function App() {
  return (
    <Router>
      <Routes>

        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/attendance/:userId" element={<AttendancePage />} />
        <Route path="/apply-leave" element={<Leave />} />
        <Route path="/task-manager" element={<TaskManagerPage />} />

        {/* Protected Admin Layout Wrapper */}
        <Route element={<Layout />}>
          <Route path="/admin" element={<DashSavi />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/salary" element={<Salary />} />
          <Route path="/attendances" element={<Attendance />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/leave-requests" element={<LeaveRequestsAdmin />} />
          <Route path="/daily-summary" element={<DailySummary />} />

          {/* Admin Specific Pages */}
          <Route path="/pending-users" element={<PendingUsers />} />
          <Route path="/all-users" element={<AllUsers />} />
          <Route path="/holidays" element={<Holidays />} />

          {/* Add other admin routes here */}
          <Route path="/edit-user" element={<EditUser />} />
        </Route>

      </Routes>
    </Router>
  );
}

export default App;
