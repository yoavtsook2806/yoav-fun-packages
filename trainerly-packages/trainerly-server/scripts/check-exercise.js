#!/usr/bin/env node

const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({ region: 'eu-central-1' });
const dynamodb = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = 'matan-trainings-server-dev-exercises';
const EXERCISE_ID = '54355558-cc0f-4839-acc3-ffec89b8cf66';

async function checkExercise() {
  console.log(`🔍 Checking exercise ${EXERCISE_ID}...`);
  
  try {
    // Get the specific exercise
    const getResult = await dynamodb.get({
      TableName: TABLE_NAME,
      Key: { exerciseId: EXERCISE_ID }
    }).promise();
    
    if (getResult.Item) {
      console.log('📋 Exercise found:');
      console.log(JSON.stringify(getResult.Item, null, 2));
    } else {
      console.log('❌ Exercise not found');
    }
    
    // Also scan all exercises to see what we have
    console.log('\n📊 All exercises in database:');
    const scanResult = await dynamodb.scan({
      TableName: TABLE_NAME
    }).promise();
    
    const exercises = scanResult.Items || [];
    console.log(`Found ${exercises.length} total exercises:`);
    
    exercises.forEach(exercise => {
      console.log(`- ${exercise.exerciseId}: "${exercise.name}" (coach: ${exercise.coachId}, isAdmin: ${exercise.isAdminExercise || false})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the check
checkExercise().then(() => {
  console.log('✅ Check completed');
  process.exit(0);
});
