// src/components/admin-dashboard/layout/Layout.jsx

import React from 'react';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import { Outlet } from 'react-router-dom';

const Layout = () => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 ml-64">
        {/* Top Navbar */}
        <TopNavbar />

        {/* Page Content */}
        <main className="p-6 mt-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
