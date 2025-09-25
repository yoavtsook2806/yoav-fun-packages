#!/usr/bin/env node

const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({ region: 'eu-central-1' });
const dynamodb = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = 'matan-trainings-server-dev-trainers';

async function fixDuplicatePlans() {
  console.log('🔍 Scanning trainers table for duplicate plans...');
  
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
        // Remove duplicates while preserving order (last occurrence is kept)
        const originalPlans = trainer.plans;
        const uniquePlans = [...new Set(originalPlans)];
        
        if (originalPlans.length !== uniquePlans.length) {
          console.log(`🔧 Fixing trainer ${trainer.firstName} ${trainer.lastName}:`);
          console.log(`   Original plans: [${originalPlans.join(', ')}]`);
          console.log(`   Fixed plans: [${uniquePlans.join(', ')}]`);
          
          // Update the trainer
          await dynamodb.update({
            TableName: TABLE_NAME,
            Key: { trainerId: trainer.trainerId },
            UpdateExpression: 'SET plans = :plans',
            ExpressionAttributeValues: {
              ':plans': uniquePlans
            }
          }).promise();
          
          fixedCount++;
        }
      }
    }
    
    console.log(`✅ Fixed ${fixedCount} trainers with duplicate plans`);
    
  } catch (error) {
    console.error('❌ Error fixing duplicate plans:', error);
    process.exit(1);
  }
}

// Run the fix
fixDuplicatePlans().then(() => {
  console.log('🎉 Duplicate plans cleanup completed!');
  process.exit(0);
});
