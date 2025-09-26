const ADMIN_COACH_ID = 'd3cfef83-5549-4559-bbaf-a3773f7fe2a4';
const API_BASE_URL = 'https://f4xgifcx49.execute-api.eu-central-1.amazonaws.com/dev';

const GYM_EXERCISES = [
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

  // LEG EXERCISES
  {
    name: 'סקוואט',
    note: 'עמידה עם רגליים ברוחב כתפיים, ירידה כאילו יושבים על כיסא, עלייה',
    link: 'https://www.youtube.com/watch?v=Dy28eq2PjcM',
    muscleGroup: 'ירך קדמי'
  },
  {
    name: 'לנג\'ס',
    note: 'צעד גדול קדימה, ירידה עד זווית 90 מעלות בשתי הרגליים, חזרה',
    link: 'https://www.youtube.com/watch?v=QOVaHwm-Q6U',
    muscleGroup: 'ירך קדמי'
  },
  {
    name: 'כיפופי רגליים שכיבה',
    note: 'שכיבה על הבטן, כיפוף הרגליים כלפי הישבן נגד התנגדות',
    link: 'https://www.youtube.com/watch?v=ELOCsoDSmrg',
    muscleGroup: 'ירך אחורי'
  },
  {
    name: 'עלייה על קצות אצבעות',
    note: 'עמידה זקופה, עלייה על קצות האצבעות והורדה מבוקרת',
    link: 'https://www.youtube.com/watch?v=gwLzBJYoWlI',
    muscleGroup: 'שוק'
  },

  // SHOULDER EXERCISES
  {
    name: 'לחיצת כתפיים עמידה',
    note: 'עמידה עם משקולות יד, לחיצה כלפי מעלה מעל הראש',
    link: 'https://www.youtube.com/watch?v=qEwKCR5JCog',
    muscleGroup: 'כתף קדמית'
  },
  {
    name: 'הרמות צד',
    note: 'עמידה עם משקולות יד, הרמה לצדדים עד גובה הכתפיים',
    link: 'https://www.youtube.com/watch?v=3VcKaXpzqRo',
    muscleGroup: 'כתף צדדית'
  },
  {
    name: 'פרפר הפוך',
    note: 'כיפוף קדימה, הרמת משקולות יד לצדדים לחיזוק הכתף האחורית',
    link: 'https://www.youtube.com/watch?v=T7sFCtemhgw',
    muscleGroup: 'כתף אחורית'
  },

  // ARM EXERCISES
  {
    name: 'כיפופי זרוע עמידה',
    note: 'עמידה עם משקולות יד, כיפוף הזרועות לכיוון הכתפיים',
    link: 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo',
    muscleGroup: 'יד קדמית'
  },
  {
    name: 'לחיצת זרוע מעל הראש',
    note: 'ישיבה או עמידה, לחיצת משקולת יד מאחורי הראש כלפי מעלה',
    link: 'https://www.youtube.com/watch?v=nRiJVZDpdL0',
    muscleGroup: 'יד אחורית'
  },
  {
    name: 'כיפופי פרק כף היד',
    note: 'אחיזה במשקולת יד, כיפוף פרק כף היד כלפי מעלה ומטה',
    link: 'https://www.youtube.com/watch?v=CLqOjJB2sME',
    muscleGroup: 'אמה'
  },

  // CORE EXERCISES
  {
    name: 'בטן עליונה',
    note: 'שכיבה על הגב, הרמת הראש והכתפיים לכיוון הברכיים',
    link: 'https://www.youtube.com/watch?v=jDwoBqPH0jk',
    muscleGroup: 'בטן עליונה'
  },
  {
    name: 'הרמת רגליים',
    note: 'שכיבה על הגב, הרמת רגליים ישרות לכיוון התקרה',
    link: 'https://www.youtube.com/watch?v=JB2oyawG9KI',
    muscleGroup: 'בטן תחתונה'
  },
  {
    name: 'פלאנק',
    note: 'מנח על מרפקים וקצות אצבעות, שמירה על קו ישר מהראש לעקבים',
    link: 'https://www.youtube.com/watch?v=ASdvN_XEl_c',
    muscleGroup: 'ליבה'
  },

  // ADDITIONAL EXERCISES
  {
    name: 'היפ ת\'ראסט',
    note: 'שכיבה על הגב עם כתפיים על ספסל, הרמת הישבן כלפי מעלה',
    link: 'https://www.youtube.com/watch?v=xDmFkJxPzeM',
    muscleGroup: 'ישבן'
  },
  {
    name: 'סקוואט גביע',
    note: 'אחיזה במשקולת יד בגובה החזה, ביצוע סקוואט עמוק',
    link: 'https://www.youtube.com/watch?v=MeIiIdhvXT4',
    muscleGroup: 'ירך קדמי'
  },
  {
    name: 'משיכת פנים',
    note: 'משיכת כבל או רצועה לכיוון הפנים לחיזוק הגב העליון',
    link: 'https://www.youtube.com/watch?v=HSoHeSjvIdY',
    muscleGroup: 'גב עליון'
  },
  {
    name: 'דיפס',
    note: 'תמיכה על שתי ידיים, הורדה ועלייה לחיזוק החזה והזרועות',
    link: 'https://www.youtube.com/watch?v=2z8JmcrW-As',
    muscleGroup: 'חזה תחתון'
  },
  {
    name: 'כיפופי רגליים עמידה',
    note: 'עמידה וכיפוף רגל אחת לכיוון הישבן בתורות',
    link: 'https://www.youtube.com/watch?v=1Tq3QdYUuHs',
    muscleGroup: 'ירך אחורי'
  },
  {
    name: 'הרמות ירכיים לצד',
    note: 'שכיבה על הצד, הרמת רגל עליונה לכיוון התקרה',
    link: 'https://www.youtube.com/watch?v=6jmm8rM4meY',
    muscleGroup: 'ירך חיצוני'
  },
  {
    name: 'סקוואט סומו',
    note: 'עמידה עם רגליים רחבות, כפות רגליים פונות החוצה, סקוואט עמוק',
    link: 'https://www.youtube.com/watch?v=0YXdkBGVF7s',
    muscleGroup: 'ירך פנימי'
  },
  {
    name: 'ברפיז',
    note: 'שילוב של סקוואט, שכיבת סמיכה וקפיצה - תרגיל גוף מלא',
    link: 'https://www.youtube.com/watch?v=dZgVxmf6jkA',
    muscleGroup: 'גוף מלא'
  },
  {
    name: 'הליכת דוב',
    note: 'הליכה על ארבע עם ידיים ורגליים, שמירה על הברכיים מעל הקרקע',
    link: 'https://www.youtube.com/watch?v=f8AzWDPsS6s',
    muscleGroup: 'גוף מלא'
  },
  {
    name: 'טרפז עם משקולות יד',
    note: 'עמידה עם משקולות יד, הרמת הכתפיים כלפי מעלה',
    link: 'https://www.youtube.com/watch?v=cJRVVxmytaM',
    muscleGroup: 'טרפז'
  }
];

async function uploadExercise(exerciseTemplate) {
  try {
    const exerciseData = {
      name: exerciseTemplate.name,
      muscleGroup: exerciseTemplate.muscleGroup,
      note: exerciseTemplate.note,
      link: exerciseTemplate.link
    };

    console.log(`📤 Uploading: ${exerciseTemplate.name} (${exerciseTemplate.muscleGroup})`);

    const response = await fetch(`${API_BASE_URL}/coaches/${ADMIN_COACH_ID}/exercises`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(exerciseData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log(`✅ Created exercise: ${exerciseTemplate.name} (ID: ${result.exerciseId})`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to upload ${exerciseTemplate.name}:`, error.message);
    throw error;
  }
}

async function uploadAllExercises() {
  console.log(`🚀 Starting to upload ${GYM_EXERCISES.length} exercises to admin user...`);
  console.log(`🎯 Admin Coach ID: ${ADMIN_COACH_ID}`);
  console.log('');

  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < GYM_EXERCISES.length; i++) {
    const exercise = GYM_EXERCISES[i];
    try {
      await uploadExercise(exercise);
      successCount++;
      
      // Add small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      failureCount++;
    }
    
    console.log(`📊 Progress: ${i + 1}/${GYM_EXERCISES.length} (✅ ${successCount}, ❌ ${failureCount})`);
    console.log('');
  }

  console.log('🎉 Upload completed!');
  console.log(`✅ Successfully uploaded: ${successCount} exercises`);
  console.log(`❌ Failed uploads: ${failureCount} exercises`);
  
  if (failureCount > 0) {
    console.log('⚠️ Some exercises failed to upload. Check the errors above.');
    process.exit(1);
  } else {
    console.log('🎊 All exercises uploaded successfully!');
    process.exit(0);
  }
}

// Run the upload
uploadAllExercises().catch(error => {
  console.error('💥 Unexpected error during upload:', error);
  process.exit(1);
});
