import { ThemeConfig, UserProfile, Subject, StudySession } from './types';

export const INITIAL_SUBJECTS: Subject[] = [
  { id: 'sub-1', name: 'Anatomy', color: '#ef4444' }, // Red
  { id: 'sub-2', name: 'Pharmacology', color: '#3b82f6' }, // Blue
  { id: 'sub-3', name: 'Pathology', color: '#10b981' }, // Green
  { id: 'sub-4', name: 'Neurology', color: '#8b5cf6' }, // Purple
];

export const INITIAL_USER: UserProfile = {
  name: 'Medical Student',
  avatar: '👨‍⚕️',
  title: 'Med Student',
  xp: 0,
  level: 1,
  coins: 50,
  currentStreak: 0,
  longestStreak: 0,
  totalReviews: 0,
  lastStudyDate: new Date().toISOString(),
  inventory: [],
  customRewards: [],
  history: {},
};

export const DEFAULT_THEME: ThemeConfig = {
  name: 'Medic',
  mode: 'light',
  fontFamily: 'Inter',
  primaryColor: '#0ea5e9', // Sky blue
  sidebarStyle: 'solid',
  backgroundImage: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80', // High quality medical aesthetic
  bgConfig: {
    blur: 0,
    opacity: 100,
    scale: 100,
    posX: 50,
    posY: 50,
    portraitMode: true,
  },
};

export const TITLES = [
  { xp: 0, title: 'Med Student' },
  { xp: 500, title: 'Intern' },
  { xp: 1500, title: 'Resident' },
  { xp: 3000, title: 'Registrar' },
  { xp: 5000, title: 'Specialist' },
  { xp: 8000, title: 'Consultant' },
  { xp: 12000, title: 'Chief of Medicine' },
  { xp: 20000, title: 'Surgeon General' },
];

export const PRESET_THEMES: Record<string, ThemeConfig> = {
  Standard: DEFAULT_THEME,
  Elite: {
    name: 'Elite',
    mode: 'dark',
    fontFamily: 'Playfair Display',
    primaryColor: '#d4af37', // Gold
    sidebarStyle: 'glass',
    backgroundImage: 'https://images.unsplash.com/photo-1580136608079-72029d0de130?auto=format&fit=crop&q=80', // Library
    bgConfig: { blur: 5, opacity: 40, scale: 110, posX: 50, posY: 50, portraitMode: false },
  },
  Kira: {
    name: 'Kira',
    mode: 'dark',
    fontFamily: 'Cinzel',
    primaryColor: '#dc2626', // Red
    sidebarStyle: 'minimal',
    backgroundImage: 'https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?auto=format&fit=crop&q=80', // Dark aesthetic
    bgConfig: { blur: 0, opacity: 20, scale: 100, posX: 50, posY: 50, portraitMode: false },
  },
  Zen: {
    name: 'Zen',
    mode: 'light',
    fontFamily: 'Quicksand',
    primaryColor: '#84cc16', // Lime
    sidebarStyle: 'glass',
    backgroundImage: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?auto=format&fit=crop&q=80', // Nature
    bgConfig: { blur: 2, opacity: 80, scale: 100, posX: 50, posY: 50, portraitMode: true },
  }
};

export const QUOTES = [
  "The art of medicine consists of amusing the patient while nature cures the disease. - Voltaire",
  "Wherever the art of Medicine is loved, there is also a love of Humanity. - Hippocrates",
  "Learning without thought is labor lost; thought without learning is perilous. - Confucius",
  "Success is the sum of small efforts, repeated day in and day out. - Robert Collier",
  "He who has a why to live can bear almost any how. - Friedrich Nietzsche",
  "Study hard what interests you the most in the most undisciplined, irreverent and original manner possible. - Richard Feynman",
];