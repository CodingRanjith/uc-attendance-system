import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './pages/Dashboard';
import Attendance from './components/Attendance';
import EditUser from './components/EditUser';
// import { AuthProvider } from './components/AuthContext';

function App() {
  return (
    <Router>
        <Routes>
          <Route path="/" element={<Login />} /> {/* Changed default route */}
          <Route path="/login" element={<Login />} /> {/* Optional if you still want access */}
          <Route path="/register" element={<Register />} /> 
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/edit-user" element={<EditUser />} />
        </Routes>
    </Router>
  );
}

export default App;
