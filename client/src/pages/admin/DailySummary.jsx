import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { API_ENDPOINTS } from '../../utils/api';

const DailySummary = () => {
  const [reportDate, setReportDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const token = localStorage.getItem('token');

  useEffect(() => {
  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_ENDPOINTS.dailySummary}?date=${reportDate}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReportData(res.data);
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Failed to fetch report data', 'error');
    }
  };

  fetchData();
}, [reportDate, token]);




  

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // update every second
    return () => clearInterval(interval);
  }, []);

  const getWorkTime = (checkInTimeStr) => {
    if (!checkInTimeStr) return '-';

    const now = currentTime;
    const match = checkInTimeStr
      .replace(' am', 'AM')
      .replace(' pm', 'PM')
      .toUpperCase()
      .match(/(\d+):(\d+)\s?(AM|PM)/);

    if (!match) return '-';

    const [hour, minute, period] = match;

    let checkInDate = new Date(now);
    checkInDate.setHours(
      period === 'PM' && parseInt(hour) !== 12
        ? parseInt(hour) + 12
        : period === 'AM' && parseInt(hour) === 12
        ? 0
        : parseInt(hour),
      parseInt(minute),
      0,
      0
    );

    const diffMs = now - checkInDate;
    if (diffMs > 0) {
      const diffSecs = Math.floor(diffMs / 1000);
      const hours = Math.floor(diffSecs / 3600);
      const minutes = Math.floor((diffSecs % 3600) / 60);
      const seconds = diffSecs % 60;

      return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    return '-';
  };

  return (
    <div className="p-6 min-h-screen bg-white">
      <h2 className="text-2xl font-bold text-indigo-700 mb-4">Daily Attendance Summary</h2>

      <div className="mb-6">
        <label className="font-medium mr-3">Select Date:</label>
        <input
          type="date"
          value={reportDate}
          onChange={(e) => setReportDate(e.target.value)}
          className="border rounded px-3 py-1"
        />
      </div>

      {reportData ? (
        <div className="space-y-12">
          {/* Present List */}
          <div className="border p-4 rounded shadow-md">
            <h3 className="text-lg font-semibold text-green-700 mb-3">Present List</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto border text-sm">
                <thead className="bg-green-600 text-white">
                  <tr>
                    <th className="py-2 px-4 border">S.No</th>
                    <th className="py-2 px-4 border">Name</th>
                    <th className="py-2 px-4 border">Check-in</th>
                    <th className="py-2 px-4 border">Check-out</th>
                    {/* <th className="py-2 px-4 border">Work Mode</th> */}
                    <th className="py-2 px-4 border">Work Type</th>
                    <th className="py-2 px-4 border">Work Time (HH:MM:SS)</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.present?.map((name, index) => {
                    const check = reportData.checkInOut?.find(item => item.name === name);
                    const work = reportData.workTypes?.find(item => item.name === name);

                    return (
                      <tr key={index} className="border-b">
                        <td className="py-2 px-4 border">{index + 1}</td>
                        <td className="py-2 px-4 border">{name}</td>
                        <td className="py-2 px-4 border">{check?.checkIn || '-'}</td>
                        <td className="py-2 px-4 border">
                          {check?.checkOut && check?.checkOut !== check?.checkIn ? check.checkOut : ''}
                        </td>
                        {/* <td className="py-2 px-4 border">{check?.location || '-'}</td> */}
                        <td className="py-2 px-4 border">{work?.type || 'Office'}</td>
                        <td className="py-2 px-4 border">{getWorkTime(check?.checkIn)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Absent List */}
          <div className="border p-4 rounded shadow-md">
            <h3 className="text-lg font-semibold text-red-700 mb-3">Absent List</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto border text-sm">
                <thead className="bg-red-600 text-white">
                  <tr>
                    <th className="py-2 px-4 border">S.No</th>
                    <th className="py-2 px-4 border">Name</th>
                    <th className="py-2 px-4 border">Leave Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.absent?.map((name, index) => {
                    const leave = reportData.leaveStatus?.find(item => item.name === name);
                    return (
                      <tr key={index} className="border-b">
                        <td className="py-2 px-4 border">{index + 1}</td>
                        <td className="py-2 px-4 border">{name}</td>
                        <td className="py-2 px-4 border">{leave?.status || 'Not Applied'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-gray-600">Loading summary...</p>
      )}
    </div>
  );
};

export default DailySummary;
