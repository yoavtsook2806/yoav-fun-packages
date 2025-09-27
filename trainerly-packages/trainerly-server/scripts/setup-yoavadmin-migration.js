#!/usr/bin/env node

const API_BASE_URL = 'https://f4xgifcx49.execute-api.eu-central-1.amazonaws.com/dev';

// Admin user details
const ADMIN_USER = {
  name: 'Yoav Admin',
  email: 'yoav@trainerly.com',
  password: 'admin123456',
  nickname: 'yoavadmin'
};

// Comprehensive gym exercises for admin bank
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
  {
    name: 'לחיצת חזה במכונה',
    note: 'ישיבה במכונה, גב צמוד לספסל, דחיפה קדימה עם שליטה',
    link: 'https://www.youtube.com/watch?v=xUm0BiZCWlQ',
    muscleGroup: 'חזה אמצעי'
  },
  {
    name: 'דיפס על מקבילים',
    note: 'תמיכה על מקבילים, הורדה עד זווית 90 מעלות ועלייה',
    link: 'https://www.youtube.com/watch?v=2z8JmcrW-As',
    muscleGroup: 'חזה תחתון'
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
    name: 'משיכת כבל לחזה',
    note: 'ישיבה מול מכונת כבלים, משיכה לחזה עם כיווץ שכמות',
    link: 'https://www.youtube.com/watch?v=GZbfZ033f74',
    muscleGroup: 'גב אמצעי'
  },
  {
    name: 'משיכת T-Bar',
    note: 'כיפוף מעל המוט, אחיזה ומשיכה לבטן עם גב ישר',
    link: 'https://www.youtube.com/watch?v=j3Igk5nyZE4',
    muscleGroup: 'גב אמצעי'
  },
  {
    name: 'משיכת משקולת יד חד זרועית',
    note: 'תמיכה על ספסל, משיכת משקולת יד לצלע עם כיווץ',
    link: 'https://www.youtube.com/watch?v=roCP6wCXPqo',
    muscleGroup: 'גב רחב'
  },

  // LEG EXERCISES
  {
    name: 'כפיפות ברכיים',
    note: 'עמידה עם רגליים ברוחב כתפיים, ירידה עד זווית 90 מעלות',
    link: 'https://www.youtube.com/watch?v=Dy28eq2PjcM',
    muscleGroup: 'רגליים קדמיות'
  },
  {
    name: 'פרפר רגליים',
    note: 'צעידה קדימה עם ירידה עד זווית 90 מעלות בשתי הרגליים',
    link: 'https://www.youtube.com/watch?v=QOVaHwm-Q6U',
    muscleGroup: 'רגליים קדמיות'
  },
  {
    name: 'הרמת ירכיים',
    note: 'שכיבה על הגב, כפיפת ברכיים והרמת ירכיים כלפי מעלה',
    link: 'https://www.youtube.com/watch?v=C_VtOYc6j5c',
    muscleGroup: 'עכוז'
  },
  {
    name: 'הרמת עקבים',
    note: 'עמידה על קצות האצבעות, הרמה והורדה מבוקרת',
    link: 'https://www.youtube.com/watch?v=gwLzBJYoWlI',
    muscleGroup: 'שוקיים'
  },
  {
    name: 'כפיפות ברכיים במכונה',
    note: 'ישיבה במכונה, דחיפה עם רגליים עד הישרה מלאה',
    link: 'https://www.youtube.com/watch?v=IZxyjW7MPJQ',
    muscleGroup: 'רגליים קדמיות'
  },
  {
    name: 'כיפופי ברכיים שכיבה',
    note: 'שכיבה על הבטן, כיפוף ברכיים עם משקולת או מכונה',
    link: 'https://www.youtube.com/watch?v=ELOCsoDSmrg',
    muscleGroup: 'רגליים אחוריות'
  },
  {
    name: 'הרמת מתים רומנית',
    note: 'עמידה עם מוט, הורדה עם גב ישר עד אמצע השוק',
    link: 'https://www.youtube.com/watch?v=cn5MAjJ3ECU',
    muscleGroup: 'רגליים אחוריות'
  },
  {
    name: 'כפיפות ברכיים בולגריות',
    note: 'רגל אחורית על ספסל, כפיפה עם הרגל הקדמית',
    link: 'https://www.youtube.com/watch?v=2C-uNgKwPLE',
    muscleGroup: 'רגליים קדמיות'
  },
  {
    name: 'הרמת ירכיים חד רגלית',
    note: 'שכיבה על הגב, הרמת ירכיים עם רגל אחת',
    link: 'https://www.youtube.com/watch?v=AVAXhy6pl7o',
    muscleGroup: 'עכוז'
  },
  {
    name: 'כפיפות גובלט',
    note: 'החזקת משקולת יד בחזה, כפיפות ברכיים עמוקות',
    link: 'https://www.youtube.com/watch?v=MeIiIdhvXT4',
    muscleGroup: 'רגליים קדמיות'
  },

  // SHOULDER EXERCISES
  {
    name: 'לחיצת כתפיים',
    note: 'עמידה או ישיבה, דחיפת משקולות יד מעל הראש',
    link: 'https://www.youtube.com/watch?v=qEwKCR5JCog',
    muscleGroup: 'כתפיים קדמיות'
  },
  {
    name: 'הרמות צד',
    note: 'עמידה עם משקולות יד, הרמה לצדדים עד גובה הכתפיים',
    link: 'https://www.youtube.com/watch?v=3VcKaXpzqRo',
    muscleGroup: 'כתפיים אמצעיות'
  },
  {
    name: 'הרמות אחורה',
    note: 'כיפוף קדימה, הרמת משקולות יד אחורה',
    link: 'https://www.youtube.com/watch?v=ea7-J9UeqX0',
    muscleGroup: 'כתפיים אחוריות'
  },
  {
    name: 'שראגס',
    note: 'החזקת משקולות יד, הרמת כתפיים כלפי מעלה',
    link: 'https://www.youtube.com/watch?v=cJRVVxmytaM',
    muscleGroup: 'טרפז עליון'
  },
  {
    name: 'לחיצת כתפיים במוט',
    note: 'עמידה עם מוט, דחיפה מעל הראש עם גב ישר',
    link: 'https://www.youtube.com/watch?v=2yjwXTZQDDI',
    muscleGroup: 'כתפיים קדמיות'
  },
  {
    name: 'הרמות קדימה',
    note: 'עמידה עם משקולות יד, הרמה קדימה עד גובה הכתפיים',
    link: 'https://www.youtube.com/watch?v=qEwKCR5JCog',
    muscleGroup: 'כתפיים קדמיות'
  },
  {
    name: 'פייס פולס',
    note: 'משיכת כבל לפנים עם זרועות מתוחות',
    link: 'https://www.youtube.com/watch?v=rep-qVOkqgk',
    muscleGroup: 'כתפיים אחוריות'
  },

  // ARM EXERCISES
  {
    name: 'כיפופי זרוע במוט',
    note: 'עמידה עם מוט, כיפוף זרועות עם מרפקים צמודים לגוף',
    link: 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo',
    muscleGroup: 'ביצפס'
  },
  {
    name: 'כיפופי זרוע במשקולות יד',
    note: 'עמידה או ישיבה, כיפוף זרועות לסירוגין או יחד',
    link: 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo',
    muscleGroup: 'ביצפס'
  },
  {
    name: 'הרמות טריצפס',
    note: 'שכיבה על ספסל, הרמת משקולת יד מאחורי הראש',
    link: 'https://www.youtube.com/watch?v=YbX7Wd8jQ-Q',
    muscleGroup: 'טריצפס'
  },
  {
    name: 'דחיפות טריצפס',
    note: 'עמידה מול מכונת כבלים, דחיפה כלפי מטה',
    link: 'https://www.youtube.com/watch?v=2-LAMcpzODU',
    muscleGroup: 'טריצפס'
  },
  {
    name: 'כיפופי זרוע פטיש',
    note: 'עמידה עם משקולות יד, כיפוף עם אחיזה ניטרלית',
    link: 'https://www.youtube.com/watch?v=zC3nLlEvin4',
    muscleGroup: 'ביצפס'
  },
  {
    name: 'דיפס על ספסל',
    note: 'ישיבה על קצה ספסל, הורדה ועלייה עם ידיים',
    link: 'https://www.youtube.com/watch?v=0326dy_-CzM',
    muscleGroup: 'טריצפס'
  },
  {
    name: 'כיפופי זרוע בכבל',
    note: 'עמידה מול מכונת כבלים, כיפוף זרועות',
    link: 'https://www.youtube.com/watch?v=kwG2ipFRgfo',
    muscleGroup: 'ביצפס'
  },
  {
    name: 'הרמות טריצפס עילי',
    note: 'עמידה עם משקולת יד, הרמה מאחורי הראש',
    link: 'https://www.youtube.com/watch?v=YbX7Wd8jQ-Q',
    muscleGroup: 'טריצפס'
  },
  {
    name: 'כיפופי זרוע ריכוז',
    note: 'ישיבה עם משקולת יד, כיפוף עם תמיכה על הרגל',
    link: 'https://www.youtube.com/watch?v=0AUGkch3tzc',
    muscleGroup: 'ביצפס'
  },

  // CORE EXERCISES
  {
    name: 'פלאנק',
    note: 'מנח על מרפקים וקצות רגליים, שמירה על גוף ישר',
    link: 'https://www.youtube.com/watch?v=ASdvN_XEl_c',
    muscleGroup: 'בטן'
  },
  {
    name: 'בטן עליונה',
    note: 'שכיבה על הגב, הרמת פלג גוף עליון לכיוון הברכיים',
    link: 'https://www.youtube.com/watch?v=1fbU_MkV7NE',
    muscleGroup: 'בטן עליונה'
  },
  {
    name: 'מטפסי הרים',
    note: 'מנח פלאנק, החלפת רגליים במהירות לכיוון החזה',
    link: 'https://www.youtube.com/watch?v=kLh-uczlPLg',
    muscleGroup: 'בטן'
  },
  {
    name: 'רוסיאן טוויסט',
    note: 'ישיבה עם רגליים מורמות, סיבוב גוף לצדדים',
    link: 'https://www.youtube.com/watch?v=wkD8rjkodUI',
    muscleGroup: 'בטן צדדית'
  },
  {
    name: 'הרמת רגליים',
    note: 'שכיבה על הגב, הרמת רגליים ישרות עד 90 מעלות',
    link: 'https://www.youtube.com/watch?v=JB2oyawG9KI',
    muscleGroup: 'בטן תחתונה'
  },
  {
    name: 'פלאנק צדדי',
    note: 'שכיבה על הצד, תמיכה על מרפק אחד',
    link: 'https://www.youtube.com/watch?v=K2VljzCC16g',
    muscleGroup: 'בטן צדדית'
  },
  {
    name: 'דד באג',
    note: 'שכיבה על הגב, הרמת רגל וזרוע נגדיות',
    link: 'https://www.youtube.com/watch?v=4XLEnwUr1d8',
    muscleGroup: 'בטן'
  },

  // FULL BODY EXERCISES
  {
    name: 'ברפיז',
    note: 'כפיפה, קפיצה לפלאנק, שכיבת סמיכה, קפיצה וקפיצה למעלה',
    link: 'https://www.youtube.com/watch?v=auBLPXO8Fww',
    muscleGroup: 'גוף מלא'
  },
  {
    name: 'נדנוד קטלבל',
    note: 'עמידה עם קטלבל, נדנוד מבין הרגליים לגובה החזה',
    link: 'https://www.youtube.com/watch?v=YSxHifyI6s8',
    muscleGroup: 'גוף מלא'
  },
  {
    name: 'טרסטרס',
    note: 'הרמת מוט מהרצפה לכתפיים ואז מעל הראש',
    link: 'https://www.youtube.com/watch?v=1xMaFs0L3ao',
    muscleGroup: 'גוף מלא'
  },
  {
    name: 'קלין אנד פרס',
    note: 'הרמת מוט לכתפיים ודחיפה מעל הראש בתנועה אחת',
    link: 'https://www.youtube.com/watch?v=KwYJTpQ_x5A',
    muscleGroup: 'גוף מלא'
  }
];

async function makeApiCall(endpoint, method = 'GET', body = null, token = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  console.log(`🌐 ${method} ${url}`);
  if (body) {
    console.log(`📤 Request:`, JSON.stringify(body, null, 2));
  }

  try {
    const response = await fetch(url, options);
    const responseText = await response.text();
    
    console.log(`📥 Response (${response.status}):`, responseText);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${responseText}`);
    }

    return responseText ? JSON.parse(responseText) : null;
  } catch (error) {
    console.error(`❌ API call failed:`, error.message);
    throw error;
  }
}

async function registerYoavAdmin() {
  console.log('\n🔧 Step 1: Registering yoavadmin...');
  
  try {
    const response = await makeApiCall('/coaches', 'POST', ADMIN_USER);
    console.log('✅ yoavadmin registered successfully!');
    console.log(`👤 Coach ID: ${response.coachId}`);
    console.log(`🔑 Token: ${response.token}`);
    console.log(`📛 Nickname: ${response.nickname}`);
    
    return {
      coachId: response.coachId,
      token: response.token,
      nickname: response.nickname
    };
  } catch (error) {
    if (error.message.includes('already')) {
      console.log('⚠️  yoavadmin already exists, attempting login...');
      return await loginYoavAdmin();
    }
    throw error;
  }
}

async function loginYoavAdmin() {
  console.log('\n🔑 Attempting to login yoavadmin...');
  
  try {
    const loginData = {
      email: ADMIN_USER.email,
      password: ADMIN_USER.password
    };
    
    const response = await makeApiCall('/auth/coach/login', 'POST', loginData);
    console.log('✅ yoavadmin logged in successfully!');
    console.log(`👤 Coach ID: ${response.coachId}`);
    console.log(`🔑 Token: ${response.token}`);
    
    return {
      coachId: response.coachId,
      token: response.token,
      nickname: 'yoavadmin'
    };
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    throw error;
  }
}

async function uploadExercise(exercise, coachId, token) {
  try {
    const response = await makeApiCall(
      `/coaches/${coachId}/exercises`,
      'POST',
      exercise,
      token
    );
    
    console.log(`✅ Uploaded: ${exercise.name}`);
    return response;
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log(`⚠️  Exercise "${exercise.name}" already exists, skipping...`);
      return null;
    }
    console.error(`❌ Failed to upload "${exercise.name}":`, error.message);
    throw error;
  }
}

async function uploadAllExercises(coachId, token) {
  console.log(`\n🏋️  Step 2: Uploading ${GYM_EXERCISES.length} admin exercises...`);
  
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < GYM_EXERCISES.length; i++) {
    const exercise = GYM_EXERCISES[i];
    console.log(`\n📋 [${i + 1}/${GYM_EXERCISES.length}] ${exercise.name}`);
    
    try {
      const result = await uploadExercise(exercise, coachId, token);
      if (result) {
        successCount++;
      } else {
        skipCount++;
      }
      
      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      errorCount++;
      console.error(`❌ Error uploading "${exercise.name}":`, error.message);
      // Continue with next exercise
    }
  }
  
  console.log('\n📊 Upload Summary:');
  console.log(`✅ Successfully uploaded: ${successCount}`);
  console.log(`⚠️  Skipped (already exist): ${skipCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📝 Total processed: ${successCount + skipCount + errorCount}/${GYM_EXERCISES.length}`);
}

async function verifyAdminExercises(coachId, token) {
  console.log('\n🔍 Step 3: Verifying admin exercises...');
  
  try {
    const response = await makeApiCall(`/coaches/${coachId}/exercises/admin`, 'GET', null, token);
    console.log(`✅ Found ${response.data.length} admin exercises in the bank`);
    
    // Show first few exercises as sample
    console.log('\n📋 Sample admin exercises:');
    response.data.slice(0, 5).forEach((exercise, index) => {
      console.log(`${index + 1}. ${exercise.name} (${exercise.muscleGroup})`);
    });
    
    if (response.data.length > 5) {
      console.log(`... and ${response.data.length - 5} more exercises`);
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Failed to verify admin exercises:', error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting yoavadmin migration and admin exercises setup...');
  console.log('='.repeat(60));
  
  try {
    // Step 1: Register/Login yoavadmin
    const adminUser = await registerYoavAdmin();
    
    console.log('\n⚠️  IMPORTANT: Please set yoavadmin as admin in AWS console!');
    console.log(`👤 Coach ID to update: ${adminUser.coachId}`);
    console.log(`📝 Set isAdmin: true for this coach in DynamoDB`);
    console.log('\nPress Enter when you have set the admin flag...');
    
    // Wait for user confirmation
    await new Promise(resolve => {
      process.stdin.once('data', () => resolve());
    });
    
    // Step 2: Upload all exercises
    await uploadAllExercises(adminUser.coachId, adminUser.token);
    
    // Step 3: Verify exercises were uploaded
    await verifyAdminExercises(adminUser.coachId, adminUser.token);
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('='.repeat(60));
    console.log('✅ yoavadmin is registered');
    console.log('✅ Admin exercises are uploaded');
    console.log('✅ Exercise bank is ready for use');
    console.log('\n🔗 Coach app: http://localhost:3009');
    console.log('🔗 Trainee app: http://localhost:5175');
    
  } catch (error) {
    console.error('\n💥 Migration failed:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Migration interrupted by user');
  process.exit(0);
});

// Run the migration
main();
