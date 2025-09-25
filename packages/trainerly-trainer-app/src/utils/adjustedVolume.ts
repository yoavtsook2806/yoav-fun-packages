import { ExerciseHistoryEntry, SetData } from '../types';

/**
 * Adjusted Volume Formula - A comprehensive metric for training performance
 * 
 * The formula considers:
 * 1. Volume Load (Weight × Reps × Sets)
 * 2. Rest Efficiency (shorter rest = higher intensity)
 * 3. Consistency Factor (completing all planned sets)
 * 4. Progressive Overload Bonus (improvement over first set)
 * 
 * Formula: AV = VL × RE × CF × POB
 * 
 * Where:
 * - VL = Volume Load = Σ(weight × reps) for all sets
 * - RE = Rest Efficiency = 1 + (180 - rest_time) / 300 (capped at 0.5-1.5)
 * - CF = Consistency Factor = completed_sets / total_sets
 * - POB = Progressive Overload Bonus = 1 + improvement_factor
 */

export interface AdjustedVolumeData {
  date: string;
  adjustedVolume: number;
  volumeLoad: number;
  restEfficiency: number;
  consistencyFactor: number;
  progressiveOverloadBonus: number;
  completedSets: number;
  totalSets: number;
}

/**
 * Calculate Volume Load for all sets
 * Smart handling: if weight is 0, use reps as base load (bodyweight exercises)
 */
export const calculateVolumeLoad = (setsData: SetData[]): number => {
  return setsData.reduce((total, set) => {
    const weight = set.weight || 0;
    const reps = set.repeats || 0;
    
    // Smart handling: if weight is 0 but we have reps, treat as bodyweight exercise
    if (weight === 0 && reps > 0) {
      // Use reps as base load for bodyweight exercises (e.g., push-ups, pull-ups)
      return total + reps * 2; // Multiply by 2 to give bodyweight exercises meaningful value
    }
    
    return total + (weight * reps);
  }, 0);
};

/**
 * Calculate Rest Efficiency Factor
 * Optimal rest time is around 90-120 seconds
 * Formula: 1 + (180 - rest_time) / 300
 * - 60s rest = 1.4 efficiency (high intensity)
 * - 120s rest = 1.2 efficiency (optimal)
 * - 180s rest = 1.0 efficiency (baseline)
 * - 300s rest = 0.6 efficiency (low intensity)
 */
export const calculateRestEfficiency = (restTime: number): number => {
  const efficiency = 1 + (180 - restTime) / 300;
  // Cap between 0.5 and 1.5 for reasonable bounds
  return Math.max(0.5, Math.min(1.5, efficiency));
};

/**
 * Calculate Consistency Factor
 * Rewards completing all planned sets
 */
export const calculateConsistencyFactor = (completedSets: number, totalSets: number): number => {
  return completedSets / totalSets;
};

/**
 * Calculate Progressive Overload Bonus
 * Rewards improvement throughout the workout
 * Compares later sets to the first set
 */
export const calculateProgressiveOverloadBonus = (setsData: SetData[]): number => {
  if (setsData.length <= 1) return 1.0;
  
  const firstSet = setsData[0];
  const firstSetLoad = (firstSet.weight || 0) * (firstSet.repeats || 0);
  
  if (firstSetLoad === 0) return 1.0;
  
  // Calculate average improvement over first set
  let totalImprovement = 0;
  let validSets = 0;
  
  for (let i = 1; i < setsData.length; i++) {
    const currentSet = setsData[i];
    const currentLoad = (currentSet.weight || 0) * (currentSet.repeats || 0);
    
    if (currentLoad > 0) {
      const improvement = (currentLoad - firstSetLoad) / firstSetLoad;
      totalImprovement += improvement;
      validSets++;
    }
  }
  
  if (validSets === 0) return 1.0;
  
  const averageImprovement = totalImprovement / validSets;
  // Convert to bonus factor (cap at 50% bonus)
  return 1 + Math.max(0, Math.min(0.5, averageImprovement));
};

/**
 * Calculate Adjusted Volume for a single workout entry
 */
export const calculateAdjustedVolume = (entry: ExerciseHistoryEntry): AdjustedVolumeData => {
  const setsData = entry.setsData || [];
  
  // Calculate components
  const volumeLoad = calculateVolumeLoad(setsData);
  const restEfficiency = calculateRestEfficiency(entry.restTime);
  const consistencyFactor = calculateConsistencyFactor(entry.completedSets, entry.totalSets);
  const progressiveOverloadBonus = calculateProgressiveOverloadBonus(setsData);
  
  // Calculate final Adjusted Volume
  const adjustedVolume = volumeLoad * restEfficiency * consistencyFactor * progressiveOverloadBonus;
  
  return {
    date: entry.date,
    adjustedVolume: Math.round(adjustedVolume),
    volumeLoad: Math.round(volumeLoad),
    restEfficiency: Math.round(restEfficiency * 100) / 100,
    consistencyFactor: Math.round(consistencyFactor * 100) / 100,
    progressiveOverloadBonus: Math.round(progressiveOverloadBonus * 100) / 100,
    completedSets: entry.completedSets,
    totalSets: entry.totalSets,
  };
};

/**
 * Calculate Adjusted Volume for all entries of an exercise
 */
export const calculateExerciseAdjustedVolumeHistory = (exerciseHistory: ExerciseHistoryEntry[]): AdjustedVolumeData[] => {
  return exerciseHistory
    .filter(entry => entry.setsData && entry.setsData.length > 0)
    .map(calculateAdjustedVolume)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

/**
 * Get formula explanation text
 */
export const getAdjustedVolumeFormulaExplanation = (): string => {
  return `
**נוסחת הנפח המתואם**

נפח מתואם = עומס נפח × יעילות מנוחה × גורם עקביות × בונוס עומס מתקדם

**רכיבים:**

🏋️ **עומס נפח**: סך משקל × חזרות בכל הסטים
- משקל וחזרות גבוהים יותר = נפח גבוה יותר

⏱️ **יעילות מנוחה** (0.5x - 1.5x):
- 60 שניות מנוחה = 1.4x (עצימות גבוהה)
- 120 שניות מנוחה = 1.2x (אופטימלי)
- 180 שניות מנוחה = 1.0x (בסיסי)
- 300+ שניות מנוחה = 0.6x (עצימות נמוכה)

✅ **גורם עקביות**:
- סטים שהושלמו ÷ סך סטים מתוכננים
- מתגמל השלמת האימון המלא

📈 **בונוס עומס מתקדם** (1.0x - 1.5x):
- משווה סטים מאוחרים לסט הראשון שלך
- מתגמל שמירה או שיפור ביצועים

**למה הנוסחה הזו?**
המדד הזה לוכד לא רק כמה הרמת, אלא כמה יעיל ועקבי היה האימון. הוא מתגמל גם נפח וגם עצימות תוך הענשה של זמני מנוחה מוגזמים ואימונים לא מושלמים.
  `.trim();
};
