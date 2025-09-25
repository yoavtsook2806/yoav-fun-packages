const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, DeleteCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

// Configure AWS SDK
const client = new DynamoDBClient({
  region: 'eu-central-1',
  // Add your AWS credentials here if needed
});

const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = 'matan-trainings-server-dev-coaches';

async function migrateCoaches() {
  console.log('🔄 Starting coach migration...');
  
  try {
    // Step 1: Get all existing coaches
    console.log('📖 Reading existing coaches...');
    const scanResult = await docClient.send(new ScanCommand({
      TableName: TABLE_NAME
    }));
    
    const existingCoaches = scanResult.Items || [];
    console.log(`Found ${existingCoaches.length} existing coaches`);
    
    // Step 2: Delete all existing coaches
    console.log('🗑️ Deleting existing coaches...');
    for (const coach of existingCoaches) {
      await docClient.send(new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          coachId: coach.coachId
        }
      }));
      console.log(`   ✅ Deleted coach: ${coach.name} (${coach.email})`);
    }
    
    // Step 3: Recreate coaches with new schema
    console.log('🔄 Recreating coaches with new schema...');
    for (const oldCoach of existingCoaches) {
      const newCoach = {
        ...oldCoach,
        isAdmin: false, // Default to false
        // Ensure all required fields exist
        valid: oldCoach.valid !== undefined ? oldCoach.valid : true,
        updatedAt: new Date().toISOString()
      };
      
      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: newCoach
      }));
      console.log(`   ✅ Recreated coach: ${newCoach.name} (${newCoach.email}) - isAdmin: ${newCoach.isAdmin}`);
    }
    
    // Step 4: Create admin coach
    console.log('👑 Creating admin coach...');
    const adminCoach = {
      coachId: '3c7dd167-1864-4f1e-8a17-922477d563c9', // Use the existing ID
      name: 'Yoav Admin',
      email: 'yoavadmin@test.com',
      nickname: 'yoavadmin',
      passwordHash: 'temp-hash-for-debugging',
      valid: true,
      isAdmin: true, // Make this coach admin
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: adminCoach
    }));
    console.log(`   ✅ Created admin coach: ${adminCoach.name} (${adminCoach.email}) - isAdmin: ${adminCoach.isAdmin}`);
    
    console.log('🎉 Migration completed successfully!');
    console.log(`📊 Total coaches: ${existingCoaches.length + 1} (${existingCoaches.length} migrated + 1 admin)`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateCoaches();
