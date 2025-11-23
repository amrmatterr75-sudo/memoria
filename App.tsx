import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  LayoutDashboard, 
  Settings as SettingsIcon, 
  ShoppingBag, 
  BookOpen, 
  Plus, 
  Trash2, 
  CheckCircle,
  X,
  RefreshCw,
  BrainCircuit,
  Lightbulb,
  Menu,
  Clock,
  ArrowRight,
  Send,
  Loader2,
  Sparkles,
  Coffee,
  Heart,
  Copy,
  CreditCard,
  Smartphone,
  Wifi,
  WifiOff,
  Quote,
  BarChart3,
  Download
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
// Ideally imported from @capacitor/app in a local Node environment
// import { App as CapacitorApp } from '@capacitor/app';

import { AppState, StudySession, Challenge, ReviewStatus, Subject, Reward } from './types';
import { INITIAL_SUBJECTS, INITIAL_USER, DEFAULT_THEME, QUOTES } from './constants';
import { calculateNextReview, isSameDay } from './utils/srs';
import { XPBar, StreakBadge, TrophyCase, StudyHeatmap } from './components/Gamification';
import { Settings } from './components/Settings';

// --- Helper Components ---

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
          <h3 className="font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-4 overflow-y-auto no-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  // State Initialization
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('memoria_data_v1');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Data Migration: Ensure new fields exist for old users
      return {
        ...parsed,
        user: {
          ...INITIAL_USER,
          ...parsed.user,
          customRewards: parsed.user.customRewards || [],
          history: parsed.user.history || {},
          inventory: parsed.user.inventory || []
        }
      };
    }
    return {
      subjects: INITIAL_SUBJECTS,
      sessions: [],
      user: INITIAL_USER,
      theme: DEFAULT_THEME,
      challenges: [],
      activeTab: 'dashboard',
    };
  });

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [isAddChallengeOpen, setIsAddChallengeOpen] = useState(false);
  const [isAddRewardModalOpen, setIsAddRewardModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  
  // Research Submission State
  const [submissionModal, setSubmissionModal] = useState<{ isOpen: boolean; challengeId: string | null }>({ isOpen: false, challengeId: null });
  const [researchText, setResearchText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [activeSession, setActiveSession] = useState<StudySession | null>(null); // For reviewing
  const [dailyQuote, setDailyQuote] = useState(QUOTES[0]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Network State
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Derived State
  const dueSessions = useMemo(() => {
    const now = new Date();
    return state.sessions.filter(s => {
       const d = new Date(s.dueDate);
       return d <= now && s.status !== 'reviewed'; // Logic: overdue or due now
    });
  }, [state.sessions]);

  const sessionsForSelectedDate = useMemo(() => {
    return state.sessions.filter(s => isSameDay(new Date(s.dueDate), selectedDate));
  }, [state.sessions, selectedDate]);

  // Effects
  useEffect(() => {
    localStorage.setItem('memoria_data_v1', JSON.stringify(state));
  }, [state]);

  // Handle Hardware Back Button (Android Native)
  useEffect(() => {
    // This logic runs if the app is bundled with Capacitor
    // We try to dynamically import to prevent crashing in pure web view if module missing
    const setupNativeListeners = async () => {
      try {
        // @ts-ignore
        const { App: CapacitorApp } = await import('@capacitor/app');
        
        CapacitorApp.addListener('backButton', ({ canGoBack }: any) => {
          if (isAddModalOpen || isAddSubjectModalOpen || isAddChallengeOpen || submissionModal.isOpen) {
            // Close modals if open
            setIsAddModalOpen(false);
            setIsAddSubjectModalOpen(false);
            setIsAddChallengeOpen(false);
            setSubmissionModal({isOpen: false, challengeId: null});
          } else if (state.activeTab !== 'dashboard') {
            // Go back to dashboard
            setState(prev => ({ ...prev, activeTab: 'dashboard' }));
          } else {
            // Exit app
            CapacitorApp.exitApp();
          }
        });
      } catch (e) {
        // Not running in native environment or package missing, ignore
      }
    };
    setupNativeListeners();
  }, [state.activeTab, isAddModalOpen]);

  // Online/Offline Listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Set App Icon
  useEffect(() => {
    const setIcon = () => {
      const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement || document.createElement('link');
      link.type = 'image/svg+xml';
      link.rel = 'icon';
      // An SVG combining a brain and a checkmark/plus in primary color
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${state.theme.primaryColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
          <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
          <path d="M15 13a3 3 0 1 0-6 0" />
          <path d="M9 9h.01" />
          <path d="M15 9h.01" />
        </svg>
      `;
      link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
      document.head.appendChild(link);
    };
    setIcon();
  }, [state.theme.primaryColor]);

  // Google Fonts Loader
  useEffect(() => {
    const fontName = state.theme.fontFamily.replace(/\s+/g, '+');
    const linkId = 'dynamic-font-loader';
    let link = document.getElementById(linkId) as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@300;400;500;600;700&display=swap`;
    
    // Apply CSS Variables
    const root = document.documentElement;
    root.style.setProperty('--primary', state.theme.primaryColor);
    root.style.setProperty('--font-main', state.theme.fontFamily);
    
    if (state.theme.mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [state.theme]);

  // Quote Fetcher Logic
  useEffect(() => {
    const fetchQuote = async () => {
      const today = new Date().toISOString().split('T')[0];
      const cached = localStorage.getItem('memoria_quote_data');
      
      // Use cached if it exists and is from today
      if (cached) {
        const { date, content } = JSON.parse(cached);
        if (date === today) {
          setDailyQuote(content);
          return;
        }
      }

      if (!navigator.onLine) {
         // Fallback if offline
         setDailyQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
         return;
      }

      try {
        const response = await fetch('https://api.quotable.io/random?tags=wisdom|inspirational|knowledge');
        if (response.ok) {
          const data = await response.json();
          const newQuote = `"${data.content}" - ${data.author}`;
          setDailyQuote(newQuote);
          localStorage.setItem('memoria_quote_data', JSON.stringify({ date: today, content: newQuote }));
        } else {
           throw new Error("API Error");
        }
      } catch (e) {
        console.warn("Quote fetch failed, using fallback");
        setDailyQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
      }
    };

    fetchQuote();

    const lastStudy = new Date(state.user.lastStudyDate);
    const todayDate = new Date();
    if (!isSameDay(lastStudy, todayDate)) {
        const diff = (todayDate.getTime() - lastStudy.getTime()) / (1000 * 3600 * 24);
        if (diff > 2) {
           setState(prev => ({...prev, user: {...prev.user, currentStreak: 0}}));
        }
    }
  }, []);

  // Actions
  const addSession = (subjectId: string, topic: string, strategy: 'smart' | 'fixed', startDate: string) => {
    const newSession: StudySession = {
      id: Math.random().toString(36).substr(2, 9),
      subjectId,
      topic,
      dueDate: new Date(startDate).toISOString(),
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
      strategy,
      status: 'pending',
      fixedPattern: strategy === 'fixed' ? [1, 3, 7, 14, 30] : undefined
    };
    setState(prev => ({...prev, sessions: [...prev.sessions, newSession]}));
    setIsAddModalOpen(false);
  };

  const addSubject = (name: string, color: string) => {
    const newSubject: Subject = {
      id: `sub-${Date.now()}`,
      name,
      color
    };
    setState(prev => ({...prev, subjects: [...prev.subjects, newSubject]}));
    setIsAddSubjectModalOpen(false);
  };

  const addChallenge = (category: string, title: string, reward: number) => {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);
    const newChallenge: Challenge = {
      id: `man-${Date.now()}`,
      type: 'research',
      category,
      title,
      deadline: deadline.toISOString(),
      reward,
      completed: false
    };
    setState(prev => ({...prev, challenges: [...prev.challenges, newChallenge]}));
    setIsAddChallengeOpen(false);
  };

  const addCustomReward = (name: string, cost: number, icon: string) => {
    if (!name || !cost || !icon) return; // Validation
    
    const newReward: Reward = {
      id: `rew-${Date.now()}`,
      name,
      cost,
      icon
    };
    setState(prev => ({
      ...prev,
      user: {
        ...prev.user,
        customRewards: [...(prev.user.customRewards || []), newReward]
      }
    }));
    setIsAddRewardModalOpen(false);
  };

  const processReview = (quality: 0 | 1 | 2 | 3 | 4 | 5) => {
    if (!activeSession) return;
    
    const updatedSessionFields = calculateNextReview(activeSession, quality);
    let xpGain = 0;
    let coinsGain = 0;
    
    if (quality >= 3) {
      xpGain = 10 * (quality - 2) * (activeSession.interval > 1 ? 1.5 : 1);
      coinsGain = Math.floor(Math.random() * 3) + 1; 
    } else {
      xpGain = 5;
    }

    setState(prev => {
       const updatedSessions = prev.sessions.map(s => 
          s.id === activeSession.id ? { ...s, ...updatedSessionFields } : s
       );
       const today = new Date();
       const isNewDay = !isSameDay(new Date(prev.user.lastStudyDate), today);
       const newStreak = isNewDay ? prev.user.currentStreak + 1 : prev.user.currentStreak;
       
       const todayStr = today.toISOString().split('T')[0];
       const history = { ...(prev.user.history || {}) };
       history[todayStr] = (history[todayStr] || 0) + 1;

       return {
         ...prev,
         sessions: updatedSessions,
         user: {
           ...prev.user,
           xp: Math.floor(prev.user.xp + xpGain),
           coins: prev.user.coins + coinsGain,
           currentStreak: newStreak,
           longestStreak: Math.max(newStreak, prev.user.longestStreak),
           totalReviews: (prev.user.totalReviews || 0) + 1,
           lastStudyDate: today.toISOString(),
           history: history
         }
       };
    });
    setActiveSession(null);
  };

  const fetchChallenges = async () => {
    const medicalTopics = ["Pathophysiology of Hypertension", "CRISPR gene editing applications", "Antibiotic Resistance Mechanisms", "Advancements in Telemedicine", "The role of Gut Microbiome in Immunity"];
    const generalTopics = ["Principles of Quantum Mechanics", "The Fall of the Roman Republic", "Sustainable Urban Planning", "Introduction to Behavioral Economics", "The History of Artificial Intelligence"];

    const randomMed = medicalTopics[Math.floor(Math.random() * medicalTopics.length)];
    const randomGen = generalTopics[Math.floor(Math.random() * generalTopics.length)];
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);

    const newChallenges: Challenge[] = [
      { id: `api-med-${Date.now()}`, type: 'research', category: 'Medical', title: randomMed, deadline: deadline.toISOString(), reward: 20, completed: false },
      { id: `api-gen-${Date.now()}`, type: 'research', category: 'General', title: randomGen, deadline: deadline.toISOString(), reward: 15, completed: false }
    ];
    setState(prev => ({...prev, challenges: [...prev.challenges, ...newChallenges]}));
  };

  const handleSubmitResearch = async () => {
    if (!submissionModal.challengeId || !researchText) return;
    
    setIsAnalyzing(true);
    
    let feedbackText = "";
    const challenge = state.challenges.find(c => c.id === submissionModal.challengeId);
    
    try {
      if (process.env.API_KEY && isOnline) {
        // Use Real AI
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `
          You are a strict but helpful Medical Professor. A student has submitted research notes on the topic: "${challenge?.title}".
          
          Here are their notes:
          "${researchText}"

          Please provide a brief assessment (max 100 words).
          1. Rate their Depth of Understanding (Basic, Intermediate, or Advanced).
          2. Point out one key concept they might have missed or could expand on.
          3. Be encouraging.
        `;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        feedbackText = response.text || "AI response empty.";

      } else {
        // Fallback Simulation if no API Key OR Offline
        await new Promise(resolve => setTimeout(resolve, 2000));
        const wordCount = researchText.trim().split(/\s+/).length;
        if (wordCount < 30) {
          feedbackText = `(Offline Mode) Your notes on "${challenge?.title}" are a bit brief (${wordCount} words). A concise summary is good, but try to elaborate more on the core mechanisms and clinical implications to deepen your understanding.`;
        } else if (wordCount < 80) {
          feedbackText = `(Offline Mode) Good effort on "${challenge?.title}". You have covered the basics well. To reach the next level, consider adding recent case studies or conflicting theories found in modern literature.`;
        } else {
          feedbackText = `(Offline Mode) Outstanding research depth! Your detailed analysis of "${challenge?.title}" shows a strong grasp of the subject. This level of detail will significantly aid your long-term retention.`;
        }
      }
    } catch (error) {
       console.error("AI Error", error);
       feedbackText = "We couldn't connect to the AI professor at this moment, but your effort is noted! Keep digging deeper into the literature.";
    }

    setFeedback(feedbackText);
    setIsAnalyzing(false);
  };

  const confirmResearchReward = () => {
    const challenge = state.challenges.find(c => c.id === submissionModal.challengeId);
    if (!challenge) return;

    setState(prev => ({
      ...prev,
      user: { ...prev.user, coins: prev.user.coins + challenge.reward, xp: prev.user.xp + 50 }, // Bonus XP for research
      challenges: prev.challenges.map(ch => ch.id === challenge.id ? {...ch, completed: true} : ch)
    }));
    
    // Reset
    setSubmissionModal({ isOpen: false, challengeId: null });
    setResearchText("");
    setFeedback(null);
  };

  // --- Render Helpers ---

  const renderBackground = () => {
    const { backgroundImage, bgConfig } = state.theme;
    if (!backgroundImage) return null;

    const style: React.CSSProperties = {
      backgroundImage: `url(${backgroundImage})`,
      backgroundSize: `${bgConfig.scale}%`,
      backgroundPosition: `${bgConfig.posX}% ${bgConfig.posY}%`,
      filter: `blur(${bgConfig.blur}px)`,
      opacity: bgConfig.opacity / 100,
    };

    if (bgConfig.portraitMode) return null; 

    return <div className="fixed inset-0 pointer-events-none z-0 transition-all duration-500" style={style} />;
  };

  const renderReviewModal = () => {
    if (!activeSession) return null;
    const subject = state.subjects.find(s => s.id === activeSession.subjectId);
    const isFixed = activeSession.strategy === 'fixed';

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-md animate-in fade-in duration-300">
        <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col min-h-[400px]">
          <div className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-6">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-white" style={{ backgroundColor: subject?.color || '#ccc' }}>
              {subject?.name}
            </span>
            <h2 className="text-3xl font-bold font-[var(--font-main)]">{activeSession.topic}</h2>
            <div className="w-full h-px bg-gray-200 dark:bg-gray-700 max-w-[100px]"></div>
            <p className="text-gray-500 italic">
              {isFixed ? "Review your material according to the pattern." : "Take a moment to recall..."}
            </p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-900">
             {isFixed ? (
                <button 
                  onClick={() => processReview(3)} 
                  className="w-full p-4 rounded-xl bg-[var(--primary)] text-white font-bold text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-6 h-6"/> Mark as Completed
                </button>
             ) : (
                <div className="grid grid-cols-4 gap-3">
                  <button onClick={() => processReview(1)} className="p-4 rounded-xl bg-red-100 text-red-700 hover:bg-red-200 font-bold transition-colors flex flex-col items-center"><RefreshCw className="w-5 h-5 mb-1"/>Again</button>
                  <button onClick={() => processReview(2)} className="p-4 rounded-xl bg-orange-100 text-orange-700 hover:bg-orange-200 font-bold transition-colors">Hard</button>
                  <button onClick={() => processReview(3)} className="p-4 rounded-xl bg-blue-100 text-blue-700 hover:bg-blue-200 font-bold transition-colors">Good</button>
                  <button onClick={() => processReview(5)} className="p-4 rounded-xl bg-green-100 text-green-700 hover:bg-green-200 font-bold transition-colors flex flex-col items-center"><CheckCircle className="w-5 h-5 mb-1"/>Easy</button>
                </div>
             )}
          </div>
        </div>
      </div>
    );
  };

  // --- Screens ---

  const Dashboard = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-gradient-to-br from-[var(--primary)] to-purple-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-1">Welcome back, {state.user.title} {state.user.name}</h2>
            <div className="flex items-start gap-2 mb-4 opacity-90">
               <Quote className="w-4 h-4 mt-0.5 shrink-0" />
               <p className="text-sm italic">{dailyQuote}</p>
            </div>
            <div className="flex items-center space-x-4">
              <StreakBadge streak={state.user.currentStreak} />
              <div className="flex items-center space-x-1 bg-white/20 px-3 py-1.5 rounded-full">
                <span className="font-bold text-yellow-300">🪙 {state.user.coins}</span>
              </div>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-10 translate-y-10">
            <BrainCircuit size={150} />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-center">
           <XPBar user={state.user} />
           <TrophyCase user={state.user} />
        </div>
      </div>

      <StudyHeatmap history={state.user.history || {}} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
           <h3 className="font-bold text-lg mb-4 flex items-center"><CheckCircle className="w-5 h-5 mr-2 text-[var(--primary)]"/> Due for Review ({dueSessions.length})</h3>
           {dueSessions.length === 0 ? (
             <div className="text-center py-10 opacity-50 flex flex-col items-center">
               <CheckCircle className="w-12 h-12 mb-2 text-green-500"/>
               <p>All caught up! Great job.</p>
             </div>
           ) : (
             <div className="space-y-3">
               {dueSessions.slice(0, 4).map(s => {
                 const sub = state.subjects.find(sub => sub.id === s.subjectId);
                 return (
                   <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sub?.color }}></div>
                        <div>
                          <p className="font-medium text-sm">{s.topic}</p>
                          <p className="text-xs opacity-60">{sub?.name}</p>
                        </div>
                      </div>
                      <button onClick={() => setActiveSession(s)} className="px-3 py-1.5 bg-[var(--primary)] text-white text-xs font-bold rounded-lg shadow-sm hover:opacity-90">Review</button>
                   </div>
                 );
               })}
               {dueSessions.length > 4 && <button onClick={() => setState({...state, activeTab: 'calendar'})} className="w-full py-2 text-sm text-[var(--primary)] font-medium">View all {dueSessions.length} tasks</button>}
             </div>
           )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
           <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg flex items-center"><Lightbulb className="w-5 h-5 mr-2 text-yellow-500"/> Research Topics</h3>
              <div className="flex gap-2">
                 <button onClick={() => setIsAddChallengeOpen(true)} className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded hover:bg-gray-200 flex items-center"><Plus className="w-3 h-3 mr-1"/>Add</button>
                 <button onClick={fetchChallenges} disabled={!isOnline} className="text-xs bg-[var(--primary)] text-white px-2 py-1 rounded hover:opacity-90 disabled:opacity-50">Fetch New</button>
              </div>
           </div>
           <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar">
             {state.challenges.length === 0 && <p className="text-sm opacity-50 text-center py-4">No active challenges. Fetch some!</p>}
             {state.challenges.filter(c => !c.completed).map(c => {
               const daysLeft = Math.ceil((new Date(c.deadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
               const isExpired = daysLeft < 0;

               return (
                 <div key={c.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-xl relative overflow-hidden">
                   <div className="relative z-10">
                     <div className="flex justify-between items-start mb-1">
                       <span className="text-[10px] font-bold uppercase text-[var(--primary)] bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">{c.category}</span>
                       <span className={`text-[10px] font-bold flex items-center ${isExpired ? 'text-red-500' : 'text-gray-500'}`}>
                         <Clock className="w-3 h-3 mr-1"/> {isExpired ? 'Expired' : `${daysLeft}d left`}
                       </span>
                     </div>
                     <p className="text-sm font-medium mb-2">{c.title}</p>
                     <div className="flex justify-between items-center mt-2">
                        <span className="text-xs font-bold text-yellow-500 flex items-center">+{c.reward} 🪙</span>
                        {!isExpired && (
                          <button 
                            onClick={() => {
                                setSubmissionModal({ isOpen: true, challengeId: c.id });
                                setResearchText("");
                                setFeedback(null);
                            }}
                            className="text-xs bg-black text-white dark:bg-white dark:text-black px-3 py-1.5 rounded-lg font-bold"
                          >
                            Submit
                          </button>
                        )}
                     </div>
                   </div>
                 </div>
               );
             })}
           </div>
        </div>
      </div>
    </div>
  );

  const CalendarView = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    for(let i=0; i<firstDay.getDay(); i++) days.push(null);
    for(let i=1; i<=lastDay.getDate(); i++) days.push(new Date(year, month, i));

    const sessionsOnSelected = sessionsForSelectedDate;
    
    // Monthly Stats Calculation
    const sessionsInMonth = state.sessions.filter(s => {
       const d = new Date(s.dueDate);
       return d.getMonth() === month && d.getFullYear() === year;
    });

    const pendingCount = sessionsInMonth.filter(s => s.status === 'pending' || s.status === 'due').length;
    const reviewedCount = sessionsInMonth.filter(s => s.status === 'reviewed').length;

    return (
      <div className="flex flex-col lg:flex-row gap-6 lg:h-full animate-in fade-in zoom-in-95 duration-300">
         <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col">
            {/* Calendar Header */}
            <div className="flex justify-between items-center mb-6">
               <div className="flex flex-col">
                 <h2 className="text-3xl font-bold font-[var(--font-main)] tracking-tight">
                   {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                 </h2>
                 <p className="text-xs opacity-50 font-medium uppercase tracking-widest mt-1 text-[var(--primary)]">Study Schedule</p>
               </div>
               <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700/50 p-1 rounded-xl">
                 <button onClick={() => setSelectedDate(new Date(year, month - 1, 1))} className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded-lg shadow-sm transition-all text-gray-600 dark:text-gray-300">←</button>
                 <button onClick={() => setSelectedDate(new Date())} className="px-4 py-2 text-xs font-bold hover:bg-white dark:hover:bg-gray-600 rounded-lg shadow-sm transition-all">Today</button>
                 <button onClick={() => setSelectedDate(new Date(year, month + 1, 1))} className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded-lg shadow-sm transition-all text-gray-600 dark:text-gray-300">→</button>
               </div>
            </div>
            
            {/* Days Header */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                <div key={d} className="text-center text-xs font-bold opacity-40 uppercase tracking-widest py-2">{d}</div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 flex-1 auto-rows-fr">
              {days.map((d, i) => {
                if (!d) return <div key={`empty-${i}`} className="aspect-square bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-dashed border-gray-100 dark:border-gray-700/50"></div>;
                const daySessions = state.sessions.filter(s => isSameDay(new Date(s.dueDate), d));
                const isSelected = isSameDay(d, selectedDate);
                const isToday = isSameDay(d, new Date());
                
                // Count subjects
                const subjectCounts: Record<string, number> = {};
                daySessions.forEach(s => {
                   subjectCounts[s.subjectId] = (subjectCounts[s.subjectId] || 0) + 1;
                });

                return (
                  <button 
                    key={d.toISOString()} 
                    onClick={() => setSelectedDate(d)}
                    className={`
                      aspect-square rounded-xl relative flex flex-col items-center justify-start pt-2 transition-all group overflow-hidden border
                      ${isSelected 
                        ? 'bg-[var(--primary)] text-white shadow-lg border-[var(--primary)]' 
                        : 'bg-white dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 hover:border-[var(--primary)] hover:shadow-md'
                      }
                      ${isToday && !isSelected ? 'ring-2 ring-[var(--primary)] ring-offset-2 dark:ring-offset-gray-900' : ''}
                    `}
                  >
                    <span className={`text-sm ${isSelected ? 'font-bold' : 'font-medium opacity-80'}`}>{d.getDate()}</span>
                    
                    {/* Session Indicators */}
                    <div className="flex flex-wrap justify-center gap-1 mt-2 max-w-[80%]">
                       {Object.keys(subjectCounts).slice(0, 4).map((subId, idx) => {
                          const sub = state.subjects.find(s => s.id === subId);
                          return (
                            <div key={idx} className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : ''}`} style={{ backgroundColor: !isSelected ? sub?.color : undefined }} />
                          );
                       })}
                       {Object.keys(subjectCounts).length > 4 && <div className="w-1.5 h-1.5 bg-gray-400 rounded-full text-[6px] flex items-center justify-center">+</div>}
                    </div>

                    {/* Hover Preview (Tooltip) */}
                    {daySessions.length > 0 && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-center p-1">
                        <span className="text-xs font-bold text-white leading-tight">
                           {daySessions.length} Task{daySessions.length > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Monthly Stats Footer */}
            <div className="mt-6 pt-4 border-t dark:border-gray-700 flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                     <BarChart3 className="w-4 h-4 text-gray-400"/>
                     <span className="font-bold opacity-70">Monthly Load:</span>
                  </div>
                  <div className="flex gap-3">
                     <span className="text-orange-500 font-medium">{pendingCount} Pending</span>
                     <span className="text-green-500 font-medium">{reviewedCount} Done</span>
                  </div>
                </div>
            </div>
         </div>

         <div className="lg:w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden min-h-[300px]">
            <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center sticky top-0 z-10">
               <div>
                  <h3 className="font-bold">{selectedDate.toLocaleDateString(undefined, {weekday: 'short', month: 'short', day: 'numeric'})}</h3>
                  <p className="text-xs opacity-50">{sessionsOnSelected.length} sessions scheduled</p>
               </div>
               <button 
                 onClick={() => setIsAddModalOpen(true)}
                 className="p-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-opacity shadow-sm"
               >
                 <Plus className="w-4 h-4" />
               </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {sessionsOnSelected.length === 0 && (
                <div className="text-center opacity-50 mt-10">
                  <BookOpen className="w-10 h-10 mx-auto mb-2"/>
                  <p className="text-sm">No study planned.</p>
                  <button onClick={() => setIsAddModalOpen(true)} className="text-[var(--primary)] text-sm font-bold mt-2 hover:underline">Add Session</button>
                </div>
              )}
              {sessionsOnSelected.map(s => {
                 const sub = state.subjects.find(sub => sub.id === s.subjectId);
                 return (
                   <div key={s.id} className={`p-3 rounded-xl border-l-4 bg-gray-50 dark:bg-gray-700/30 group relative ${s.status === 'reviewed' ? 'opacity-50' : ''}`} style={{ borderLeftColor: sub?.color }}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className={`font-medium text-sm ${s.status === 'reviewed' ? 'line-through' : ''}`}>{s.topic}</p>
                          <p className="text-xs uppercase tracking-wider opacity-60 mt-1">{sub?.name} • {s.strategy}</p>
                        </div>
                        {s.status !== 'reviewed' && (
                          <button onClick={() => setActiveSession(s)} className="p-1.5 bg-white dark:bg-black rounded-lg shadow-sm text-[var(--primary)] opacity-0 group-hover:opacity-100 transition-opacity">
                            <BrainCircuit className="w-4 h-4"/>
                          </button>
                        )}
                      </div>
                      <button 
                         onClick={(e) => { e.stopPropagation(); setState(prev => ({...prev, sessions: prev.sessions.filter(x => x.id !== s.id)}))}}
                         className="absolute bottom-2 right-2 text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-600"
                      >
                        <Trash2 className="w-3 h-3"/>
                      </button>
                   </div>
                 );
              })}
            </div>
         </div>
      </div>
    );
  };

  const Marketplace = () => {
    const defaultRewards: Reward[] = [
      { id: 'r1', name: "Watch a Movie", cost: 50, icon: "🎬" },
      { id: 'r2', name: "Cheat Day (No Study)", cost: 100, icon: "🍕" },
      { id: 'r3', name: "New Game", cost: 500, icon: "🎮" },
      { id: 'r4', name: "Coffee Treat", cost: 20, icon: "☕" },
    ];

    const allRewards = [...defaultRewards, ...(state.user.customRewards || [])];

    return (
      <div className="animate-in fade-in slide-in-from-right duration-300">
         <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-8 rounded-3xl mb-8 shadow-lg flex justify-between items-center relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-3xl font-bold mb-2">Marketplace</h2>
              <p className="opacity-90">Redeem your hard-earned coins for real-life rewards.</p>
            </div>
            <div className="relative z-10 bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/30">
               <span className="text-4xl font-bold text-white drop-shadow-md">{state.user.coins} 🪙</span>
            </div>
            <ShoppingBag className="absolute -bottom-4 -left-4 w-40 h-40 opacity-20 rotate-12" />
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {allRewards.map(r => (
               <button 
                 key={r.id}
                 disabled={state.user.coins < r.cost}
                 onClick={() => setState(prev => ({...prev, user: {...prev.user, coins: prev.user.coins - r.cost}}))}
                 className={`
                   bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700
                   flex flex-col items-center text-center transition-all duration-300 relative group
                   ${state.user.coins < r.cost ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:-translate-y-1 hover:shadow-md'}
                 `}
               >
                 <div className="text-4xl mb-3">{r.icon}</div>
                 <h3 className="font-bold mb-1">{r.name}</h3>
                 <span className="text-[var(--primary)] font-bold">{r.cost} Coins</span>
               </button>
            ))}
            <button 
               onClick={() => setIsAddRewardModalOpen(true)}
               className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl flex flex-col items-center justify-center p-6 text-gray-400 hover:text-gray-500 hover:border-gray-400 transition-colors cursor-pointer"
            >
               <Plus className="w-8 h-8 mb-2"/>
               <span className="text-sm font-medium">Create Custom Reward</span>
            </button>
         </div>
      </div>
    );
  };

  const SupportPage = () => {
    const [copied, setCopied] = useState<string | null>(null);

    const handleCopy = (text: string, id: string) => {
      navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    };

    return (
       <div className="max-w-2xl mx-auto py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
         <div className="text-center mb-10">
           <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-500">
             <Coffee className="w-10 h-10" />
           </div>
           <h2 className="text-3xl font-bold mb-2">Buy me a Coffee</h2>
           <p className="opacity-70 max-w-md mx-auto">
             If you enjoy Memoria and want to support the developer, consider buying me a coffee. Your support helps keep the updates coming!
           </p>
         </div>

         <div className="space-y-4">
           {/* InstaPay */}
           <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-6 h-6"/>
                </div>
                <div>
                   <h3 className="font-bold">InstaPay</h3>
                   <p className="text-sm opacity-60 font-mono select-all">amr.mo4065@instapay</p>
                </div>
              </div>
              <button 
                onClick={() => handleCopy('amr.mo4065@instapay', 'instapay')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors relative"
                title="Copy InstaPay ID"
              >
                {copied === 'instapay' ? <CheckCircle className="w-5 h-5 text-green-500"/> : <Copy className="w-5 h-5 text-gray-400"/>}
              </button>
           </div>

           {/* Vodafone Cash */}
           <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
                  <Smartphone className="w-6 h-6"/>
                </div>
                <div>
                   <h3 className="font-bold">Vodafone Cash</h3>
                   <p className="text-sm opacity-60 font-mono select-all">01040675265</p>
                </div>
              </div>
              <button 
                onClick={() => handleCopy('01040675265', 'vodafone')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Copy Wallet Number"
              >
                {copied === 'vodafone' ? <CheckCircle className="w-5 h-5 text-green-500"/> : <Copy className="w-5 h-5 text-gray-400"/>}
              </button>
           </div>
         </div>
         
         <div className="mt-10 text-center opacity-40 text-sm">
           Made with <Heart className="w-3 h-3 inline text-red-500 fill-current"/> by Amr
         </div>
       </div>
    );
  };

  // --- Layout ---

  return (
    <div className={`min-h-screen font-sans text-gray-900 dark:text-gray-100 transition-colors duration-500 bg-gray-50 dark:bg-gray-900 overflow-hidden flex`}>
      
      {renderBackground()}
      {renderReviewModal()}

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <nav className={`
        fixed inset-y-0 left-0 z-50 h-full w-64 md:relative flex flex-col transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0 md:shadow-none'}
        ${state.theme.sidebarStyle === 'glass' ? 'bg-white/80 dark:bg-black/50 backdrop-blur-xl border-r border-white/20' : ''}
        ${state.theme.sidebarStyle === 'solid' ? 'bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800' : ''}
        ${state.theme.sidebarStyle === 'minimal' ? 'bg-white/95 dark:bg-gray-900/95 md:bg-transparent' : ''}
        overflow-hidden
        pt-[env(safe-area-inset-top)] /* Native safe area */
      `}>
        {state.theme.bgConfig.portraitMode && state.theme.backgroundImage && (
          <div 
             className="absolute inset-0 z-0 pointer-events-none"
             style={{
               backgroundImage: `url(${state.theme.backgroundImage})`,
               backgroundSize: `${state.theme.bgConfig.scale}%`,
               backgroundPosition: `${state.theme.bgConfig.posX}% ${state.theme.bgConfig.posY}%`,
               filter: `blur(${state.theme.bgConfig.blur}px)`,
               opacity: state.theme.bgConfig.opacity / 100,
             }}
          />
        )}
        
        <div className="relative z-10 flex flex-col h-full">
           <div className={`p-6 flex items-center justify-between md:justify-start space-x-3 ${state.theme.bgConfig.portraitMode && state.theme.backgroundImage ? 'bg-black/40 backdrop-blur-sm text-white' : ''}`}>
              <div className="flex items-center space-x-3">
                 <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center text-white font-bold text-xl shadow-lg">M</div>
                 <span className="font-bold text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-purple-500">Memoria</span>
              </div>
              <button className="md:hidden" onClick={() => setIsSidebarOpen(false)}><X className="w-6 h-6"/></button>
           </div>

           <div className="flex-1 py-6 flex flex-col gap-2 px-3">
             {[
               { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
               { id: 'calendar', icon: CalendarIcon, label: 'Schedule' },
               { id: 'market', icon: ShoppingBag, label: 'Market' },
               { id: 'settings', icon: SettingsIcon, label: 'Settings' },
               { id: 'support', icon: Coffee, label: 'Support' },
             ].map(item => (
               <button
                 key={item.id}
                 onClick={() => {
                   setState({...state, activeTab: item.id as any});
                   setIsSidebarOpen(false);
                 }}
                 className={`
                   flex items-center p-3 rounded-xl transition-all duration-300 group
                   ${state.activeTab === item.id 
                     ? 'bg-[var(--primary)] text-white shadow-md' 
                     : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400'}
                   ${state.theme.bgConfig.portraitMode && state.theme.backgroundImage ? 'backdrop-blur-sm bg-white/10 text-white hover:bg-white/20' : ''}
                 `}
               >
                 <item.icon className={`w-5 h-5 mr-3 transition-transform ${state.activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                 <span className="font-medium">{item.label}</span>
               </button>
             ))}
             
             <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700/50">
               <button
                 onClick={() => setIsInstallModalOpen(true)}
                 className={`
                   w-full flex items-center p-3 rounded-xl transition-all duration-300 group
                   hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400
                   ${state.theme.bgConfig.portraitMode && state.theme.backgroundImage ? 'backdrop-blur-sm bg-white/10 text-white hover:bg-white/20' : ''}
                 `}
               >
                 <Download className="w-5 h-5 mr-3 group-hover:animate-bounce" />
                 <span className="font-medium">Install App</span>
               </button>
             </div>
           </div>
           
           <div className="p-4">
              {/* Online/Offline Status */}
              <div className={`mb-3 flex items-center justify-center py-1.5 rounded-lg text-xs font-bold ${isOnline ? 'text-green-600 bg-green-50 dark:bg-green-900/30' : 'text-red-600 bg-red-50 dark:bg-red-900/30'}`}>
                 {isOnline ? <><Wifi className="w-3 h-3 mr-1.5"/> Online</> : <><WifiOff className="w-3 h-3 mr-1.5"/> Offline Mode</>}
              </div>

              <div className={`p-4 rounded-xl ${state.theme.bgConfig.portraitMode && state.theme.backgroundImage ? 'bg-black/60 backdrop-blur-md text-white' : 'bg-gray-100 dark:bg-gray-800'}`}>
                 <div className="flex items-center space-x-3 mb-2">
                    <div className="text-2xl">{state.user.avatar}</div>
                    <div className="overflow-hidden">
                       <p className="font-bold text-sm truncate">{state.user.name}</p>
                       <p className="text-xs opacity-70 truncate">{state.user.title}</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </nav>

      <main className="flex-1 h-screen overflow-y-auto relative z-10 no-scrollbar p-4 md:p-8 pt-[env(safe-area-inset-top)] md:pt-8">
         <div className="max-w-7xl mx-auto h-full flex flex-col">
            <div className="md:hidden flex justify-between items-center mb-6 pt-2">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700"
              >
                <Menu className="w-6 h-6"/>
              </button>
              <h1 className="text-xl font-bold capitalize">{state.activeTab}</h1>
              <div className="text-2xl">{state.user.avatar}</div>
            </div>

            {state.activeTab === 'dashboard' && <Dashboard />}
            {state.activeTab === 'calendar' && <CalendarView />}
            {state.activeTab === 'market' && <Marketplace />}
            {state.activeTab === 'settings' && <Settings theme={state.theme} setTheme={(t) => setState({...state, theme: t})} user={state.user} setUser={(u) => setState({...state, user: u})} />}
            {state.activeTab === 'support' && <SupportPage />}
         </div>
      </main>

      {/* Modals */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Schedule Session">
         <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            addSession(
              formData.get('subject') as string,
              formData.get('topic') as string,
              formData.get('strategy') as 'smart' | 'fixed',
              formData.get('startDate') as string
            );
         }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Subject</label>
              <div className="flex gap-2">
                 <select name="subject" className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-900 dark:border-gray-700">
                   {state.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                 </select>
                 <button type="button" onClick={() => setIsAddSubjectModalOpen(true)} className="px-3 bg-gray-200 dark:bg-gray-700 rounded-lg hover:opacity-80" title="Add New Subject"><Plus className="w-5 h-5" /></button>
              </div>
            </div>
            <div>
               <label className="block text-sm font-medium mb-1">Start Date</label>
               <input type="date" name="startDate" defaultValue={selectedDate.toISOString().split('T')[0]} required className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-900 dark:border-gray-700" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Topic</label>
              <input name="topic" required placeholder="e.g. Cranial Nerves" className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-900 dark:border-gray-700" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Strategy</label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                   <input type="radio" name="strategy" value="smart" defaultChecked />
                   <div><span className="block text-sm font-bold">Smart (SRS)</span><span className="block text-xs opacity-60">Adapts to performance</span></div>
                </label>
                <label className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                   <input type="radio" name="strategy" value="fixed" />
                   <div><span className="block text-sm font-bold">Fixed</span><span className="block text-xs opacity-60">1, 3, 7, 14 days</span></div>
                </label>
              </div>
            </div>
            <button type="submit" className="w-full py-3 bg-[var(--primary)] text-white font-bold rounded-lg mt-4">Add to Schedule</button>
         </form>
      </Modal>

      <Modal isOpen={isAddSubjectModalOpen} onClose={() => setIsAddSubjectModalOpen(false)} title="Add New Subject">
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          addSubject(formData.get('name') as string, formData.get('color') as string);
        }} className="space-y-4">
           <div><label className="block text-sm font-medium mb-1">Subject Name</label><input name="name" required placeholder="e.g. Histology" className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-900 dark:border-gray-700" /></div>
           <div><label className="block text-sm font-medium mb-1">Color Tag</label><div className="flex items-center gap-3"><input type="color" name="color" defaultValue="#3b82f6" className="w-12 h-12 p-0 border-0 rounded-lg overflow-hidden cursor-pointer" /><span className="text-sm opacity-60">Pick a color for the calendar dots.</span></div></div>
           <button type="submit" className="w-full py-3 bg-[var(--primary)] text-white font-bold rounded-lg mt-2">Create Subject</button>
        </form>
      </Modal>

      <Modal isOpen={isAddChallengeOpen} onClose={() => setIsAddChallengeOpen(false)} title="New Research Topic">
         <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            addChallenge(formData.get('category') as string, formData.get('title') as string, 20);
         }} className="space-y-4">
            <div>
               <label className="block text-sm font-medium mb-1">Category</label>
               <select name="category" className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-900 dark:border-gray-700">
                  <option value="Medical">Medical</option><option value="General">General</option><option value="Physics">Physics</option><option value="History">History</option><option value="Custom">Custom</option>
               </select>
            </div>
            <div><label className="block text-sm font-medium mb-1">Topic Title</label><input name="title" required placeholder="e.g. Molecular Biology" className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-900 dark:border-gray-700" /></div>
            <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg text-sm text-blue-800 dark:text-blue-200"><Clock className="w-4 h-4 inline mr-1"/> Deadline will be set to 7 days from now.</div>
            <button type="submit" className="w-full py-3 bg-[var(--primary)] text-white font-bold rounded-lg mt-2">Create Topic</button>
         </form>
      </Modal>

      <Modal isOpen={isAddRewardModalOpen} onClose={() => setIsAddRewardModalOpen(false)} title="Create Custom Reward">
         <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            addCustomReward(
              formData.get('name') as string,
              Number(formData.get('cost')),
              formData.get('icon') as string
            );
         }} className="space-y-4">
            <div><label className="block text-sm font-medium mb-1">Reward Name</label><input name="name" required placeholder="e.g. 1 Hour Gaming" className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-900 dark:border-gray-700" /></div>
            <div><label className="block text-sm font-medium mb-1">Cost (Coins)</label><input name="cost" type="number" min="1" required placeholder="50" className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-900 dark:border-gray-700" /></div>
            <div>
               <label className="block text-sm font-medium mb-1">Icon</label>
               <div className="flex gap-2 overflow-x-auto py-2 no-scrollbar">
                  {['🎮','⚽','🍔','🍿','🎧','🏖️','🎁','💤','📱'].map(emoji => (
                     <label key={emoji} className="cursor-pointer">
                        <input type="radio" name="icon" value={emoji} required className="peer sr-only"/>
                        <div className="text-2xl p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 peer-checked:bg-[var(--primary)] peer-checked:text-white transition-colors">{emoji}</div>
                     </label>
                  ))}
               </div>
            </div>
            <button type="submit" className="w-full py-3 bg-[var(--primary)] text-white font-bold rounded-lg mt-2">Save Reward</button>
         </form>
      </Modal>

      {/* Research Submission Modal */}
      <Modal isOpen={submissionModal.isOpen} onClose={() => setSubmissionModal({isOpen: false, challengeId: null})} title="Submit Research">
         {!feedback ? (
           <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex items-start space-x-3">
                 <BrainCircuit className="w-6 h-6 text-[var(--primary)] shrink-0 mt-1" />
                 <div className="text-sm">
                    <p className="font-bold mb-1">AI Professor {isOnline ? '' : '(Offline Mode)'}</p>
                    <p className="opacity-80">
                      {isOnline 
                        ? "Paste your research notes below. I will analyze your depth of understanding and provide feedback." 
                        : "You are offline. I will save your submission and simulate a review, but I cannot provide deep AI analysis right now."}
                    </p>
                 </div>
              </div>
              <textarea 
                value={researchText}
                onChange={(e) => setResearchText(e.target.value)}
                placeholder="Type your notes here... (e.g. The mechanism involves...)"
                className="w-full h-40 p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-[var(--primary)] outline-none resize-none"
              />
              <button 
                onClick={handleSubmitResearch}
                disabled={!researchText.trim() || isAnalyzing}
                className="w-full py-3 bg-[var(--primary)] text-white font-bold rounded-lg flex justify-center items-center gap-2 hover:opacity-90 disabled:opacity-50"
              >
                {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5"/>}
                {isAnalyzing ? "Analyzing..." : "Submit for Review"}
              </button>
           </div>
         ) : (
           <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="text-center">
                 <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3 text-green-600 dark:text-green-400">
                    <Sparkles className="w-8 h-8" />
                 </div>
                 <h3 className="text-xl font-bold">Analysis Complete!</h3>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border-l-4 border-[var(--primary)] text-sm leading-relaxed">
                 <p className="font-mono text-xs opacity-50 uppercase mb-2">Professor's Feedback:</p>
                 {feedback}
              </div>

              <button 
                onClick={confirmResearchReward}
                className="w-full py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 shadow-lg shadow-green-500/20"
              >
                Claim Reward (+XP & Coins)
              </button>
           </div>
         )}
      </Modal>

      {/* Install Guide Modal */}
      <Modal isOpen={isInstallModalOpen} onClose={() => setIsInstallModalOpen(false)} title="Install App">
        <div className="space-y-6">
           <p className="text-sm opacity-80 leading-relaxed">
             Memoria is a Progressive Web App (PWA). You don't need the Play Store to install it. Follow these steps to add it to your home screen for a full-screen, offline-capable experience.
           </p>
           
           <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl">
              <h4 className="font-bold flex items-center mb-2"><Smartphone className="w-4 h-4 mr-2"/> Android (Chrome)</h4>
              <ol className="list-decimal list-inside text-sm space-y-2 opacity-80">
                <li>Tap the <strong>three dots</strong> (menu) in the top right corner.</li>
                <li>Tap <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong>.</li>
                <li>Confirm by tapping "Add" or "Install".</li>
              </ol>
           </div>

           <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl">
              <h4 className="font-bold flex items-center mb-2"><Smartphone className="w-4 h-4 mr-2"/> iOS (Safari)</h4>
              <ol className="list-decimal list-inside text-sm space-y-2 opacity-80">
                <li>Tap the <strong>Share</strong> button (box with arrow up) at the bottom.</li>
                <li>Scroll down and tap <strong>"Add to Home Screen"</strong>.</li>
                <li>Tap "Add" in the top right corner.</li>
              </ol>
           </div>
           
           <button onClick={() => setIsInstallModalOpen(false)} className="w-full py-3 bg-gray-200 dark:bg-gray-700 font-bold rounded-lg">Got it</button>
        </div>
      </Modal>

    </div>
  );
}