import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { API_ENDPOINTS } from '../utils/api';
import Swal from 'sweetalert2';

import jobzenterLogo from '../assets/jzlogo.png';
import urbancodeLogo from '../assets/uclogo.png';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post(API_ENDPOINTS.login, { email, password }, { validateStatus: s => s < 500 });

      if (response.status !== 200) throw new Error(response.data?.error || 'Login failed');

      const token = response.data.token;
      localStorage.setItem('token', token);
      const decoded = jwtDecode(token);

      Swal.fire({
        icon: 'success',
        title: 'Welcome!',
        text: 'Login successful. Redirecting...',
        timer: 2000,
        showConfirmButton: false,
        timerProgressBar: true,
      });

      setTimeout(() => {
        if (decoded.role === 'admin') navigate('/dashboard');
        else if (decoded.role === 'employee') navigate('/attendance');
        else navigate('/');
      }, 2000);

    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: err?.message || 'Something went wrong.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-200 via-yellow-100 to-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white/70 backdrop-blur-lg border border-white/30 rounded-3xl shadow-2xl px-8 py-10">
        <div className="flex justify-center items-center gap-4 mb-6">
          <img src={urbancodeLogo} alt="UC" className="h-10" />
          <h1 className="text-2xl font-bold text-gray-800 tracking-wide">UC & JZ</h1>
          <img src={jobzenterLogo} alt="JZ" className="h-10" />
        </div>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-800 mb-2">Sign In</h2>
          <p className="text-gray-600 text-sm">Enter your credentials below</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white/60 placeholder-gray-400 text-gray-800 focus:ring-2 focus:ring-green-400 focus:outline-none"
              placeholder="you@domain.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white/60 placeholder-gray-400 text-gray-800 focus:ring-2 focus:ring-green-400 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-gray-700">
              <input type="checkbox" className="accent-green-600" />
              Remember me
            </label>
            <button
              type="button"
              onClick={() =>
                Swal.fire({
                  icon: 'info',
                  title: 'Forgot Password?',
                  text: 'This feature is coming soon!',
                })
              }
              className="text-green-600 hover:underline font-medium"
            >
              Forgot?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition duration-150 shadow-md"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center text-sm mt-6 text-gray-600">
          Don’t have an account?{' '}
          <a href="/register" className="text-green-700 font-semibold hover:underline">
            Register
          </a>
        </div>
      </div>
    </div>
  );
}

export default Login;
