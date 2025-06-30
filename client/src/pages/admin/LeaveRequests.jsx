import React, { useEffect, useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import Swal from 'sweetalert2';
import { API_ENDPOINTS } from '../../utils/api';

const LeaveRequestsAdmin = () => {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(API_ENDPOINTS.getAllLeaves, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(res.data);
      setFilteredRequests(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    const confirm = await Swal.fire({
      title: `Are you sure you want to ${status.toLowerCase()} this leave?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `Yes, ${status}`,
      cancelButtonText: 'Cancel',
    });

    if (!confirm.isConfirmed) return;

    try {
      setUpdatingId(id);
      const token = localStorage.getItem('token');
      await axios.patch(API_ENDPOINTS.updateLeaveStatus(id), { status }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFilteredRequests((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status } : r))
      );
      Swal.fire(`Leave ${status.toLowerCase()} successfully`, '', 'success');
    } catch (err) {
      console.error('Status update error:', err);
      Swal.fire('Failed to update leave status', '', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteRequest = async (id) => {
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: 'You are about to delete this leave request permanently.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel',
  });

  if (result.isConfirmed) {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(API_ENDPOINTS.deleteLeaveRequest(id), {
        headers: { Authorization: `Bearer ${token}` },
      });

      setFilteredRequests((prev) => prev.filter((req) => req._id !== id));
      setRequests((prev) => prev.filter((req) => req._id !== id));

      Swal.fire('Deleted!', 'Leave request has been deleted.', 'success');
    } catch (error) {
      console.error('Delete error:', error);
      Swal.fire('Error!', 'Failed to delete leave request.', 'error');
    }
  }
};

  const handleFilter = () => {
    if (!fromDate || !toDate) {
      setFilteredRequests(requests);
      return;
    }
    const from = dayjs(fromDate);
    const to = dayjs(toDate);

    const filtered = requests.filter((req) => {
      const leaveDate = dayjs(req.fromDate);
      return leaveDate.isAfter(from.subtract(1, 'day')) && leaveDate.isBefore(to.add(1, 'day'));
    });

    setFilteredRequests(filtered);
  };

  if (loading) return <div className="p-6">Loading leave requests...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Leave Requests</h2>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <label className="text-sm font-medium">
          From:
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="ml-2 border px-2 py-1 rounded"
          />
        </label>
        <label className="text-sm font-medium">
          To:
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="ml-2 border px-2 py-1 rounded"
          />
        </label>
        <button
          onClick={handleFilter}
          className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
        >
          Filter
        </button>
        <button
          onClick={() => {
            setFromDate('');
            setToDate('');
            setFilteredRequests(requests);
          }}
          className="bg-gray-500 text-white px-4 py-1 rounded hover:bg-gray-600"
        >
          Reset
        </button>
      </div>

      {/* Card View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredRequests.map((req) => (
          <div key={req._id} className="bg-white rounded-lg shadow border p-5">
            <div className="mb-2">
              <h3 className="text-lg font-semibold text-gray-700">{req.user?.name || 'Unknown User'}</h3>
              <p className="text-sm text-gray-500">Leave Type: {req.leaveType}</p>
            </div>
            <div className="text-sm space-y-1 mb-3 text-gray-600">
              <p><strong>From:</strong> {dayjs(req.fromDate).format('YYYY-MM-DD')}</p>
              <p><strong>To:</strong> {dayjs(req.toDate).format('YYYY-MM-DD')}</p>
              <p><strong>Reason:</strong> {req.reason}</p>
              <p>
                <strong>Status:</strong>{' '}
                <span
                  className={`font-semibold ${
                    req.status === 'Pending'
                      ? 'text-yellow-600'
                      : req.status === 'Approved'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {req.status}
                </span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => updateStatus(req._id, 'Approved')}
                disabled={updatingId === req._id || req.status === 'Approved'}
                className="bg-green-500 text-white px-4 py-1 rounded disabled:opacity-50"
              >
                Approve
              </button>
              <button
                onClick={() => updateStatus(req._id, 'Rejected')}
                disabled={updatingId === req._id || req.status === 'Rejected'}
                className="bg-red-500 text-white px-4 py-1 rounded disabled:opacity-50"
              >
                Reject
              </button>
              <button
  onClick={() => deleteRequest(req._id)}
  className="bg-gray-700 text-white px-4 py-1 rounded hover:bg-gray-800"
>
  Delete
</button>

            </div>
          </div>
        ))}
        {filteredRequests.length === 0 && (
          <p className="text-gray-500 col-span-full text-center">
            No leave requests found for the selected range.
          </p>
        )}
      </div>
    </div>
  );
};

export default LeaveRequestsAdmin;
