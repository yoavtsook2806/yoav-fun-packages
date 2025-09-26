#!/usr/bin/env node

const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({ region: 'eu-central-1' });
const dynamodb = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = 'matan-trainings-server-dev-coaches';
const COACH_ID = '3c7dd167-1864-4f1e-8a17-922477d563c9';

async function checkCoach() {
  console.log(`🔍 Checking coach ${COACH_ID}...`);
  
  try {
    // Get the specific coach
    const getResult = await dynamodb.get({
      TableName: TABLE_NAME,
      Key: { coachId: COACH_ID }
    }).promise();
    
    if (getResult.Item) {
      console.log('📋 Coach found:');
      console.log(JSON.stringify(getResult.Item, null, 2));
    } else {
      console.log('❌ Coach not found');
    }
    
    // Also scan all coaches to see what we have
    console.log('\n📊 All coaches in database:');
    const scanResult = await dynamodb.scan({
      TableName: TABLE_NAME
    }).promise();
    
    const coaches = scanResult.Items || [];
    console.log(`Found ${coaches.length} total coaches:`);
    
    coaches.forEach(coach => {
      console.log(`- ${coach.coachId}: "${coach.email}" (isAdmin: ${coach.isAdmin || false})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the check
checkCoach().then(() => {
  console.log('✅ Check completed');
  process.exit(0);
});
