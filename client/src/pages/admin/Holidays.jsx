import React, { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import axios from 'axios';
import Swal from 'sweetalert2';
import { API_ENDPOINTS } from '../../utils/api';

const Holidays = () => {
  const [holidays, setHolidays] = useState([]);
  const [holidayMap, setHolidayMap] = useState({});
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.getHolidays, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHolidays(res.data);
      const map = {};
      res.data.forEach(h => {
        map[new Date(h.date).toDateString()] = h.name;
      });
      setHolidayMap(map);
    } catch (err) {
      console.error('Error fetching holidays:', err);
    }
  };

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
        <div className="flex justify-center">
          <Calendar
            onClickDay={handleDateClick}
            tileContent={tileContent}
            className="REACT-CALENDAR p-4 bg-gray-50 rounded-lg shadow-sm"
          />
        </div>
      </div>
    </div>
  );
};

export default Holidays;
 