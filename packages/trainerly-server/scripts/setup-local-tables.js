const { DynamoDBClient, CreateTableCommand, ListTablesCommand } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({
  endpoint: 'http://localhost:8000',
  region: 'local',
  credentials: {
    accessKeyId: 'dummy',
    secretAccessKey: 'dummy'
  }
});

const tables = [
  {
    TableName: 'matan-trainings-server-local-training-plans',
    KeySchema: [
      { AttributeName: 'version', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'version', AttributeType: 'S' }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  },
  {
    TableName: 'matan-trainings-server-local-user-profiles',
    KeySchema: [
      { AttributeName: 'userId', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'userId', AttributeType: 'S' }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  },
  {
    TableName: 'matan-trainings-server-local-exercise-data',
    KeySchema: [
      { AttributeName: 'userId', KeyType: 'HASH' },
      { AttributeName: 'timestamp', KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'userId', AttributeType: 'S' },
      { AttributeName: 'timestamp', AttributeType: 'S' }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  }
];

async function setupTables() {
  try {
    console.log('🔍 Checking existing tables...');
    const existingTables = await client.send(new ListTablesCommand({}));
    
    for (const table of tables) {
      if (existingTables.TableNames?.includes(table.TableName)) {
        console.log(`✅ Table ${table.TableName} already exists`);
      } else {
        console.log(`🆕 Creating table ${table.TableName}...`);
        await client.send(new CreateTableCommand(table));
        console.log(`✅ Created table ${table.TableName}`);
      }
    }
    
    console.log('🎉 Local DynamoDB tables setup complete!');
  } catch (error) {
    console.error('❌ Error setting up tables:', error);
    process.exit(1);
  }
}

setupTables();
