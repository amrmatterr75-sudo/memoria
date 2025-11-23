import { StudySession } from "../types";

// SM-2 Algorithm Implementation (Simplified)
export const calculateNextReview = (
  session: StudySession,
  quality: 0 | 1 | 2 | 3 | 4 | 5
): Partial<StudySession> => {
  let { interval, repetitions, easeFactor, strategy, fixedPattern } = session;

  if (strategy === 'fixed' && fixedPattern) {
    // Fixed pattern logic
    let nextInterval = 1;
    if (quality >= 3) { // Good or Easy
       const currentStepIndex = fixedPattern.indexOf(interval);
       if (currentStepIndex !== -1 && currentStepIndex < fixedPattern.length - 1) {
         nextInterval = fixedPattern[currentStepIndex + 1];
       } else if (currentStepIndex === fixedPattern.length - 1) {
         nextInterval = fixedPattern[fixedPattern.length - 1] * 2; // Double after end of pattern
       } else {
         nextInterval = fixedPattern[0];
       }
    } else {
      nextInterval = fixedPattern[0]; // Reset if failed
    }
    
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + nextInterval);
    
    return {
      interval: nextInterval,
      dueDate: nextDate.toISOString(),
      status: 'reviewed',
      lastReviewed: new Date().toISOString(),
    };
  }

  // Standard SM-2 Smart Logic
  if (quality >= 3) {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  } else {
    repetitions = 0;
    interval = 1;
  }

  if (easeFactor < 1.3) easeFactor = 1.3;

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + interval);

  return {
    interval,
    repetitions,
    easeFactor,
    dueDate: nextDate.toISOString(),
    status: 'reviewed',
    lastReviewed: new Date().toISOString(),
  };
};

export const getDaysDifference = (date1: string, date2: string) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  d1.setHours(0,0,0,0);
  d2.setHours(0,0,0,0);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
};

export const isSameDay = (d1: Date, d2: Date) => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};
