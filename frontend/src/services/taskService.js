import api from './api';

export const taskService = {
  async getAllTasks(params = {}) {
    const response = await api.get('/tasks', { params });
    return response.data;
  },

  async getMyTasks(params = {}) {
    const response = await api.get('/tasks/my-tasks', { params });
    return response.data;
  },

  async getDelegatedByMeTasks(params = {}) {
    const response = await api.get('/tasks/delegated-by-me', { params });
    return response.data;
  },

  async getTaskDetail(taskId) {
    const response = await api.get(`/tasks/${taskId}`);
    return response.data;
  },

  async createTask(taskData) {
    const response = await api.post('/tasks', taskData);
    return response.data;
  },

  async updateTaskMetadata(taskId, data) {
    const response = await api.patch(`/tasks/${taskId}`, data);
    return response.data;
  },

  async updateTaskStatus(taskId, status, comment = '') {
    const response = await api.patch(`/tasks/${taskId}/status`, { status, comment });
    return response.data;
  },

  async delegateTask(taskId, toUserId, reason) {
    const response = await api.post(`/tasks/${taskId}/delegate`, {
      to_user_id: toUserId,
      reassignment_reason: reason,
    });
    return response.data;
  },

  async getTaskHistory(taskId) {
    const response = await api.get(`/tasks/${taskId}/history`);
    return response.data;
  },

  async addProgressUpdate(taskId, updateText, progressPercentage) {
    const response = await api.post(`/tasks/${taskId}/updates`, {
      update_text: updateText,
      progress_percentage: progressPercentage,
    });
    return response.data;
  },

  async addComment(taskId, commentText) {
    const response = await api.post(`/tasks/${taskId}/comments`, {
      comment_text: commentText,
    });
    return response.data;
  },
};

