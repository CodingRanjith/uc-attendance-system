import React, { useEffect, useState, useCallback } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import axios from 'axios';
import Swal from 'sweetalert2';
import { API_ENDPOINTS } from '../../utils/api';

const Holidays = () => {
  const [holidays, setHolidays] = useState([]);
  const [holidayMap, setHolidayMap] = useState({});
  const token = localStorage.getItem('token');

  const fetchHolidays = useCallback(async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.getHolidays, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHolidays(res.data || []);

      const map = {};
      res.data.forEach(h => {
        map[new Date(h.date).toDateString()] = h.name;
      });
      setHolidayMap(map);
    } catch (err) {
      console.error('Error fetching holidays:', err);
    }
  }, [token]);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  const handleDateClick = async (date) => {
    const isHoliday = holidayMap[date.toDateString()];
    if (isHoliday) {
      Swal.fire({
        title: 'Holiday Info',
        text: `Already a holiday: ${isHoliday}`,
        icon: 'info',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    const { value: name } = await Swal.fire({
      title: 'Add Holiday',
      input: 'text',
      inputLabel: `Enter holiday name for ${date.toDateString()}`,
      inputPlaceholder: 'e.g., Diwali, Pongal',
      showCancelButton: true,
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#dc2626'
    });

    if (name) {
      try {
        await axios.post(API_ENDPOINTS.addHoliday, {
          date: date,
          name: name
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        await fetchHolidays();
        Swal.fire('Success', 'Holiday added successfully!', 'success');
      } catch (err) {
        console.error(err);
        Swal.fire('Error', 'Failed to add holiday', 'error');
      }
    }
  };

  const tileContent = ({ date, view }) => {
    if (view === 'month' && holidayMap[date.toDateString()]) {
      return (
        <div className="text-xs bg-red-100 text-red-700 rounded mt-1 px-1 font-semibold">
          {holidayMap[date.toDateString()]}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-6 border border-gray-200">
        <h1 className="text-3xl font-bold text-center text-indigo-600 mb-2">📅 Holiday Calendar</h1>
        <p className="text-center text-gray-600 mb-6">
          Click on a date to add a holiday (Admin Only)
        </p>

        {/* Calendar */}
        <div className="flex justify-center">
          <Calendar
            onClickDay={handleDateClick}
            tileContent={tileContent}
            className="REACT-CALENDAR p-4 bg-gray-50 rounded-lg shadow-sm"
          />
        </div>

        {/* Holiday List */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold text-indigo-700 mb-4">📋 Upcoming Holidays</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border border-gray-200 bg-white shadow-sm rounded-md">
              <thead className="bg-indigo-100 text-indigo-800 text-sm">
                <tr>
                  <th className="py-2 px-4 border-b">Date</th>
                  <th className="py-2 px-4 border-b">Holiday Name</th>
                </tr>
              </thead>
              <tbody>
                {holidays.length > 0 ? (
                  holidays
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .map((h) => (
                      <tr key={h._id || h.date} className="hover:bg-indigo-50">
                        <td className="py-2 px-4 border-b">{new Date(h.date).toDateString()}</td>
                        <td className="py-2 px-4 border-b">{h.name}</td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan="2" className="text-center text-gray-500 py-4">No holidays found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Holidays;
