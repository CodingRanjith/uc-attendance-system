// src/utils/api.js
export const BASE_URL = 'https://uc-attendance-system.onrender.com';

// export const BASE_URL = 'http://localhost:5000';

export const API_ENDPOINTS = {
  // Auth
  login: `${BASE_URL}/login`,
  authLogin: `${BASE_URL}/api/auth/login`,
  register: `${BASE_URL}/register`,

  // Attendance
  postAttendance: `${BASE_URL}/attendance`,
  getMyAttendance: `${BASE_URL}/attendance/me`,
  getLastAttendance: `${BASE_URL}/attendance/last`,
  getAttendanceAll: `${BASE_URL}/attendance/all`,
  getAttendanceByDate: (date) => `${BASE_URL}/attendance/date/${date}`,
  getAttendanceByUser: (userId) => `${BASE_URL}/attendance/user/${userId}`,

  // Users
  getUsers: `${BASE_URL}/users`,
  getUserById: (userId) => `${BASE_URL}/users/${userId}`,
  updateUser: (userId) => `${BASE_URL}/users/${userId}`,
  getCurrentUser: `${BASE_URL}/users/me`,

  // Admin Dashboard
  getAdminSummary: `${BASE_URL}/api/admin/summary`,
  getRecentAttendanceLogs: `${BASE_URL}/api/admin/recent-attendance`,

  // Misc
  uploadPath: `${BASE_URL}/uploads`,
};



export const getAttendanceAll = async () => {
  const response = await fetch(API_ENDPOINTS.getAttendanceAll);
  if (!response.ok) {
    throw new Error('Failed to fetch attendance data');
  }
  return response.json();
}

export const getUsers = async () => {
  const response = await fetch(API_ENDPOINTS.getUsers);
  if (!response.ok) {
    throw new Error('Failed to fetch users data');
  }
  return response.json();
}

export const getAttendanceByDate = async (date) => {
  const response = await fetch(API_ENDPOINTS.getAttendanceByDate(date));
  if (!response.ok) {
    throw new Error('Failed to fetch attendance data');
  }
  return response.json();
}

export const getLastAttendance = async () => {
  const response = await fetch(API_ENDPOINTS.getLastAttendance);
  if (!response.ok) {
    throw new Error('Failed to fetch last attendance data');
  }
  return response.json();
}

export const login = async (username, password) => {
  const response = await fetch(API_ENDPOINTS.login, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) {
    throw new Error('Failed to login');
  }
  return response.json();
}

export const register = async (username, password) => {
  const response = await fetch(API_ENDPOINTS.register, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) {
    throw new Error('Failed to register');
  }
  return response.json();
}

export const logout = () => {
  localStorage.removeItem('token');
  // Optionally, you can also clear user data from context or state
}

