// src/utils/api.js
export const BASE_URL = 'https://uc-attendance-system.onrender.com';

export const API_ENDPOINTS = {
  postAttendance: `${BASE_URL}/attendance`,
  getLastAttendance: `${BASE_URL}/attendance/last`,
  getAttendanceAll: `${BASE_URL}/attendance/all`,
  getUsers: `${BASE_URL}/users`,
  getAttendanceByDate: (date) => `${BASE_URL}/admin/attendance?date=${date}`,
  uploadPath: `${BASE_URL}/uploads`,

  // Clearly named auth endpoints
  login: `${BASE_URL}/auth/login`,
  register: `${BASE_URL}/auth/register`,
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

