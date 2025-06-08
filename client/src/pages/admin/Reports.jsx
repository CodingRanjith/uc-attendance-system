import React, { useEffect, useState } from 'react';
import axios from 'axios';
import SummaryChart from '../../components/admin-dashboard/reports/SummaryChart';
import { API_ENDPOINTS } from '../../utils/api';
import Loader from '../../components/admin-dashboard/common/Loader';

const Reports = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummaryData = async () => {
      try {
        const response = await axios.get(API_ENDPOINTS.getAdminSummary);
        setSummary(response.data);
      } catch (error) {
        console.error('Failed to load summary data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummaryData();
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Attendance Reports</h1>
      {summary ? (
        <SummaryChart data={summary} />
      ) : (
        <p className="text-gray-500">No report data available.</p>
      )}
    </div>
  );
};

export default Reports;
