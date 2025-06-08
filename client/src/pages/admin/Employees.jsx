import React from 'react';
import EmployeeList from '../../components/admin-dashboard/employees/EmployeeList';
import Layout from '../../components/admin-dashboard/layout/Layout';

const Employees = () => {
  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Employee Management</h1>
        <EmployeeList />
      </div>
    </Layout>
  );
};

export default Employees;
