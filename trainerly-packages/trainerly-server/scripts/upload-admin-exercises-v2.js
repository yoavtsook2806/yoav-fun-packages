const { GYM_EXERCISES, convertToServerExercise } = require('../src/constants/exercises');
const { randomUUID } = require('crypto');

const ADMIN_COACH_ID = 'd3cfef83-5549-4559-bbaf-a3773f7fe2a4'; // The admin user we just created
const API_BASE_URL = 'https://f4xgifcx49.execute-api.eu-central-1.amazonaws.com/dev';

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
      await new Promise(resolve => setTimeout(resolve, 100));
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
