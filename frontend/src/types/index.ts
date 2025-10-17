export interface User {
  id: number;
  username: string;
  email: string;
  display_name?: string | null;
  role?: string;
  class_id?: number | null;
  created_at?: string;
}

export interface UserStats {
  id: number;
  user_id: number;
  total_lessons_completed: number;
  average_wpm: number;
  average_accuracy: number;
  total_practice_time: number;
  updated_at: string;
}

export interface Lesson {
  id: number;
  title: string;
  description: string;
  level: number;
  text_content: string;
  target_keys: string;
  lesson_type?: string;
  created_at: string;
}

export interface Progress {
  id: number;
  user_id: number;
  lesson_id: number;
  wpm: number;
  accuracy: number;
  completed: boolean;
  completed_at?: string;
  created_at: string;
  title?: string;
  level?: number;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface TypingStats {
  wpm: number;
  accuracy: number;
  correctChars: number;
  incorrectChars: number;
  totalChars: number;
}

export interface Class {
  id: number;
  name: string;
  teacher_id: number;
  student_count?: number;
  created_at: string;
}

export interface Student {
  id: number;
  username: string;
  email: string;
  created_at: string;
  total_lessons_completed?: number;
  average_wpm?: number;
  average_accuracy?: number;
}

export interface StudentProgress {
  student_id: number;
  username: string;
  total_lessons_completed: number;
  average_wpm: number;
  average_accuracy: number;
  total_practice_time: number;
  lessons_attempted: number;
  last_practice: string;
}

export interface Badge {
  level: number;
  name: string;
  icon: string;
  color: string;
  minLessons: number;
  minWpm: number;
  minAccuracy: number;
  minLessonAccuracy: number;
  earned?: boolean;
  earnedAt?: string | null;
}

export interface BadgeStats {
  avgWpm: number;
  avgAccuracy: number;
  lessonsCompleted: number;
  lessonsAbove80: number;
  lessonsAbove85: number;
  lessonsAbove90: number;
  lessonsAbove95: number;
  lessonsAbove98: number;
}

export interface CurrentBadgeResponse {
  currentBadge: Badge | null;
  nextBadge: Badge | null;
  earnedBadges?: Badge[];
  stats: BadgeStats;
}

export interface BadgeRequirement {
  current: number;
  required: number;
  progress: number;
  met: boolean;
  description: string;
}

export interface BadgeProgressResponse {
  isMaxLevel?: boolean;
  message?: string;
  nextBadge?: Badge;
  requirements?: {
    lessons: BadgeRequirement;
    wpm: BadgeRequirement;
    accuracy: BadgeRequirement;
  };
  overallProgress?: number;
}

export interface UserBadgesResponse {
  badges: Badge[];
  earnedCount: number;
  totalCount: number;
}
