/**
 * Comprehensive list of 30 gym exercises
 * Covers all body parts with variety for both men and women preferences
 * All names and descriptions in Hebrew, with short YouTube links (max 40 seconds)
 */

// Comprehensive muscle groups list (25 groups) - Hebrew terminology (short)
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

export interface ExerciseTemplate {
  name: string;        // Hebrew name
  note: string;        // Hebrew instructions/notes
  link: string;        // YouTube video URL (max 40 seconds)
  muscleGroup: string; // Main muscle group
}

export const GYM_EXERCISES: ExerciseTemplate[] = [
  // CHEST EXERCISES
  {
    name: 'לחיצת חזה במוט',
    note: 'שכיבה על הספסל, אחיזה רחבה במוט, הורדה לחזה ודחיפה מבוקרת כלפי מעלה',
    link: 'https://www.youtube.com/watch?v=rT7DgCr-3pg',
    muscleGroup: 'חזה אמצעי'
  },
  {
    name: 'לחיצת חזה בשיפוע',
    note: 'ספסל בזווית 30-45 מעלות, לחיצה עם משקולות יד או מוט לחיזוק החזה העליון',
    link: 'https://www.youtube.com/watch?v=DbFgADa2PL8',
    muscleGroup: 'חזה עליון'
  },
  {
    name: 'שכיבות סמיכה',
    note: 'מנח פלג גוף עליון, ידיים תחת הכתפיים, הורדה ועלייה מבוקרת',
    link: 'https://www.youtube.com/watch?v=IODxDxX7oi4',
    muscleGroup: 'חזה אמצעי'
  },
  {
    name: 'פרפר במשקולות יד',
    note: 'שכיבה על ספסל, זרועות מעט כפופות, הורדה בקשת רחבה ועלייה',
    link: 'https://www.youtube.com/watch?v=eozdVDA78K0',
    muscleGroup: 'חזה אמצעי'
  },

  // BACK EXERCISES
  {
    name: 'משיכות לסנטר',
    note: 'תליה על מוט, משיכה כלפי מעלה עד שהסנטר מגיע למוט',
    link: 'https://www.youtube.com/watch?v=eGo4IYlbE5g',
    muscleGroup: 'גב רחב'
  },
  {
    name: 'משיכת מוט לבטן',
    note: 'כיפוף קדימה, אחיזה במוט, משיכה לכיוון הבטן התחתונה',
    link: 'https://www.youtube.com/watch?v=FWJR5Ve8bnQ',
    muscleGroup: 'גב אמצעי'
  },
  {
    name: 'הרמת מתים',
    note: 'עמידה מול המוט, אחיזה והרמה עם גב ישר עד עמידה זקופה',
    link: 'https://www.youtube.com/watch?v=ytGaGIn3SjE',
    muscleGroup: 'גב תחתון'
  },
  {
    name: 'משיכת כבל ישיבה',
    note: 'ישיבה מול מכונת כבלים, משיכה לכיוון הבטן עם גב ישר',
    link: 'https://www.youtube.com/watch?v=GZbfZ033f74',
    muscleGroup: 'גב אמצעי'
  },

  // LEGS EXERCISES  
  {
    name: 'סקוואט במוט',
    note: 'מוט על הכתפיים, ירידה עד 90 מעלות בברכיים, עלייה מבוקרת',
    link: 'https://www.youtube.com/watch?v=ultWZbUMPL8',
    muscleGroup: 'ירך קדמי'
  },
  {
    name: 'לאנג\'ס קדימה',
    note: 'צעד גדול קדימה, ירידה עד 90 מעלות בשתי הברכיים, חזרה למקום',
    link: 'https://www.youtube.com/watch?v=QOVaHwm-Q6U',
    muscleGroup: 'ירך קדמי'
  },
  {
    name: 'היפ תראסט',
    note: 'שכיבה על הגב, כפות רגליים על הרצפה, הרמת האגן כלפי מעלה',
    link: 'https://www.youtube.com/watch?v=xDmFkJxPzeM',
    muscleGroup: 'ישבן'
  },
  {
    name: 'רומניאן דדליפט',
    note: 'הרמת מתים עם רגליים יחסית ישרות, דגש על שרירי הירך האחוריים',
    link: 'https://www.youtube.com/watch?v=jEy_czb3RKA',
    muscleGroup: 'ירך אחורי'
  },
  {
    name: 'הרמת עקבים עמידה',
    note: 'עמידה על קצות האצבעות, הרמת הגוף כלפי מעלה באמצעות שרירי השוק',
    link: 'https://www.youtube.com/watch?v=gwLzBJYoWlI',
    muscleGroup: 'שוק'
  },

  // SHOULDERS EXERCISES
  {
    name: 'לחיצת כתפיים עמידה',
    note: 'עמידה זקופה, דחיפת המשקל מעל הראש עד הישרה מלאה',
    link: 'https://www.youtube.com/watch?v=qEwKCR5JCog',
    muscleGroup: 'כתף קדמית'
  },
  {
    name: 'הרמות צד במשקולות יד',
    note: 'זרועות לצדדים, הרמה עד גובה הכתפיים בתנועה מבוקרת',
    link: 'https://www.youtube.com/watch?v=3VcKaXpzqRo',
    muscleGroup: 'כתף צדדית'
  },
  {
    name: 'הרמות אחורה כפופה',
    note: 'כיפוף קדימה, הרמת המשקולות לצדדים לחיזוק החלק האחורי של הכתף',
    link: 'https://www.youtube.com/watch?v=T7HACzo8zb0',
    muscleGroup: 'כתף אחורית'
  },
  {
    name: 'שראגים במשקולות יד',
    note: 'משקולות יד בצדדים, הרמת הכתפיים כלפי מעלה וחזרה',
    link: 'https://www.youtube.com/watch?v=cJRVVxmytaM',
    muscleGroup: 'טרפז'
  },

  // ARMS EXERCISES
  {
    name: 'כיפופי זרועות במוט',
    note: 'עמידה זקופה, כיפוף הזרועות בתנועה מבוקרת לכיוון הכתפיים',
    link: 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo',
    muscleGroup: 'יד קדמית'
  },
  {
    name: 'כיפופי זרועות פטיש',
    note: 'אחיזה ניטרלית במשקולות יד, כיפוף עם שמירה על מיקום כף היד',
    link: 'https://www.youtube.com/watch?v=zC3nLlEvin4',
    muscleGroup: 'יד קדמית'
  },
  {
    name: 'לחיצות צרות במוט',
    note: 'שכיבה על ספסל, אחיזה צרה במוט, לחיצה לחיזוק הטריצפס',
    link: 'https://www.youtube.com/watch?v=nEF0bv2FW94',
    muscleGroup: 'יד אחורית'
  },
  {
    name: 'דיפס על ספסל',
    note: 'ידיים על ספסל מאחור, ירידה ועלייה לחיזוק הטריצפס',
    link: 'https://www.youtube.com/watch?v=6kALZikXxLc',
    muscleGroup: 'יד אחורית'
  },

  // CORE EXERCISES
  {
    name: 'פלאנק',
    note: 'מנח על המרפקים, גוף ישר כמו קרש, החזקה למשך זמן',
    link: 'https://www.youtube.com/watch?v=ASdvN_XEl_c',
    muscleGroup: 'ליבה'
  },
  {
    name: 'כפיפות בטן',
    note: 'שכיבה על הגב, הרמת פלג הגוף העליון לכיוון הברכיים',
    link: 'https://www.youtube.com/watch?v=Xyd_fa5zoEU',
    muscleGroup: 'בטן עליונה'
  },
  {
    name: 'הרמת רגליים שכיבה',
    note: 'שכיבה על הגב, הרמת רגליים ישרות לכיוון התקרה',
    link: 'https://www.youtube.com/watch?v=JB2oyawG9KI',
    muscleGroup: 'בטן תחתונה'
  },
  {
    name: 'כפיפות בטן אופניים',
    note: 'שכיבה על הגב, תנועת רכיבה על אופניים עם כפיפות בטן',
    link: 'https://www.youtube.com/watch?v=9FGilxCbdz8',
    muscleGroup: 'בטן צדדית'
  },

  // FULL BODY EXERCISES
  {
    name: 'ברפי',
    note: 'קפיצה, ירידה לשכיבת סמיכה, קפיצה חזרה - תרגיל גוף מלא',
    link: 'https://www.youtube.com/watch?v=auBLPXO8Fww',
    muscleGroup: 'גוף מלא'
  },
  {
    name: 'מאונטיין קליימברס',
    note: 'מנח שכיבות סמיכה, החלפת רגליים מהירה לכיוון החזה',
    link: 'https://www.youtube.com/watch?v=nmwgirgXLYM',
    muscleGroup: 'גוף מלא'
  },

  // ADDITIONAL TARGETED EXERCISES
  {
    name: 'בולגרי ספליט סקוואט',
    note: 'רגל אחורית על ספסל, רגל קדמית על הרצפה, ירידה ועלייה',
    link: 'https://www.youtube.com/watch?v=2C-uNgKwPLE',
    muscleGroup: 'ירך קדמי'
  },
  {
    name: 'דיפס על מקבילים',
    note: 'תמיכה על מקבילים, ירידה ועלייה לחיזוק חזה וטריצפס',
    link: 'https://www.youtube.com/watch?v=2z8JmcrW-As',
    muscleGroup: 'חזה תחתון'
  }
];

// Helper function to get exercises by muscle group
export const getExercisesByMuscleGroup = (muscleGroup: string): ExerciseTemplate[] => {
  return GYM_EXERCISES.filter(exercise => exercise.muscleGroup === muscleGroup);
};

// Helper function to get random exercises
export const getRandomExercises = (count: number): ExerciseTemplate[] => {
  const shuffled = [...GYM_EXERCISES].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Utility function to convert ExerciseTemplate to server Exercise format
export const convertToServerExercise = (
  template: ExerciseTemplate, 
  exerciseId: string, 
  coachId: string = 'admin'
): any => {
  return {
    exerciseId,
    coachId,
    name: template.name,
    link: template.link,
    note: template.note,
    muscleGroup: template.muscleGroup,
    isAdminExercise: true,
    createdAt: new Date().toISOString()
  };
};
