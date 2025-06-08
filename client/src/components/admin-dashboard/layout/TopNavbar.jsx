// src/components/admin-dashboard/layout/TopNavbar.jsx

import React from 'react';
import { FiUser, FiLogOut } from 'react-icons/fi';

const TopNavbar = () => {
  return (
    <header className="h-16 bg-white border-b shadow-sm flex items-center justify-between px-6 ml-64 fixed top-0 right-0 left-64 z-40">
      <h2 className="text-lg font-semibold text-gray-800">Admin Dashboard</h2>
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <FiUser className="text-xl" />
        <span>admin@urbancode.com</span>
        <button
          className="flex items-center gap-1 text-red-600 hover:text-red-800 text-sm"
          onClick={() => {
            // clear token, redirect logic
            localStorage.clear();
            window.location.href = '/login';
          }}
        >
          <FiLogOut />
          Logout
        </button>
      </div>
    </header>
  );
};

export default TopNavbar;
