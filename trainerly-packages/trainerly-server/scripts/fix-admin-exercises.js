#!/usr/bin/env node

const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({ region: 'eu-central-1' });
const dynamodb = new AWS.DynamoDB.DocumentClient();

const COACHES_TABLE = 'matan-trainings-server-dev-coaches';
const EXERCISES_TABLE = 'matan-trainings-server-dev-exercises';

async function fixAdminExercises() {
  console.log('🔍 Finding admin coaches and their exercises...');
  
  try {
    // Get all coaches
    const coachesResult = await dynamodb.scan({
      TableName: COACHES_TABLE
    }).promise();
    
    const coaches = coachesResult.Items || [];
    const adminCoaches = coaches.filter(coach => coach.isAdmin === true);
    
    console.log(`📊 Found ${coaches.length} total coaches, ${adminCoaches.length} are admins:`);
    adminCoaches.forEach(coach => {
      console.log(`  - ${coach.email} (${coach.coachId})`);
    });
    
    if (adminCoaches.length === 0) {
      console.log('❌ No admin coaches found');
      return;
    }
    
    // Get all exercises
    const exercisesResult = await dynamodb.scan({
      TableName: EXERCISES_TABLE
    }).promise();
    
    const exercises = exercisesResult.Items || [];
    console.log(`📋 Found ${exercises.length} total exercises`);
    
    // Find exercises created by admin coaches that aren't marked as admin
    const adminCoachIds = adminCoaches.map(coach => coach.coachId);
    const exercisesToFix = exercises.filter(exercise => 
      adminCoachIds.includes(exercise.coachId) && !exercise.isAdminExercise
    );
    
    console.log(`🔧 Found ${exercisesToFix.length} exercises to fix:`);
    exercisesToFix.forEach(exercise => {
      const coach = adminCoaches.find(c => c.coachId === exercise.coachId);
      console.log(`  - "${exercise.name}" by ${coach.email}`);
    });
    
    if (exercisesToFix.length === 0) {
      console.log('✅ No exercises need fixing');
      return;
    }
    
    // Fix each exercise
    let fixedCount = 0;
    for (const exercise of exercisesToFix) {
      try {
        await dynamodb.update({
          TableName: EXERCISES_TABLE,
          Key: { exerciseId: exercise.exerciseId },
          UpdateExpression: 'SET isAdminExercise = :isAdmin',
          ExpressionAttributeValues: {
            ':isAdmin': true
          }
        }).promise();
        
        console.log(`✅ Fixed exercise: "${exercise.name}"`);
        fixedCount++;
      } catch (err) {
        console.error(`❌ Failed to fix exercise "${exercise.name}":`, err.message);
      }
    }
    
    console.log(`🎉 Successfully fixed ${fixedCount}/${exercisesToFix.length} exercises`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the fix
fixAdminExercises().then(() => {
  console.log('✅ Migration completed');
  process.exit(0);
});
