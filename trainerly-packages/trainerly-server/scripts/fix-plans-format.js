#!/usr/bin/env node

const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({ region: 'eu-central-1' });
const dynamodb = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = 'matan-trainings-server-dev-trainers';

async function fixPlansFormat() {
  console.log('🔍 Scanning trainers table for format issues...');
  
  try {
    // Scan all trainers
    const scanResult = await dynamodb.scan({
      TableName: TABLE_NAME
    }).promise();
    
    const trainers = scanResult.Items || [];
    console.log(`📊 Found ${trainers.length} trainers`);
    
    let fixedCount = 0;
    
    for (const trainer of trainers) {
      if (trainer.plans && Array.isArray(trainer.plans) && trainer.plans.length > 0) {
        let needsUpdate = false;
        const originalPlans = trainer.plans;
        const fixedPlans = [];
        
        for (const plan of originalPlans) {
          if (typeof plan === 'object' && plan.S) {
            // This is DynamoDB format: { "S": "value" }
            fixedPlans.push(plan.S);
            needsUpdate = true;
          } else if (typeof plan === 'string') {
            // This is already correct format
            fixedPlans.push(plan);
          } else {
            console.log(`⚠️ Unknown plan format for trainer ${trainer.firstName} ${trainer.lastName}:`, plan);
            fixedPlans.push(plan); // Keep as-is
          }
        }
        
        if (needsUpdate) {
          console.log(`🔧 Fixing trainer ${trainer.firstName} ${trainer.lastName}:`);
          console.log(`   Original plans:`, originalPlans);
          console.log(`   Fixed plans:`, fixedPlans);
          
          // Update the trainer
          await dynamodb.update({
            TableName: TABLE_NAME,
            Key: { trainerId: trainer.trainerId },
            UpdateExpression: 'SET plans = :plans',
            ExpressionAttributeValues: {
              ':plans': fixedPlans
            }
          }).promise();
          
          fixedCount++;
        }
      }
    }
    
    console.log(`✅ Fixed ${fixedCount} trainers with format issues`);
    
  } catch (error) {
    console.error('❌ Error fixing plans format:', error);
    process.exit(1);
  }
}

// Run the fix
fixPlansFormat().then(() => {
  console.log('🎉 Plans format cleanup completed!');
  process.exit(0);
});
