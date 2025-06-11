import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import Swal from 'sweetalert2';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './AttendancePage.css';
import { useNavigate, useParams } from 'react-router-dom';

import { API_ENDPOINTS } from '../../utils/api';
import ProfileHeader from '../../components/attendance/ProfileHeader';
import DateStrip from '../../components/attendance/DateStrip';
import AttendanceCards from '../../components/attendance/AttendanceCards';
import ActivityLog from '../../components/attendance/ActivityLog';
import CameraView from '../../components/attendance/CameraView';
import { compressImage } from '../../components/attendance/utils';

function AttendancePage() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const isSelf = !userId;

  const [user, setUser] = useState({ name: '', position: '', company: '' });
  const [type, setType] = useState(null);
  const [image, setImage] = useState(null);
  const [compressedBlob, setCompressedBlob] = useState(null);
  const [capturedTime, setCapturedTime] = useState(null);
  const [location, setLocation] = useState('');
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    fetchUser();
    fetchAttendance();
  }, [userId]);

  const fetchUser = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(
        isSelf ? API_ENDPOINTS.getCurrentUser : API_ENDPOINTS.getUserById(userId),
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUser({
        name: res.data.name,
        position: res.data.position,
        company: res.data.company,
      });
    } catch (err) {
      // Swal.fire({ icon: 'error', title: 'Error', text: 'Unable to load user info' });
    }
  };

  const fetchAttendance = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(
        isSelf ? API_ENDPOINTS.getMyAttendance : API_ENDPOINTS.getAttendanceByUser(userId),
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAttendanceHistory(res.data);

      const today = new Date().toDateString();
      const todayEntries = res.data.filter(
        (entry) => new Date(entry.timestamp).toDateString() === today
      );

      if (isSelf) {
        if (todayEntries.length === 0) {
          setType('check-in');
        } else if (todayEntries.length === 1 && todayEntries[0].type === 'check-in') {
          setType('check-out');
        } else {
          setType(null);
        }
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Unable to load attendance data' });
    }
  };

  const getLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation(`${pos.coords.latitude},${pos.coords.longitude}`),
      () => Swal.fire({ icon: 'error', title: 'Location Error', text: 'Please enable GPS to proceed.' })
    );
  };

  const startCamera = async () => {
    try {
      setIsCapturing(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Camera Access Denied', text: 'Please enable your camera and refresh the page.' });
      setIsCapturing(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  };

  const captureImage = async () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], 'attendance.jpg', { type: 'image/jpeg' });
      const compressed = await compressImage(file);
      if (compressed) {
        setImage(URL.createObjectURL(compressed));
        setCompressedBlob(compressed);
        setCapturedTime(new Date());
        getLocation();
      } else {
        Swal.fire({ icon: 'error', title: 'Compression Failed' });
      }
    }, 'image/jpeg', 0.9);
  };

  const submitAttendance = async () => {
    if (!compressedBlob || !location) {
      Swal.fire('Missing Data', 'Ensure image and location are available before submitting.', 'warning');
      return;
    }

    const formData = new FormData();
    formData.append('type', type);
    formData.append('location', location);
    formData.append('image', compressedBlob);

    try {
      await axios.post(API_ENDPOINTS.postAttendance, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      Swal.fire('Success', `${type === 'check-in' ? 'Checked In' : 'Checked Out'} successfully`, 'success');
      setImage(null);
      setCompressedBlob(null);
      setLocation('');
      stopCamera();
      fetchAttendance();
    } catch (err) {
      Swal.fire('Failed', 'Could not submit attendance', 'error');
    }
  };

  const onLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const attendanceMap = {};
  attendanceHistory.forEach((entry) => {
    const dateKey = new Date(entry.timestamp).toDateString();
    if (!attendanceMap[dateKey]) attendanceMap[dateKey] = { checkin: false, checkout: false };
    if (entry.type === 'check-in') attendanceMap[dateKey].checkin = true;
    if (entry.type === 'check-out') attendanceMap[dateKey].checkout = true;
  });

  const filteredLogs = attendanceHistory.filter(
    (entry) => new Date(entry.timestamp).toDateString() === selectedDate.toDateString()
  );

  const presentDays = Object.keys(attendanceMap).length;
  const totalDays = new Date().getDate();
  const absentDays = totalDays - presentDays;

  return (
    <div className="min-h-screen bg-gradient-to-tr from-lime-50 via-sky-50 to-pink-50 px-4 py-6 md:py-10 max-w-4xl mx-auto font-sans">
      <ProfileHeader name={user.name} position={user.position} company={user.company} />

      <div className="mt-4 mb-4 flex justify-around text-sm font-medium text-gray-700">
        <div>✅ Present: <span className="text-green-600">{presentDays}</span></div>
        <div>❌ Absent: <span className="text-red-600">{absentDays}</span></div>
        <div>📅 Total: <span className="text-blue-600">{totalDays}</span></div>
      </div>

      <div className="flex flex-col md:flex-row md:justify-between items-stretch md:items-center gap-3 mb-4">
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <button onClick={() => navigate('/apply-leave')} className="bg-yellow-500 text-white px-4 py-2 rounded shadow hover:bg-yellow-600 w-full sm:w-auto">
            📝 Apply Leave
          </button>
          <button onClick={() => navigate('/task-manager')} className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 w-full sm:w-auto">
            🗂 Task Manager
          </button>
          <button onClick={() => setShowCalendarModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 w-full sm:w-auto">
            📅 Open Calendar View
          </button>
        </div>
        <button onClick={onLogout} className="bg-red-500 text-white px-4 py-2 rounded shadow hover:bg-red-600 w-full sm:w-auto">
          🔒 Logout
        </button>
      </div>

      {showCalendarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-black" onClick={() => setShowCalendarModal(false)}>
              ✕
            </button>
            <h2 className="text-lg font-bold mb-4 text-center">
              Attendance - {calendarViewDate.toLocaleString('default', { month: 'long' })} {calendarViewDate.getFullYear()}
            </h2>
            <Calendar
              onChange={setSelectedDate}
              value={selectedDate}
              onActiveStartDateChange={({ activeStartDate }) => setCalendarViewDate(activeStartDate)}
              tileClassName={({ date, view }) => {
                if (view === 'month') {
                  const key = date.toDateString();
                  const record = attendanceMap[key];
                  if (record?.checkin && record?.checkout) return 'present-day';
                  if (record?.checkin && !record?.checkout) return 'partial-present';
                  if (!record) return 'absent-day';
                }
                return '';
              }}
            />
            <div className="flex justify-around mt-4 text-sm">
              <div className="flex items-center gap-2"><span className="w-4 h-4 bg-green-200 rounded"></span>Present</div>
              <div className="flex items-center gap-2"><span className="w-4 h-4 bg-yellow-200 rounded"></span>Check-in Only</div>
              <div className="flex items-center gap-2"><span className="w-4 h-4 bg-red-200 rounded"></span>Absent</div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6">
        <DateStrip selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Today Attendance</h3>
        <AttendanceCards attendanceData={attendanceHistory} />
        <ActivityLog activities={filteredLogs} />
      </div>

      {isSelf && type && !isCapturing && (
        <div className="fixed bottom-6 left-6 right-6 flex justify-center z-30">
          <button
            onClick={() => {
              getLocation();
              startCamera();
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-full shadow-lg transition"
          >
            {type === 'check-in' ? 'Check In' : 'Check Out'}
          </button>
        </div>
      )}

      {isCapturing && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm p-6 rounded-2xl shadow-2xl space-y-4 text-center">
            {!image ? (
              <>
                <CameraView ref={videoRef} />
                <div className="flex justify-between mt-4">
                  <button onClick={stopCamera} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg">
                    Cancel
                  </button>
                  <button onClick={captureImage} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
                    Capture
                  </button>
                </div>
              </>
            ) : (
              <>
                <img src={image} alt="Captured" className="rounded-lg w-full object-cover" />
                {capturedTime && (
                  <div className="text-sm text-gray-600 mt-2 space-y-1">
                    <p><span className="font-medium">Captured at:</span> {capturedTime.toLocaleTimeString()} on {capturedTime.toLocaleDateString()}</p>
                    {location && <p><span className="font-medium">Location:</span> {location}</p>}
                  </div>
                )}
                <div className="flex justify-between mt-4">
                  <button onClick={() => {
                    URL.revokeObjectURL(image);
                    setImage(null);
                    setCompressedBlob(null);
                    startCamera();
                  }} className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg">
                    Retake
                  </button>
                  <button onClick={submitAttendance} className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg">
                    Submit {type === 'check-in' ? 'Check In' : 'Check Out'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AttendancePage;
