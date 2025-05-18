import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { API_ENDPOINTS } from '../utils/api';
import Swal from 'sweetalert2';

import jobzenterLogo from '../assets/jzlogo.png';
import urbancodeLogo from '../assets/uclogo.png';

function Login() {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      console.log("Latitude:", position.coords.latitude);
      console.log("Longitude:", position.coords.longitude);
    },
    (error) => {
      console.error("Error getting location:", error);
    }
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post(API_ENDPOINTS.login, {
        email,
        password
      }, {
        validateStatus: (status) => status < 500
      });

      if (response.status !== 200) {
        throw new Error(response.data?.error || 'Login failed');
      }

      const token = response.data.token;
      localStorage.setItem('token', token);
      const decoded = jwtDecode(token);
      console.log('Decoded JWT:', decoded);

      // ✅ Show success message with 3-sec delay
      Swal.fire({
        icon: 'success',
        title: 'Login Successful!',
        text: 'Redirecting in 3 seconds...',
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false
      });

      setTimeout(() => {
        switch (decoded.role) {
          case 'admin':
            navigate('/dashboard');
            break;
          case 'employee':
            navigate('/attendance');
            break;
          default:
            navigate('/');
        }
      }, 3000);

    } catch (err) {
      console.error('Login error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: err.response?.data?.message || err.message || 'Please try again.',
        confirmButtonColor: '#e53e3e'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-200 via-lime-100 to-yellow-50">
      <div className="relative w-full max-w-md backdrop-filter backdrop-blur-md bg-white bg-opacity-30 rounded-2xl shadow-2xl overflow-hidden border border-white border-opacity-20">
        <div className="p-8">
          <div className="flex justify-center items-center gap-6 mb-6">
            <img src={urbancodeLogo} alt="Urbancode" className="h-12 object-contain" />
            <span className="text-2xl font-bold text-gray-800">UC & JZ</span>
            <img src={jobzenterLogo} alt="Jobzenter" className="h-12 object-contain" />
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h2>
            <p className="text-gray-600">Sign in to access your account</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white bg-opacity-40 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white bg-opacity-40 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 text-sm text-gray-700">
                <input type="checkbox" className="rounded border-gray-300" />
                <span>Remember me</span>
              </label>
              <button
                type="button"
                className="text-sm text-green-700 hover:underline"
                onClick={() => Swal.fire({
                  icon: 'info',
                  title: 'Forgot Password',
                  text: 'This feature is coming soon.',
                  confirmButtonColor: '#10b981'
                })}
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </>
              ) : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Don’t have an account?{' '}
            <a href="/register" className="text-green-700 font-medium hover:underline">Register</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
