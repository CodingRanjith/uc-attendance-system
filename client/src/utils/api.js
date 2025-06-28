// src/utils/api.js
// export const BASE_URL = 'https://uc-attendance-system-1ts2.onrender.com';

// src/utils/api.js

// Base URL
export const BASE_URL = 'http://localhost:5000'; // Change to your live domain when needed

// -----------------
// Auth & User APIs
// -----------------
export const API_ENDPOINTS = {
  login: `${BASE_URL}/login`,
  authLogin: `${BASE_URL}/api/auth/login`,
  register: `${BASE_URL}/register`,
  getUsers: `${BASE_URL}/users`,
  getUserById: (userId) => `${BASE_URL}/users/${userId}`,
  updateUser: (userId) => `${BASE_URL}/users/${userId}`,
  updateSalary: (userId) => `${BASE_URL}/users/${userId}/salary`,
  getCurrentUser: `${BASE_URL}/users/me`,
  getUserById: (id) => `${BASE_URL}/users/${id}`,
  getAttendanceByUser: (id) => `${BASE_URL}/attendance/user/${id}`,


  // -----------------
  // Attendance APIs
  // -----------------
  postAttendance: `${BASE_URL}/attendance`,
  getMyAttendance: `${BASE_URL}/attendance/me`,
  getLastAttendanceGlobal: `${BASE_URL}/attendance/last`,
  getAttendanceAll: `${BASE_URL}/attendance/all`,
  getAttendanceByDate: (date) => `${BASE_URL}/attendance/date/${date}`,
  getAttendanceByUser: (userId) => `${BASE_URL}/attendance/user/${userId}`,
  getUserSummary: (userId, year, month) => `${BASE_URL}/attendance/user/${userId}/summary/${year}/${month}`,
  getLastAttendanceByUser: (userId) => `${BASE_URL}/attendance/user/${userId}/last`,

  // -----------------
  // Admin Dashboard
  // -----------------
  getAdminSummary: `${BASE_URL}/api/admin/summary`,
  getRecentAttendanceLogs: `${BASE_URL}/api/admin/recent-attendance`,

  // -----------------
  // Pending Users
  // -----------------
  pendingUsers: `${BASE_URL}/admin/pending-users`,
  approveUser: `${BASE_URL}/admin/approve`,     // Use: `${approveUser}/${userId}`
  rejectUser: `${BASE_URL}/admin/reject`,       // Use: `${rejectUser}/${userId}`

  // -----------------
  // Leave Management
  // -----------------
  applyLeave: `${BASE_URL}/api/leaves/apply`,
  getMyLeaves: `${BASE_URL}/api/leaves/me`,
  getAllLeaves: `${BASE_URL}/api/leaves/all`,
  updateLeaveStatus: (id) => `${BASE_URL}/api/leaves/${id}`,

  // -----------------
  // Holidays
  // -----------------
  addHoliday: `${BASE_URL}/api/holidays`,
  getHolidays: `${BASE_URL}/api/holidays`,

  // -----------------
  // Tasks
  // -----------------
  getTasksByDate: (date) => `${BASE_URL}/api/tasks/${date}`,
  addTask: `${BASE_URL}/api/tasks`,
  updateTaskStatus: (id) => `${BASE_URL}/api/tasks/${id}`,
  deleteTask: (id) => `${BASE_URL}/api/tasks/${id}`,
  updateFullTask: (id) => `${BASE_URL}/api/tasks/${id}`,             // PUT full task (task name or date)
  getTasksByMonth: (year, month) => `${BASE_URL}/api/tasks/month/${year}/${month}`,
  getTaskSummary: `${BASE_URL}/api/tasks/summary`,                   // Summary: total, done, pending

  // -----------------
  // Misc
  // -----------------
  uploadPath: `${BASE_URL}/uploads`,
};

// -----------------
// Helper Functions (Optional)
// -----------------

export const getAttendanceAll = async () => {
  const response = await fetch(API_ENDPOINTS.getAttendanceAll);
  if (!response.ok) throw new Error('Failed to fetch attendance data');
  return response.json();
};

export const getUsers = async () => {
  const response = await fetch(API_ENDPOINTS.getUsers);
  if (!response.ok) throw new Error('Failed to fetch users data');
  return response.json();
};

export const getAttendanceByDate = async (date) => {
  const response = await fetch(API_ENDPOINTS.getAttendanceByDate(date));
  if (!response.ok) throw new Error('Failed to fetch attendance data');
  return response.json();
};

export const getLastAttendance = async () => {
  const response = await fetch(API_ENDPOINTS.getLastAttendanceGlobal);
  if (!response.ok) throw new Error('Failed to fetch last attendance data');
  return response.json();
};

export const login = async (email, password) => {
  const response = await fetch(API_ENDPOINTS.login, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error('Failed to login');
  return response.json();
};

export const register = async (userData) => {
  const response = await fetch(API_ENDPOINTS.register, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  if (!response.ok) throw new Error('Failed to register');
  return response.json();
};

export const logout = () => {
  localStorage.removeItem('token');
};
