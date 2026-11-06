import api from './api';

export const reportService = {
  async getDashboardMetrics() {
    const response = await api.get('/reports/dashboard');
    return response.data;
  },

  async getEmployeeReports() {
    const response = await api.get('/reports/employees');
    return response.data;
  },

  async getTaskReports() {
    const response = await api.get('/reports/tasks');
    return response.data;
  },
};
