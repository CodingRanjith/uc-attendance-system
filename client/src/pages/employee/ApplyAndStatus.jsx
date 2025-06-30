// File: src/pages/employee/ApplyAndStatus.jsx

import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { API_ENDPOINTS } from '../../utils/api';

const ApplyAndStatus = () => {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [leaveType, setLeaveType] = useState('Casual');
  const [leaves, setLeaves] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLeaves, setTotalLeaves] = useState(0);
  const leavesPerPage = 5;
  const token = localStorage.getItem('token');

  const fetchLeaves = useCallback(async () => {
    try {
      const res = await axios.get(`${API_ENDPOINTS.getMyLeaves}?page=${currentPage}&limit=${leavesPerPage}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLeaves(res.data?.leaves || []);
      setTotalLeaves(res.data?.total || 0);
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to fetch leaves', 'error');
    }
  }, [currentPage, token]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (new Date(fromDate) > new Date(toDate)) {
      Swal.fire('Invalid Dates', 'From Date should not be after To Date.', 'warning');
      return;
    }

    try {
      await axios.post(API_ENDPOINTS.applyLeave, { fromDate, toDate, reason, leaveType }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Swal.fire({
        icon: 'success',
        title: 'Leave Applied!',
        text: 'Your leave has been submitted successfully.',
        showConfirmButton: false,
        timer: 1500,
      });

      setFromDate('');
      setToDate('');
      setReason('');
      setLeaveType('Casual');
      fetchLeaves();
    } catch (error) {
      Swal.fire('Error', 'Failed to apply for leave', 'error');
    }
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You want to delete this leave request?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`${API_ENDPOINTS.deleteLeave}/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          Swal.fire('Deleted!', 'Your leave request has been deleted.', 'success');
          fetchLeaves();
        } catch (err) {
          console.error(err);
          Swal.fire('Error', 'Failed to delete leave', 'error');
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="bg-white shadow-xl rounded-3xl p-8 w-full max-w-4xl border border-blue-100">
        <h2 className="text-2xl font-bold text-center text-indigo-700 mb-6">Apply for Leave</h2>
        
        {/* Leave Application Form */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div>
            <label className="block text-sm font-medium mb-1">From Date</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} required className="w-full border rounded-xl px-4 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">To Date</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} required className="w-full border rounded-xl px-4 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Leave Type</label>
            <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)} className="w-full border rounded-xl px-4 py-2">
              <option value="Casual">Casual</option>
              <option value="Sick">Sick</option>
              <option value="Emergency">Emergency</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Reason</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} required className="w-full border rounded-xl px-4 py-2" placeholder="Brief reason for leave..." />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700 transition">Submit</button>
          </div>
        </form>

        {/* Leave Status Display */}
        <h3 className="text-lg font-semibold mb-4 text-indigo-600">Your Leave Requests</h3>
        <div className="grid gap-4">
          {leaves && leaves.length > 0 ? leaves.map((leave) => (
            <div key={leave._id} className="border rounded-xl p-4 shadow-md bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-700">{leave.leaveType || 'Leave'} Leave</p>
                  <p className="text-sm text-gray-500">From: {leave.fromDate ? new Date(leave.fromDate).toLocaleDateString() : '-'}</p>
                  <p className="text-sm text-gray-500">To: {leave.toDate ? new Date(leave.toDate).toLocaleDateString() : '-'}</p>
                  <p className="text-sm text-gray-500">Reason: {leave.reason}</p>
                </div>
                <div className="text-right space-y-2">
                  <span className={`text-sm font-bold px-3 py-1 rounded-xl ${
                    leave.status === 'Approved' ? 'bg-green-200 text-green-700' :
                    leave.status === 'Rejected' ? 'bg-red-200 text-red-700' :
                    'bg-yellow-200 text-yellow-800'
                  }`}>
                    {leave.status || 'Pending'}
                  </span>
                  <br />
                </div>
              </div>
            </div>
          )) : (
            <p className="text-gray-500 text-center">No leave history found.</p>
          )}
        </div>

        {/* Pagination */}
        <div className="flex justify-center mt-6 space-x-2">
          {Array.from({ length: Math.ceil(totalLeaves / leavesPerPage) }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded ${currentPage === i + 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ApplyAndStatus;
