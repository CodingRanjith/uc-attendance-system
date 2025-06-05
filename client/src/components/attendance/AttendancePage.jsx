import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import Swal from 'sweetalert2';

import { API_ENDPOINTS } from '../../utils/api';
import ProfileHeader from './ProfileHeader';
import DateStrip from './DateStrip';
import AttendanceCards from './AttendanceCards';
import ActivityLog from './ActivityLog';
import CameraView from './CameraView';
import { compressImage } from './utils';

function AttendancePage() {
  const [user, setUser] = useState({ name: '', position: '', company: '' });
  const [type, setType] = useState('check-in');
  const [image, setImage] = useState(null);
  const [capturedTime, setCapturedTime] = useState(null);
  const [location, setLocation] = useState('');
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwtDecode(token);
      setUser({
        name: decoded.name || 'User',
        position: decoded.position || '',
        company: decoded.company || ''
      });
    }

    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const last = await axios.get(API_ENDPOINTS.getLastAttendance, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setType(last.data.type === 'check-in' ? 'check-out' : 'check-in');

        const res = await axios.get(API_ENDPOINTS.getMyAttendance, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAttendanceHistory(res.data);
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Fetch Error', text: 'Unable to load attendance history.' });
      }
    };

    fetchData();
  }, []);

  const startCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    streamRef.current = stream;

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play(); // optional fallback
    }

    setIsCapturing(true);
    setImage(null);
    setCapturedTime(null);
  } catch (err) {
    Swal.fire('Camera Error', 'Please allow camera access.', 'error');
  }
};


  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsCapturing(false);
  };

  const captureImage = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    canvas.toBlob(async blob => {
      const file = new File([blob], 'attendance.jpg', { type: 'image/jpeg' });
      const compressed = await compressImage(file);
      if (compressed) {
        setImage(URL.createObjectURL(compressed));
        setCapturedTime(new Date());
      } else {
        Swal.fire('Compression Failed', 'Image compression unsuccessful.', 'error');
      }
    }, 'image/jpeg');
  };

  const submitAttendance = async () => {
    navigator.geolocation.getCurrentPosition(async pos => {
      const coords = `${pos.coords.latitude},${pos.coords.longitude}`;
      setLocation(coords);

      const formData = new FormData();
      formData.append('type', type);
      formData.append('location', coords);

      const response = await fetch(image);
      const blob = await response.blob();
      const file = new File([blob], 'attendance.jpg', { type: 'image/jpeg' });
      formData.append('image', file);

      try {
        await axios.post(API_ENDPOINTS.postAttendance, formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data',
          },
        });

        Swal.fire('Success', `${type === 'check-in' ? 'Checked In' : 'Checked Out'} successfully`, 'success');
        setImage(null);
        stopCamera();
      } catch (err) {
        Swal.fire('Failed', 'Could not submit attendance', 'error');
      }
    }, () => {
      Swal.fire('Location Error', 'Enable GPS to proceed.', 'warning');
    });
  };

  const filteredLogs = attendanceHistory.filter(entry =>
    new Date(entry.timestamp).toDateString() === selectedDate.toDateString()
  );

  return (
    <div className="min-h-screen bg-gradient-to-tr from-lime-50 via-sky-50 to-pink-50 px-4 py-6 md:py-10 max-w-4xl mx-auto font-sans">
      <ProfileHeader name={user.name} position={user.position} company={user.company} />

      <div className="mt-6">
        <DateStrip selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Today Attendance</h3>
        <AttendanceCards attendanceData={attendanceHistory} />
      </div>

      <div className="mt-8">
        <ActivityLog activities={filteredLogs} />
      </div>

      {!isCapturing && (
        <div className="fixed bottom-6 left-6 right-6 flex justify-center z-30">
          <button
            onClick={startCamera}
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
                  <button
                    onClick={stopCamera}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={captureImage}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                  >
                    Capture
                  </button>
                </div>
              </>
            ) : (
              <>
                <img src={image} alt="Captured" className="rounded-lg w-full object-cover" />
                {capturedTime && (
                  <p className="text-sm text-gray-600">
                    Captured at: {capturedTime.toLocaleTimeString()} on {capturedTime.toLocaleDateString()}
                  </p>
                )}
                <div className="flex justify-between mt-4">
                  <button
                    onClick={startCamera}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg"
                  >
                    Retake
                  </button>
                  <button
                    onClick={submitAttendance}
                    className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg"
                  >
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
