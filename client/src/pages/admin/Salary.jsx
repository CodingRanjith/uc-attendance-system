// src/pages/admin/Salary.jsx

import React, { useEffect, useState } from 'react';
import Layout from '../../components/admin-dashboard/layout/Layout';
import SalaryDetails from '../../components/admin-dashboard/payroll/SalaryDetails';
import axios from 'axios';
import { API_ENDPOINTS } from '../../utils/api';

const Salary = () => {
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    // Fetch employee data (simulate or use backend)
    const fetchEmployees = async () => {
      try {
        const response = await axios.get(API_ENDPOINTS.getUsers);
        const usersWithSalary = response.data.map((emp) => ({
          ...emp,
          salary: emp.salary || '', // If salary field exists in DB
        }));
        setEmployees(usersWithSalary);
      } catch (err) {
        console.error('Failed to fetch users:', err);
      }
    };
    fetchEmployees();
  }, []);

  const handleSalaryChange = (id, newSalary) => {
    setEmployees((prev) =>
      prev.map((emp) =>
        emp._id === id ? { ...emp, salary: newSalary } : emp
      )
    );
  };

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Salary Management</h1>
        <div className="overflow-x-auto bg-white shadow rounded-lg">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-700 uppercase">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Position</th>
                <th className="px-4 py-3">Salary (₹)</th>
              </tr>
            </thead>
            <tbody className="text-gray-800">
              {employees.map((emp) => (
                <SalaryDetails
                  key={emp._id}
                  employee={emp}
                  onSalaryChange={handleSalaryChange}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default Salary;
