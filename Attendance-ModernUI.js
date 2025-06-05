
import React, { useState, useEffect, useRef } from 'react';
import { FiClock, FiUser, FiCamera, FiLogOut } from 'react-icons/fi';
import { jwtDecode } from 'jwt-decode';
import { API_ENDPOINTS } from '../utils/api';
import axios from 'axios';
import Swal from 'sweetalert2';

const Attendance = () => {
  const [userName, setUserName] = useState('John Doe');
  const [userRole, setUserRole] = useState('Frontend Developer');
  const [todayAttendance, setTodayAttendance] = useState({
    checkIn: '10:20 AM',
    checkOut: '07:00 PM',
    breakTime: '30 min',
    totalDays: 28,
    isHoliday: false
  });
  const [recentActivity, setRecentActivity] = useState([
    { type: 'Check In', time: '10:00 AM', date: 'April 17, 2023' },
    { type: 'Break In', time: '12:30 AM', date: 'April 17, 2023' },
  ]);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);
  const [imageCaptured, setImageCaptured] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwtDecode(token);
      setUserName(decoded.name || 'User');
      setUserRole(decoded.role || 'Employee');
    }
  }, []);

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setShowCamera(true);
    } catch {
      Swal.fire({ icon: 'error', title: 'Camera Access Denied', text: 'Please allow camera access.' });
    }
  };

  const captureImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      const file = new File([blob], 'attendance.jpg', { type: 'image/jpeg' });
      setImageCaptured(file);
      Swal.fire({ icon: 'success', title: 'Captured', text: 'Image captured for attendance.' });
    }, 'image/jpeg', 0.9);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans">
      {/* Profile Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <img src="https://i.pravatar.cc/100" alt="profile" className="w-12 h-12 rounded-full" />
          <div>
            <h1 className="font-bold text-lg">{userName}</h1>
            <p className="text-gray-500 text-sm">{userRole}</p>
          </div>
        </div>
        <FiLogOut className="text-gray-600 text-xl cursor-pointer" />
      </div>

      {/* Date Selector */}
      <div className="grid grid-cols-5 gap-2 mb-4 text-center text-sm">
        {['Thu', 'Fri', 'Sat', 'Sun', 'Mon'].map((day, i) => (
          <div key={i} className={`rounded-md p-2 ${i === 3 ? 'bg-blue-500 text-white' : 'bg-white border'}`}>
            <div className="font-bold">{6 + i}</div>
            <div>{day}</div>
          </div>
        ))}
      </div>

      {/* Today's Attendance */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-center text-sm">
        <div className="bg-white rounded-md p-4 shadow">
          <p className="text-xs text-gray-500">Check In</p>
          <p className="text-xl font-bold">{todayAttendance.checkIn}</p>
          <p className="text-green-500">On Time</p>
        </div>
        <div className="bg-white rounded-md p-4 shadow">
          <p className="text-xs text-gray-500">Check Out</p>
          <p className="text-xl font-bold">{todayAttendance.checkOut}</p>
          <p className="text-blue-500">Go Home</p>
        </div>
        <div className="bg-white rounded-md p-4 shadow">
          <p className="text-xs text-gray-500">Break Time</p>
          <p className="text-xl font-bold">{todayAttendance.breakTime}</p>
          <p className="text-gray-400">Avg Time</p>
        </div>
        <div className="bg-white rounded-md p-4 shadow">
          <p className="text-xs text-gray-500">Total Days</p>
          <p className="text-xl font-bold">{todayAttendance.totalDays}</p>
          <p className="text-gray-400">Working Days</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-md shadow p-4 mb-4">
        <div className="flex justify-between mb-2">
          <h3 className="font-semibold">Your Activity</h3>
          <button className="text-sm text-blue-500">View All</button>
        </div>
        <ul className="text-sm">
          {recentActivity.map((entry, index) => (
            <li key={index} className="flex justify-between py-1 border-t">
              <div className="text-gray-600">{entry.type}</div>
              <div className="text-right">
                <div>{entry.time}</div>
                <div className="text-xs text-gray-400">{entry.date}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Bottom Button */}
      <button
        onClick={openCamera}
        className="w-full bg-red-500 text-white py-3 rounded-full text-lg font-semibold shadow hover:bg-red-600"
      >
        {todayAttendance.checkOut ? 'Swipe to Check In' : 'Swipe to Check Out'}
      </button>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg shadow max-w-md w-full relative">
            <video ref={videoRef} autoPlay playsInline muted className="rounded w-full h-64 object-cover" />
            <button
              onClick={captureImage}
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-6 py-2 rounded-full"
            >
              <FiCamera className="inline mr-2" /> Capture
            </button>
            <button
              onClick={() => {
                streamRef.current?.getTracks().forEach((track) => track.stop());
                setShowCamera(false);
              }}
              className="absolute top-2 right-2 text-gray-600 text-lg"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
