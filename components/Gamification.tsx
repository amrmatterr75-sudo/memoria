import React from 'react';
import { UserProfile } from '../types';
import { Trophy, Flame, Star, Crown, Shield, Award, Medal } from 'lucide-react';
import { TITLES } from '../constants';

interface XPBarProps {
  user: UserProfile;
}

export const XPBar: React.FC<XPBarProps> = ({ user }) => {
  // Find next title threshold
  const currentTitleIndex = TITLES.findIndex(t => t.title === user.title);
  const nextTitle = TITLES[currentTitleIndex + 1];
  const prevTitleXP = TITLES[currentTitleIndex].xp;
  
  let progress = 100;
  if (nextTitle) {
    const totalRange = nextTitle.xp - prevTitleXP;
    const userProgress = user.xp - prevTitleXP;
    progress = Math.min(100, Math.max(0, (userProgress / totalRange) * 100));
  }

  return (
    <div className="w-full mb-4">
      <div className="flex justify-between items-end mb-1">
        <span className="text-sm font-bold opacity-80">{user.title}</span>
        <span className="text-xs font-mono opacity-60">{user.xp} / {nextTitle ? nextTitle.xp : 'MAX'} XP</span>
      </div>
      <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
        <div 
          className="h-full bg-gradient-to-r from-[var(--primary)] to-purple-400 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export const StreakBadge: React.FC<{ streak: number }> = ({ streak }) => {
  return (
    <div className="flex items-center space-x-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 px-3 py-1.5 rounded-full border border-orange-200 dark:border-orange-800">
      <Flame className="w-5 h-5 fill-current animate-pulse" />
      <span className="font-bold">{streak} Day Streak</span>
    </div>
  );
};

export const TrophyCase: React.FC<{ user: UserProfile }> = ({ user }) => {
  const milestones = [
    { name: "Novice", icon: Shield, unlocked: user.xp > 100, color: "text-gray-400", label: "100 XP" },
    { name: "Scholar", icon: Star, unlocked: user.xp > 1000, color: "text-blue-400", label: "1K XP" },
    { name: "Master", icon: Crown, unlocked: user.xp > 5000, color: "text-yellow-400", label: "5K XP" },
    { name: "Legend", icon: Trophy, unlocked: user.xp > 10000, color: "text-purple-400", label: "10K XP" },
    { name: "Dedicated", icon: Flame, unlocked: user.longestStreak >= 7, color: "text-orange-500", label: "7 Day Streak" },
  ];

  const trophies = [
    { name: "Bronze Cup", reviews: 10, color: "text-amber-700" }, // Bronze
    { name: "Silver Cup", reviews: 50, color: "text-slate-400" }, // Silver
    { name: "Gold Cup", reviews: 100, color: "text-yellow-500" }, // Gold
  ];

  return (
    <div className="mt-4 space-y-3">
       {/* Milestones */}
      <div className="grid grid-cols-5 gap-2 bg-white/50 dark:bg-black/20 p-4 rounded-xl backdrop-blur-sm border border-black/5 dark:border-white/5">
        {milestones.map((b, i) => (
          <div key={i} className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all ${b.unlocked ? 'opacity-100 scale-100' : 'opacity-30 grayscale scale-90'}`} title={b.label}>
            <b.icon className={`w-8 h-8 ${b.color} mb-1 drop-shadow-sm`} />
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-70 text-center leading-tight">{b.name}</span>
          </div>
        ))}
      </div>

      {/* Review Cups */}
      <div className="flex justify-around items-center bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 p-3 rounded-xl border border-gray-200 dark:border-gray-600">
         {trophies.map((t, i) => {
           const unlocked = (user.totalReviews || 0) >= t.reviews;
           return (
             <div key={i} className={`flex flex-col items-center ${unlocked ? 'opacity-100' : 'opacity-30 grayscale'}`}>
                <div className={`relative ${unlocked ? 'animate-bounce-slow' : ''}`}>
                   <Award className={`w-10 h-10 ${t.color} fill-current drop-shadow-md`} />
                   {unlocked && <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>}
                </div>
                <span className="text-[10px] font-bold mt-1">{t.reviews} Reviews</span>
             </div>
           );
         })}
      </div>
    </div>
  );
};

export const StudyHeatmap: React.FC<{ history: UserProfile['history'] }> = ({ history }) => {
  // Generate last 60 days
  const days = Array.from({ length: 60 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (59 - i));
      return d.toISOString().split('T')[0];
  });

  const getIntensity = (count: number) => {
    if (!count) return 'bg-gray-100 dark:bg-gray-800';
    if (count < 3) return 'bg-green-200 dark:bg-green-900/40';
    if (count < 6) return 'bg-green-300 dark:bg-green-700/60';
    if (count < 10) return 'bg-green-400 dark:bg-green-600/80';
    return 'bg-green-500 dark:bg-green-500';
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mt-6">
       <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
         <div className="w-2 h-2 rounded-full bg-green-500"></div>
         Study Activity (Last 60 Days)
       </h3>
       <div className="flex flex-wrap gap-1.5">
          {days.map(date => (
            <div 
              key={date}
              title={`${date}: ${history[date] || 0} reviews`}
              className={`w-3 h-3 md:w-4 md:h-4 rounded-sm transition-colors ${getIntensity(history[date] || 0)}`}
            />
          ))}
       </div>
    </div>
  );
};