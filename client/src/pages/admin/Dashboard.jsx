import React, { useEffect, useState } from 'react';
import DashboardCards from '../../components/admin-dashboard/dashboard/DashboardCards';
import RecentAttendanceTable from '../../components/admin-dashboard/dashboard/RecentAttendanceTable';
import axios from 'axios';
import { API_ENDPOINTS } from '../../utils/api';
import Loader from '../../components/admin-dashboard/common/Loader';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        const [summaryRes, logsRes] = await Promise.all([
          axios.get(API_ENDPOINTS.getAdminSummary, { headers }),
          axios.get(API_ENDPOINTS.getRecentAttendanceLogs, { headers })
        ]);

        setSummary(summaryRes.data || {});
        setRecentLogs(logsRes.data || []);
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>

      {/* Summary Cards */}
      {summary && <DashboardCards data={summary} />}

      {/* Recent Attendance Table */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Recent Attendance</h2>
        <RecentAttendanceTable logs={recentLogs} />
      </div>
    </div>
  );
};

export default Dashboard;
