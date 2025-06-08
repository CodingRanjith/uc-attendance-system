import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Public Pages
import Login from './components/Login';
import Register from './components/Register';

// Admin Pages
import Dashboard from './pages/admin/Dashboard';
import Employees from './pages/admin/Employees';
import Salary from './pages/admin/Salary';
import Attendance from './pages/admin/Attendance';
import Reports from './pages/admin/Reports';


import AttendancePage from './pages/employee/AttendancePage';
import EditUser from './components/EditUser';

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

        {/* Protected Admin Layout Wrapper */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/salary" element={<Salary />} />
          <Route path="/attendances" element={<Attendance />} />
          <Route path="/reports" element={<Reports />} />
          {/* Add other admin routes here */}
          <Route path="/edit-user" element={<EditUser />} />
        </Route>

      </Routes>
    </Router>
  );
}

export default App;
