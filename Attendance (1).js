
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FiCamera, FiCheckCircle, FiClock, FiMapPin, FiRefreshCw, FiUser } from 'react-icons/fi';
import { jwtDecode } from 'jwt-decode';
import { API_ENDPOINTS } from '../utils/api';
import Swal from 'sweetalert2';

function Attendance() {
  const [location, setLocation] = useState('');
  const [image, setImage] = useState(null);
  const [type, setType] = useState('check-in');
  const [isLoading, setIsLoading] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [userName, setUserName] = useState('');
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const navigate = useNavigate();

  const [isFocusMode, setIsFocusMode] = useState(false);
  const [focusTimeLeft, setFocusTimeLeft] = useState(0);
  const focusTimerRef = useRef(null);
  const focusStartTimeRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwtDecode(token);
      setUserName(decoded.name || 'User');
    }

    const fetchData = async () => {
      try {
        const res = await axios.get(API_ENDPOINTS.getLastAttendance, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setType(res.data.type === 'check-in' ? 'check-out' : 'check-in');

        const myAttendance = await axios.get(API_ENDPOINTS.getMyAttendance, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAttendanceHistory(myAttendance.data.slice(0, 5));
      } catch {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load attendance history' });
      }
    };

    fetchData();

    const startCamera = async () => {
      try {
        setIsCapturing(true);
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        Swal.fire({ icon: 'error', title: 'Camera Access Denied', text: 'Enable camera access and refresh.' });
        setIsCapturing(false);
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    };
  }, []);

  useEffect(() => {
    if (isFocusMode && focusTimeLeft > 0) {
      focusTimerRef.current = setInterval(() => {
        setFocusTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(focusTimerRef.current);
            playBoomSound();
            Swal.fire({ icon: 'warning', title: 'Focus Session Over!', text: 'Your focus time has ended.' });
            setIsFocusMode(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(focusTimerRef.current);
  }, [isFocusMode]);

  useEffect(() => {
    const warnIfFocusMode = (e) => {
      if (isFocusMode) {
        e.preventDefault();
        e.returnValue = '';
        playBoomSound();
      }
    };
    window.addEventListener('beforeunload', warnIfFocusMode);
    return () => window.removeEventListener('beforeunload', warnIfFocusMode);
  }, [isFocusMode]);

  const compressImage = async (file, maxSizeKB = 40) => {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = event => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          let width = img.width, height = img.height;
          const MAX_WIDTH = 800, MAX_HEIGHT = 600;

          if (width > height && width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          } else if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          let quality = 0.9;
          const checkSize = () => {
            canvas.toBlob(blob => {
              if (!blob) return resolve(null);
              const sizeKB = blob.size / 1024;
              if (sizeKB <= maxSizeKB || quality <= 0.1) {
                resolve(new File([blob], file.name, { type: 'image/jpeg' }));
              } else {
                quality -= 0.1;
                canvas.toBlob(checkSize, 'image/jpeg', quality);
              }
            }, 'image/jpeg', quality);
          };
          checkSize();
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const captureImage = async () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    canvas.toBlob(async blob => {
      const file = new File([blob], 'attendance.jpg', { type: 'image/jpeg' });
      const compressed = await compressImage(file);
      compressed ? setImage(compressed) : Swal.fire({ icon: 'error', title: 'Compression Failed' });
    }, 'image/jpeg', 0.9);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    if (!image) {
      Swal.fire({ icon: 'error', title: 'No Image', text: 'Capture image before submitting.' });
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const coords = `${pos.coords.latitude},${pos.coords.longitude}`;
      setLocation(coords);

      const formData = new FormData();
      formData.append('location', coords);
      formData.append('type', type);
      formData.append('image', image);

      try {
        await axios.post(API_ENDPOINTS.postAttendance, formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data'
          }
        });

        Swal.fire({ icon: 'success', title: `Attendance ${type === 'check-in' ? 'checked in' : 'checked out'} successfully!` });
        setImage(null);
        setLocation('');

        const myAttendance = await axios.get(API_ENDPOINTS.getMyAttendance, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setAttendanceHistory(myAttendance.data.slice(0, 5));
      } catch {
        Swal.fire({ icon: 'error', title: 'Failed to Submit' });
      } finally {
        setIsLoading(false);
      }
    }, () => {
      Swal.fire({ icon: 'error', title: 'Location Error', text: 'Enable GPS to proceed.' });
      setIsLoading(false);
    });
  };

  const playBoomSound = () => {
    const audio = new Audio('https://www.soundjay.com/button/beep-07.wav');
    audio.play();
  };

  const startFocusMode = (minutes) => {
    setIsFocusMode(true);
    setFocusTimeLeft(minutes * 60);
    focusStartTimeRef.current = Date.now();
    Swal.fire({ icon: 'success', title: 'Focus Started', text: `Focus mode for ${minutes} minutes.` });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-indigo-600">UC Attendance System</h2>
          <p className="text-sm text-gray-500">Mark your attendance with camera and location</p>
          <div className="text-sm text-gray-600 mt-1"><FiClock className="inline-block mr-1" /> {new Date().toLocaleString()}</div>
          <div className="text-sm text-gray-600 mt-1"><FiUser className="inline-block mr-1" /> Logged in as {userName}</div>
        </div>

        <div className="mt-4">
          {image ? (
            <div className="relative">
              <img src={URL.createObjectURL(image)} alt="Captured" className="rounded-md" />
              <button onClick={() => setImage(null)} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"><FiRefreshCw /></button>
            </div>
          ) : (
            <video ref={videoRef} autoPlay playsInline muted className="rounded-md w-full" />
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-4">
          <select value={type} onChange={(e) => setType(e.target.value)} className="w-full border p-2 rounded mb-2">
            <option value="check-in">Check In</option>
            <option value="check-out">Check Out</option>
          </select>

          <button type="button" onClick={captureImage} className="w-full bg-gray-200 hover:bg-gray-300 py-2 rounded mb-2">📸 Capture Photo</button>
          <button type="submit" disabled={!image || isLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded disabled:opacity-50">
            {isLoading ? 'Submitting...' : `✅ Submit ${type === 'check-in' ? 'Check In' : 'Check Out'}`}
          </button>
        </form>

        <button onClick={() => setShowAttendanceModal(true)} className="mt-4 w-full bg-yellow-500 text-white py-2 rounded">📋 View Attendance</button>

        {showAttendanceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
            <div className="bg-white w-11/12 max-w-lg rounded-lg p-4 relative">
              <button onClick={() => setShowAttendanceModal(false)} className="absolute top-2 right-2 text-lg">&times;</button>
              <h3 className="text-center text-lg font-semibold mb-2">📊 Recent Attendance Activity</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-left">Time</th>
                    <th className="p-2 text-left">Type</th>
                    <th className="p-2 text-left">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceHistory.map((a, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="p-2">{new Date(a.timestamp).toLocaleDateString()}</td>
                      <td className="p-2">{new Date(a.timestamp).toLocaleTimeString()}</td>
                      <td className="p-2 capitalize">{a.type}</td>
                      <td className="p-2">{a.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-6">
          <h4 className="text-sm font-medium mb-2 text-center">🎯 Focus Mode</h4>
          {!isFocusMode ? (
            <>
              <button onClick={() => startFocusMode(60)} className="w-full bg-green-500 text-white py-2 rounded mb-2">Start 1 Hour Focus</button>
              <button onClick={() => startFocusMode(30)} className="w-full bg-blue-500 text-white py-2 rounded">Start 30 Min Focus</button>
            </>
          ) : (
            <div className="text-center text-red-600 font-semibold">
              Focus time left: {Math.floor(focusTimeLeft / 60)}m {focusTimeLeft % 60}s
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Attendance;
