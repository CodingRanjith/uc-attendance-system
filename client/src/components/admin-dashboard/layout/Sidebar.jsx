import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FiHome,
  FiUsers,
  FiCalendar,
  FiBarChart2,
  FiSettings,
  FiLogOut,
  FiFileText,
  FiDollarSign,
  FiClock,
  FiUploadCloud,
  FiFile,
  FiFileMinus
} from 'react-icons/fi';

const menuItems = [
  { label: 'Dashboard', icon: <FiHome />, path: '/dashboard' },
  { label: 'All Employees', icon: <FiUsers />, path: '/employees' },
  { label: 'All Users (Cards)', icon: <FiUsers />, path: '/all-users' }, // ✅ New Card View Page
  { label: 'Pending Approvals', icon: <FiUsers />, path: '/pending-users' },
  { label: 'Daily Attendance', icon: <FiCalendar />, path: '/attendances' },
  { label: 'Working Days Summary', icon: <FiBarChart2 />, path: '/reports' },
  { label: 'Salary Details', icon: <FiDollarSign />, path: '/salary' },
  { label: 'Late Reports', icon: <FiClock />, path: '/late-reports' },
  { label: 'Holiday List', icon: <FiCalendar />, path: '/holidays' },
  { label: 'Experience Letters', icon: <FiFile />, path: '/experience-letters' },
  { label: 'Offer Letters', icon: <FiFileText />, path: '/offer-letters' },
  { label: 'Relieving Letters', icon: <FiFileMinus />, path: '/relieving-letters' },
  { label: 'Upload Docs', icon: <FiUploadCloud />, path: '/upload-documents' },
  { label: 'Company Settings', icon: <FiSettings />, path: '/settings' },
  { label: 'Logout', icon: <FiLogOut />, path: '' }
];


const Sidebar = () => {
  return (
    <aside className="w-64 fixed top-0 left-0 h-full bg-white border-r shadow-sm z-50">
      <div className="text-xl font-bold text-center py-5 border-b">
        UC & JZ HR Panel
      </div>
      <nav className="mt-4 px-2 flex flex-col gap-1">
        {menuItems.map((item, index) => (
          <NavLink
            key={index}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded-md transition text-sm font-medium ${
                isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
