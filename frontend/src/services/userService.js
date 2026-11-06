import api from './api';

export const userService = {
  async getUsers(params = {}) {
    const response = await api.get('/users', { params });
    return response.data;
  },

  async getUser(userId) {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  async createUser(userData) {
    const response = await api.post('/users', userData);
    return response.data;
  },

  async updateUser(userId, userData) {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  },

  async toggleUserStatus(userId, isActive) {
    const response = await api.patch(`/users/${userId}/status`, { is_active: isActive });
    return response.data;
  },

  async getDepartments() {
    const response = await api.get('/departments');
    return response.data;
  },

  async createDepartment(deptData) {
    const response = await api.post('/departments', deptData);
    return response.data;
  },
};
