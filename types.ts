export interface Subject {
  id: string;
  name: string;
  color: string;
}

export type ReviewStatus = 'due' | 'reviewed' | 'pending';
export type Priority = 'low' | 'medium' | 'high';

export interface StudySession {
  id: string;
  subjectId: string;
  topic: string;
  dueDate: string; // ISO Date string
  lastReviewed?: string;
  interval: number; // Days
  easeFactor: number; // For SM-2 algorithm
  repetitions: number;
  strategy: 'smart' | 'fixed';
  fixedPattern?: number[]; // e.g., [1, 3, 7]
  status: ReviewStatus;
}

export interface Reward {
  id: string;
  name: string;
  cost: number;
  icon: string;
}

export interface UserHistory {
  [date: string]: number; // date string -> count
}

export interface UserProfile {
  name: string;
  avatar: string;
  title: string;
  xp: number;
  level: number;
  coins: number;
  currentStreak: number;
  longestStreak: number;
  totalReviews: number;
  lastStudyDate: string; // ISO Date string
  inventory: string[]; // Owned items
  customRewards: Reward[];
  history: UserHistory;
}

export interface ThemeConfig {
  name: string;
  mode: 'light' | 'dark';
  fontFamily: string;
  primaryColor: string;
  sidebarStyle: 'solid' | 'glass' | 'minimal';
  backgroundImage: string;
  bgConfig: {
    blur: number;
    opacity: number;
    scale: number;
    posX: number;
    posY: number;
    portraitMode: boolean; // If true, bg only shows on sidebar
  };
}

export interface Challenge {
  id: string;
  type: 'research' | 'quiz' | 'custom';
  category: 'Medical' | 'General' | string;
  title: string; // Topic title
  deadline: string; // ISO Date
  reward: number;
  completed: boolean;
}

export interface AppState {
  subjects: Subject[];
  sessions: StudySession[];
  user: UserProfile;
  theme: ThemeConfig;
  challenges: Challenge[];
  activeTab: 'dashboard' | 'calendar' | 'market' | 'profile' | 'settings' | 'support';
}