import axios from 'axios';
import { AuthResponse, Lesson, Progress, UserStats, Class, Student, StudentProgress, Badge, CurrentBadgeResponse, BadgeProgressResponse, UserBadgesResponse } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor um automatisch den Token zu jedem Request hinzuzufügen
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (username: string, email: string, password: string, role?: string, displayName?: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', { username, email, password, role, displayName });
    return response.data;
  },

  login: async (username: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  updateProfile: async (data: { displayName?: string | null; email?: string | null }): Promise<{ message: string; user: any }> => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },

  deleteAccount: async (): Promise<{ message: string }> => {
    const response = await api.delete('/auth/account');
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
    const response = await api.put('/auth/password', {
      currentPassword,
      newPassword
    });
    return response.data;
  },
};

// Lessons API
export const lessonsAPI = {
  getAllLessons: async (): Promise<Lesson[]> => {
    const response = await api.get('/lessons');
    return response.data;
  },

  getLessonById: async (id: number): Promise<Lesson> => {
    const response = await api.get(`/lessons/${id}`);
    return response.data;
  },

  getLessonsByLevel: async (level: number): Promise<Lesson[]> => {
    const response = await api.get(`/lessons/level/${level}`);
    return response.data;
  },
};

// Progress API
export const progressAPI = {
  saveProgress: async (
    lesson_id: number,
    wpm: number,
    accuracy: number,
    completed: boolean,
    is_anonymous: boolean = false
  ): Promise<Progress> => {
    const response = await api.post('/progress', {
      lesson_id,
      wpm,
      accuracy,
      completed,
      is_anonymous,
    });
    return response.data;
  },

  getUserProgress: async (): Promise<Progress[]> => {
    const response = await api.get('/progress');
    return response.data;
  },

  getLessonProgress: async (lessonId: number): Promise<Progress[]> => {
    const response = await api.get(`/progress/lesson/${lessonId}`);
    return response.data;
  },

  getUserStats: async (): Promise<UserStats> => {
    const response = await api.get('/progress/stats');
    return response.data;
  },
};

// Classes API (nur für Lehrer)
export const classesAPI = {
  createClass: async (name: string): Promise<Class> => {
    const response = await api.post('/classes', { name });
    return response.data.class;
  },

  getTeacherClasses: async (): Promise<Class[]> => {
    const response = await api.get('/classes');
    return response.data;
  },

  getClassById: async (id: number): Promise<Class> => {
    const response = await api.get(`/classes/${id}`);
    return response.data;
  },

  addStudentToClass: async (
    classId: number,
    username: string,
    password: string,
    email?: string
  ): Promise<Student> => {
    const response = await api.post(`/classes/${classId}/students`, {
      username,
      email,
      password,
    });
    return response.data.student;
  },

  bulkCreateStudents: async (
    classId: number,
    names: string[]
  ): Promise<{ students: Array<{ id: number; username: string; password: string; createdAt: string }>; errors?: Array<{ name: string; error: string }> }> => {
    const response = await api.post(`/classes/${classId}/students/bulk`, {
      names,
    });
    return response.data;
  },

  getClassStudents: async (classId: number): Promise<Student[]> => {
    const response = await api.get(`/classes/${classId}/students`);
    return response.data;
  },

  getClassProgress: async (classId: number): Promise<StudentProgress[]> => {
    const response = await api.get(`/classes/${classId}/progress`);
    return response.data;
  },

  updateStudent: async (
    classId: number,
    studentId: number,
    username: string,
    email?: string,
    password?: string
  ): Promise<Student> => {
    const response = await api.put(`/classes/${classId}/students/${studentId}`, {
      username,
      email,
      password,
    });
    return response.data.student;
  },

  deleteStudent: async (classId: number, studentId: number): Promise<void> => {
    await api.delete(`/classes/${classId}/students/${studentId}`);
  },

  deleteClass: async (classId: number): Promise<void> => {
    await api.delete(`/classes/${classId}`);
  },
};

// Admin API (nur für Admins)
export const adminAPI = {
  getDashboardStats: async (): Promise<any> => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  getTimeSeriesData: async (metric: string, days: number = 30): Promise<any> => {
    const response = await api.get('/admin/timeseries', {
      params: { metric, days }
    });
    return response.data;
  },

  getPerformanceDistribution: async (): Promise<any> => {
    const response = await api.get('/admin/performance-distribution');
    return response.data;
  },

  getPopularLessons: async (): Promise<any> => {
    const response = await api.get('/admin/popular-lessons');
    return response.data;
  },

  getAnonymousVsRegisteredComparison: async (): Promise<any> => {
    const response = await api.get('/admin/anonymous-vs-registered');
    return response.data;
  },
};

// Badges API
export const badgesAPI = {
  getDefinitions: async (): Promise<Badge[]> => {
    const response = await api.get('/badges/definitions');
    return response.data;
  },

  getCurrentBadge: async (): Promise<CurrentBadgeResponse> => {
    const response = await api.get('/badges/current');
    return response.data;
  },

  getProgress: async (): Promise<BadgeProgressResponse> => {
    const response = await api.get('/badges/progress');
    return response.data;
  },

  getAllBadges: async (): Promise<UserBadgesResponse> => {
    const response = await api.get('/badges/all');
    return response.data;
  },
};

export default api;
