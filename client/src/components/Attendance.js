import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  FiCamera, FiCheckCircle, FiClock, FiMapPin, FiRefreshCw, FiUser
} from 'react-icons/fi';
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
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Fetch Error',
          text: 'Could not load your attendance data.'
        });
      }
    };

    fetchData();

    const startCamera = async () => {
      try {
        setIsCapturing(true);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' }
        });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Camera Access Denied',
          text: 'Please enable your camera and refresh the page.'
        });
        setIsCapturing(false);
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
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
    try {
      if (!videoRef.current) return;
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d').drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(async blob => {
        const file = new File([blob], 'attendance.jpg', { type: 'image/jpeg' });
        const compressed = await compressImage(file);
        compressed ? setImage(compressed) : Swal.fire({ icon: 'error', title: 'Compression Failed' });
      }, 'image/jpeg', 0.9);
    } catch {
      Swal.fire({ icon: 'error', title: 'Image Capture Failed' });
    }
  };

  const retakePhoto = () => {
    setImage(null);
    setLocation('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!image) {
      Swal.fire({ icon: 'error', title: 'No Image', text: 'Please capture an image before submitting.' });
      setIsLoading(false);
      return;
    }

    const imageSizeKB = image.size / 1024;
    if (imageSizeKB > 40) {
      Swal.fire({ icon: 'error', title: 'Image Too Large', text: 'Please retake image under 40KB.' });
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

        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: `${type === 'check-in' ? 'Checked in' : 'Checked out'} successfully!`,
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true
        });

        setImage(null);
        setLocation('');

        const myAttendance = await axios.get(API_ENDPOINTS.getMyAttendance, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setAttendanceHistory(myAttendance.data.slice(0, 5));

      } catch {
        Swal.fire({ icon: 'error', title: 'Failed to Submit' });
      } finally {
        setIsLoading(false);
      }
    }, () => {
      Swal.fire({ icon: 'error', title: 'Location Error', text: 'Please enable GPS to proceed.' });
      setIsLoading(false);
    });
  };

  // ⬇️ Include your JSX below or reattach from previous code

  return (
  <div className="min-h-screen bg-gradient-to-tr from-purple-200 via-pink-100 to-blue-200 flex items-center justify-center p-4">
    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl transition hover:scale-105 hover:shadow-[0_20px_40px_rgba(0,0,0,0.2)] border border-blue-100">
      <div className="p-6">

        <div className="flex justify-end mb-2">
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            ← Back
          </button>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">{type === 'check-in' ? 'Check In' : 'Check Out'}</h2>
          <p className="text-gray-600">{type === 'check-in' ? 'Start your work day' : 'End your work day'}</p>
          {userName && (
            <div className="mt-2 flex justify-center items-center text-gray-700">
              <FiUser className="mr-1" />
              {userName}
            </div>
          )}
        </div>

        <div className="mb-4">
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <FiMapPin className="mr-2" />
            {location || 'Location will be shown after capture'}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <FiClock className="mr-2" />
            {new Date().toLocaleString()}
          </div>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4">
          {image ? (
            <div className="relative">
              <img src={URL.createObjectURL(image)} alt="Captured" className="w-full rounded-lg" />
              <button
                onClick={retakePhoto}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
              >
                <FiRefreshCw />
              </button>
            </div>
          ) : isCapturing ? (
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full rounded-lg transform scale-x-[-1]"
              />
              <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <button onClick={captureImage} className="bg-white rounded-full p-3 shadow hover:bg-gray-100">
                  <FiCamera className="text-gray-700 text-xl" />
                </button>
              </div>
            </div>
          ) : (
            <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
              Camera not available
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full mb-4 px-3 py-2 border rounded shadow focus:ring"
          >
            <option value="check-in">Check In</option>
            <option value="check-out">Check Out</option>
          </select>

          <button
            type="submit"
            disabled={!image || isLoading}
            className={`w-full py-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition ${
              (!image || isLoading) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Processing...' : (
              <>
                <FiCheckCircle className="inline-block mr-1" />
                {type === 'check-in' ? 'Check In' : 'Check Out'}
              </>
            )}
          </button>
        </form>

        <button
          onClick={() => setShowAttendanceModal(true)}
          className="mt-4 w-full py-3 rounded-full bg-yellow-500 text-white font-semibold shadow hover:shadow-md hover:bg-yellow-600 transition"
        >
          📋 View Attendance
        </button>

        {showAttendanceModal && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="w-full h-full bg-white overflow-auto p-6 relative rounded-lg shadow-lg">
              <button
                onClick={() => setShowAttendanceModal(false)}
                className="absolute top-4 right-4 text-gray-700 hover:text-red-600 text-xl"
              >
                &times;
              </button>
              <h2 className="text-2xl font-bold mb-4 text-center">📅 Recent Attendance</h2>
              <table className="min-w-full text-sm bg-white border border-gray-200 rounded">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Time</th>
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 text-left">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceHistory.map((a, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-4 py-2">{new Date(a.timestamp).toLocaleDateString()}</td>
                      <td className="px-4 py-2">{new Date(a.timestamp).toLocaleTimeString()}</td>
                      <td className="px-4 py-2 capitalize">{a.type}</td>
                      <td className="px-4 py-2">{a.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);

}

export default Attendance;
