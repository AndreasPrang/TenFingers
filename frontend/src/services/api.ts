import axios from 'axios';
import { AuthResponse, Lesson, Progress, UserStats, Class, Student, StudentProgress } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

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
  register: async (username: string, email: string, password: string, role?: string): Promise<AuthResponse> => {
    const response = await api.post('/api/auth/register', { username, email, password, role });
    return response.data;
  },

  login: async (username: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/api/auth/login', { username, password });
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/api/auth/profile');
    return response.data;
  },
};

// Lessons API
export const lessonsAPI = {
  getAllLessons: async (): Promise<Lesson[]> => {
    const response = await api.get('/api/lessons');
    return response.data;
  },

  getLessonById: async (id: number): Promise<Lesson> => {
    const response = await api.get(`/api/lessons/${id}`);
    return response.data;
  },

  getLessonsByLevel: async (level: number): Promise<Lesson[]> => {
    const response = await api.get(`/api/lessons/level/${level}`);
    return response.data;
  },
};

// Progress API
export const progressAPI = {
  saveProgress: async (
    lesson_id: number,
    wpm: number,
    accuracy: number,
    completed: boolean
  ): Promise<Progress> => {
    const response = await api.post('/api/progress', {
      lesson_id,
      wpm,
      accuracy,
      completed,
    });
    return response.data;
  },

  getUserProgress: async (): Promise<Progress[]> => {
    const response = await api.get('/api/progress');
    return response.data;
  },

  getLessonProgress: async (lessonId: number): Promise<Progress[]> => {
    const response = await api.get(`/api/progress/lesson/${lessonId}`);
    return response.data;
  },

  getUserStats: async (): Promise<UserStats> => {
    const response = await api.get('/api/progress/stats');
    return response.data;
  },
};

// Classes API (nur für Lehrer)
export const classesAPI = {
  createClass: async (name: string): Promise<Class> => {
    const response = await api.post('/api/classes', { name });
    return response.data.class;
  },

  getTeacherClasses: async (): Promise<Class[]> => {
    const response = await api.get('/api/classes');
    return response.data;
  },

  getClassById: async (id: number): Promise<Class> => {
    const response = await api.get(`/api/classes/${id}`);
    return response.data;
  },

  addStudentToClass: async (
    classId: number,
    username: string,
    password: string,
    email?: string
  ): Promise<Student> => {
    const response = await api.post(`/api/classes/${classId}/students`, {
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
    const response = await api.post(`/api/classes/${classId}/students/bulk`, {
      names,
    });
    return response.data;
  },

  getClassStudents: async (classId: number): Promise<Student[]> => {
    const response = await api.get(`/api/classes/${classId}/students`);
    return response.data;
  },

  getClassProgress: async (classId: number): Promise<StudentProgress[]> => {
    const response = await api.get(`/api/classes/${classId}/progress`);
    return response.data;
  },

  updateStudent: async (
    classId: number,
    studentId: number,
    username: string,
    email?: string,
    password?: string
  ): Promise<Student> => {
    const response = await api.put(`/api/classes/${classId}/students/${studentId}`, {
      username,
      email,
      password,
    });
    return response.data.student;
  },

  deleteStudent: async (classId: number, studentId: number): Promise<void> => {
    await api.delete(`/api/classes/${classId}/students/${studentId}`);
  },

  deleteClass: async (classId: number): Promise<void> => {
    await api.delete(`/api/classes/${classId}`);
  },
};

export default api;
