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
  const [type, setType] = useState(null);
  const [image, setImage] = useState(null);
  const [compressedBlob, setCompressedBlob] = useState(null);
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
        const res = await axios.get(API_ENDPOINTS.getMyAttendance, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAttendanceHistory(res.data);

        const today = new Date().toDateString();
        const todayEntries = res.data.filter(
          entry => new Date(entry.timestamp).toDateString() === today
        );

        if (todayEntries.length === 0) {
          setType('check-in');
        } else {
          const last = todayEntries[todayEntries.length - 1];
          setType(last.type === 'check-in' ? 'check-out' : null); // null if already checked out
        }
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Fetch Error', text: 'Unable to load attendance history.' });
      }
    };

    fetchData();
  }, []);

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
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  };

  const getLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation(`${pos.coords.latitude},${pos.coords.longitude}`),
      () => Swal.fire({ icon: 'error', title: 'Location Error', text: 'Please enable GPS to proceed.' })
    );
  };

  const captureImage = async () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async blob => {
      if (!blob) return;
      const file = new File([blob], 'attendance.jpg', { type: 'image/jpeg' });
      const compressed = await compressImage(file);
      if (compressed) {
        setImage(URL.createObjectURL(compressed));
        setCompressedBlob(compressed);
        setCapturedTime(new Date());
        getLocation(); // important
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

      // Refresh after submission
      const res = await axios.get(API_ENDPOINTS.getMyAttendance, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setAttendanceHistory(res.data);

      const today = new Date().toDateString();
      const todayEntries = res.data.filter(
        entry => new Date(entry.timestamp).toDateString() === today
      );

      if (todayEntries.length === 0) {
        setType('check-in');
      } else {
        const last = todayEntries[todayEntries.length - 1];
        setType(last.type === 'check-in' ? 'check-out' : null);
      }

    } catch (err) {
      Swal.fire('Failed', 'Could not submit attendance', 'error');
    }
  };

  const filteredLogs = attendanceHistory.filter(
    (entry) => new Date(entry.timestamp).toDateString() === selectedDate.toDateString()
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

      {type && !isCapturing && (
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
                    {location && (
                      <p><span className="font-medium">Location:</span> {location}</p>
                    )}
                  </div>
                )}
                <div className="flex justify-between mt-4">
                  <button
                    onClick={() => {
                      URL.revokeObjectURL(image);
                      setImage(null);
                      setCompressedBlob(null);
                      startCamera();
                    }}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg"
                  >
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
