/**
 * Muscle groups list for exercise categorization
 * Matches the server-side muscle groups from trainerly-server constants
 */

export const MUSCLE_GROUPS = [
  'חזה עליון',      // Upper chest
  'חזה תחתון',      // Lower chest
  'חזה אמצעי',      // Middle chest
  'גב עליון',       // Upper back
  'גב תחתון',       // Lower back
  'גב אמצעי',       // Middle back
  'גב רחב',         // Latissimus dorsi
  'ירך קדמי',       // Quadriceps
  'ירך אחורי',      // Hamstrings
  'ישבן',           // Glutes
  'שוק',            // Calves
  'כתף קדמית',      // Front deltoid
  'כתף צדדית',      // Side deltoid
  'כתף אחורית',     // Rear deltoid
  'טרפז',           // Trapezius
  'יד קדמית',       // Biceps
  'יד אחורית',      // Triceps
  'אמה',            // Forearms
  'בטן עליונה',     // Upper abs
  'בטן תחתונה',     // Lower abs
  'בטן צדדית',      // Side abs (obliques)
  'ליבה',           // Core
  'ירך פנימי',      // Inner thigh
  'ירך חיצוני',     // Outer thigh
  'גוף מלא'         // Full body
] as const;

export type MuscleGroup = typeof MUSCLE_GROUPS[number];

// Helper function to check if a string is a valid muscle group
export const isValidMuscleGroup = (value: string): value is MuscleGroup => {
  return MUSCLE_GROUPS.includes(value as MuscleGroup);
};
