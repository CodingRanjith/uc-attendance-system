import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { API_ENDPOINTS } from '../utils/api';

function Login() {
  // Geolocation logging for development/debugging
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
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post(API_ENDPOINTS.login, { email, password }, {
        validateStatus: status => status < 500
      });

      if (response.status !== 200) {
        throw new Error(response.data?.error || 'Login failed');
      }

      const token = response.data.token;
      localStorage.setItem('token', token);

      const decoded = jwtDecode(token);
      console.log('Decoded JWT:', decoded);

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
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-indigo-900">
      <div className="relative w-full max-w-md backdrop-filter backdrop-blur-lg bg-white bg-opacity-10 rounded-2xl shadow-2xl overflow-hidden border border-white border-opacity-20">
        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-white text-opacity-70">Sign in to access your account</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-400 bg-opacity-20 rounded-lg border border-red-400 border-opacity-30">
              <p className="text-red-100 text-sm">{error}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white text-opacity-80 mb-1">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white placeholder-white placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white text-opacity-80 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white placeholder-white placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center text-sm text-white text-opacity-80">
                <input type="checkbox" className="h-4 w-4 mr-2 text-white bg-opacity-20 border-white border-opacity-20 rounded" />
                Remember me
              </label>
              <button
  type="button"
  onClick={() => alert('Forgot password clicked')} // or navigate to a reset page
  className="text-sm font-medium text-white text-opacity-90 hover:text-opacity-100 underline"
>
  Forgot password?
</button>

            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 text-sm font-medium text-white bg-white bg-opacity-10 rounded-lg shadow-sm hover:bg-opacity-20 focus:ring-2 focus:ring-offset-2 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Optional Social Section */}
          <div className="mt-6 text-center text-sm text-white text-opacity-70">
            <span>Need help? Contact admin.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
