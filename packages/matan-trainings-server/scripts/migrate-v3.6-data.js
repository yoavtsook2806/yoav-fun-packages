// Script to migrate v3.6 training data to new structure
const { v4: uuidv4 } = require('uuid');

// Original v3.6 data structure
const originalData = {
  "A": {
    "לחיצת חזה, מ. יד, שיפוע 30*": {
      "numberOfSets": 8,
      link: "https://www.youtube.com/watch?v=QDKxHpMQxlY&list=PLQaATYNsaV4VVx7I8HxsrFZAppDjvdxkp&index=16&ab_channel=KILOPersonalTrainer%26StrengthCoachEducation",
      minimumTimeToRest: 15,
      maximumTimeToRest: 60,
      minimumNumberOfRepeasts: 8,
      maximumNumberOfRepeasts: 8,
      note: "",
      short: "חזה"
    },
    "פרפר, מ. יד/מכונה": {
      "numberOfSets": 8,
      link: "https://www.youtube.com/watch?v=JFm8KbhjibM&ab_channel=RenaissancePeriodization",
      minimumTimeToRest: 15,
      maximumTimeToRest: 60,
      minimumNumberOfRepeasts: 8,
      maximumNumberOfRepeasts: 8,
      note: "מרפקים מעט מכופפים, חזה פתוח. לרדת בשליטה למתיחה יפה ולעלות חזרה עד שהמשקולות מעל הכתפיים",
      short: "פרפר"
    },
    "לחיצת רגליים": {
      "numberOfSets": 8,
      link: "https://www.youtube.com/watch?v=yZmx_Ac3880&ab_channel=RenaissancePeriodization",
      minimumTimeToRest: 15,
      maximumTimeToRest: 60,
      minimumNumberOfRepeasts: 8,
      maximumNumberOfRepeasts: 8,
      note: "גב תחתון ואגן נשארים צמודים למשענות לאורך כל התרגיל",
      short: "רגליים"
    },
    "פשיטת מרפק, פולי עליון, חבל": {
      "numberOfSets": 8,
      link: "https://www.youtube.com/watch?v=-xa-6cQaZKY&ab_channel=RenaissancePeriodization",
      minimumTimeToRest: 15,
      maximumTimeToRest: 60,
      minimumNumberOfRepeasts: 8,
      maximumNumberOfRepeasts: 8,
      note: "לנעול מרפקים ולחזור לכפיפה מלאה",
      short: "טריצפס"
    },
    "AB ROLLOUT": {
      "numberOfSets": 3,
      link: "https://www.youtube.com/watch?v=DA2QGI0NPWU&ab_channel=TestosteroneNation",
      minimumTimeToRest: 60,
      maximumTimeToRest: 60,
      minimumNumberOfRepeasts: 6,
      maximumNumberOfRepeasts: 8,
      note: "לשים לב שהאגן והתחת לא קופצים החוצה. להשאיר אגן מגולגל פנימה מעט",
      short: "בטן"
    }
  },
  "B": {
    "משיכה בפולי עליון, ניטרלי": {
      "numberOfSets": 8,
      link: "https://www.youtube.com/watch?v=kxeklf1Tkhw&ab_channel=JohnRusin",
      minimumTimeToRest: 15,
      maximumTimeToRest: 60,
      minimumNumberOfRepeasts: 8,
      maximumNumberOfRepeasts: 8,
      note: "",
      short: "משיכה"
    },
    "חתירה בכבל, רחב": {
      "numberOfSets": 8,
      link: "https://www.youtube.com/watch?v=iXGHN-MWFfY&ab_channel=HockeyTrainingExerciseDemonstrations",
      minimumTimeToRest: 15,
      maximumTimeToRest: 60,
      minimumNumberOfRepeasts: 8,
      maximumNumberOfRepeasts: 8,
      note: "",
      short: "חתירה"
    },
    "הרחקות אופקיות, שיפוע 30*, מ. יד": {
      "numberOfSets": 8,
      link: "https://www.youtube.com/watch?v=Z__dp9rhlcw&ab_channel=FunctionalBodybuilding",
      minimumTimeToRest: 15,
      maximumTimeToRest: 60,
      minimumNumberOfRepeasts: 8,
      maximumNumberOfRepeasts: 8,
      note: "לתת לשכמות להשמט קדימה, אין צורך להצמיד אותן בתרגיל. לחשוב על להרחיק את המשקולות לצדדים כמה שאפשר (ממש לחשוב 'לגרד את הקירות')",
      short: "הרחקות"
    },
    "כפיפת מרפק בשיפוע 60*, סופינציה": {
      "numberOfSets": 8,
      link: "https://www.youtube.com/watch?v=aG7CXiKxepw&ab_channel=OPEXFitness",
      minimumTimeToRest: 15,
      maximumTimeToRest: 60,
      minimumNumberOfRepeasts: 8,
      maximumNumberOfRepeasts: 8,
      note: "כתפיים נשארות משוכות אחורה. אם כתף מתעגלת לפנים סימן שאתם בשיפוע נמוך מדי.",
      short: "ביצפס"
    },
    "תאומים (לחיצת רגליים/סמית' משין)": {
      "numberOfSets": 8,
      link: "",
      minimumTimeToRest: 15,
      maximumTimeToRest: 60,
      minimumNumberOfRepeasts: 8,
      maximumNumberOfRepeasts: 8,
      note: "מתיחה יפה בתחתית ולא להתפוצץ בעלייה, לעלות בשליטה",
      short: "תאומים"
    }
  },
  "C": {
    "לחיצת כתפיים בישיבה, מ. יד": {
      "numberOfSets": 8,
      link: "https://www.youtube.com/watch?v=HzIiNhHhhtA&ab_channel=RenaissancePeriodization",
      minimumTimeToRest: 15,
      maximumTimeToRest: 60,
      minimumNumberOfRepeasts: 8,
      maximumNumberOfRepeasts: 8,
      note: "",
      short: "כתפיים"
    },
    "הרחקת כתפיים בשיפוע 60*, מ. יד, בשכיבה על החזה": {
      "numberOfSets": 8,
      link: "https://www.youtube.com/watch?v=nvGTvUiaEOs&ab_channel=FunctionalAF",
      minimumTimeToRest: 15,
      maximumTimeToRest: 60,
      minimumNumberOfRepeasts: 8,
      maximumNumberOfRepeasts: 8,
      note: "ההצמדה של השכמות בסרטון לא הכרחית. זה כמו הרחקת כתפיים בעמידה, רק בשיפוע",
      short: "הרחקות כתף"
    },
    "חתירה במכונה": {
      "numberOfSets": 8,
      link: "https://www.youtube.com/watch?v=TeFo51Q_Nsc&ab_channel=PureGym",
      minimumTimeToRest: 15,
      maximumTimeToRest: 60,
      minimumNumberOfRepeasts: 8,
      maximumNumberOfRepeasts: 8,
      note: "אחיזה שנוחה לכם, פחות משנה במקרה הזה",
      short: "חתירה"
    },
    "כפיפת ברכיים בישיבה": {
      "numberOfSets": 8,
      link: "https://www.youtube.com/watch?v=Orxowest56U&ab_channel=RenaissancePeriodization",
      minimumTimeToRest: 15,
      maximumTimeToRest: 60,
      minimumNumberOfRepeasts: 8,
      maximumNumberOfRepeasts: 8,
      note: "לא להקשית גב תחתון",
      short: "ברכיים"
    },
    "כפיפות בטן, רגליים מקובעות": {
      "numberOfSets": 3,
      link: "https://www.youtube.com/watch?v=8qQkaw1r2ic&list=PLQaATYNsaV4VVx7I8HxsrFZAppDjvdxkp&index=145&ab_channel=KILOPersonalTrainer%26StrengthCoachEducation",
      minimumTimeToRest: 60,
      maximumTimeToRest: 60,
      minimumNumberOfRepeasts: 10,
      maximumNumberOfRepeasts: 12,
      note: "להוסיף משקל על החזה כשאפשר. ירידה בשליטה",
      short: "בטן"
    }
  }
};

function migrateData() {
  const coachId = uuidv4(); // Demo coach ID
  const exercises = [];
  const uniqueExercises = new Set();

  // Extract unique exercises
  Object.values(originalData).forEach(training => {
    Object.entries(training).forEach(([exerciseName, exerciseData]) => {
      if (!uniqueExercises.has(exerciseName)) {
        uniqueExercises.add(exerciseName);
        
        exercises.push({
          exerciseId: uuidv4(),
          coachId,
          name: exerciseName,
          link: exerciseData.link || null,
          note: exerciseData.note || null,
          short: exerciseData.short,
          muscleGroup: null, // Could be inferred from short description
          createdAt: new Date().toISOString()
        });
      }
    });
  });

  // Create training plan
  const trainings = Object.entries(originalData).map(([trainingName, exercises], index) => ({
    trainingId: uuidv4(),
    name: `Training ${trainingName}`,
    order: index + 1,
    exercises: Object.entries(exercises).map(([exerciseName, exerciseData]) => ({
      exerciseName,
      numberOfSets: exerciseData.numberOfSets,
      minimumTimeToRest: exerciseData.minimumTimeToRest,
      maximumTimeToRest: exerciseData.maximumTimeToRest,
      minimumNumberOfRepeasts: exerciseData.minimumNumberOfRepeasts,
      maximumNumberOfRepeasts: exerciseData.maximumNumberOfRepeasts
    }))
  }));

  const trainingPlan = {
    planId: uuidv4(),
    coachId,
    name: "Training Plan v3.6",
    description: "Migrated from original v3.6 structure",
    trainings,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return {
    coach: {
      coachId,
      name: "Demo Coach",
      email: "demo@example.com",
      nickname: "demo_coach",
      passwordHash: "$2a$10$dummyHashForDemo", // This would be a real bcrypt hash
      valid: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    exercises,
    trainingPlan
  };
}

// Generate the migrated data
const migratedData = migrateData();

console.log('=== MIGRATED DATA ===');
console.log('\n1. COACH:');
console.log(JSON.stringify(migratedData.coach, null, 2));

console.log('\n2. EXERCISES:');
migratedData.exercises.forEach((exercise, index) => {
  console.log(`Exercise ${index + 1}:`);
  console.log(JSON.stringify(exercise, null, 2));
});

console.log('\n3. TRAINING PLAN:');
console.log(JSON.stringify(migratedData.trainingPlan, null, 2));

// Export for use in other scripts
module.exports = migratedData;
