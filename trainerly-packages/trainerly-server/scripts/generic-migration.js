const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, DeleteCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

// Configure AWS SDK
const client = new DynamoDBClient({
  region: 'eu-central-1',
});

const docClient = DynamoDBDocumentClient.from(client);

/**
 * Generic DynamoDB table migration script
 * 
 * Usage examples:
 * 
 * 1. Add new fields with default values:
 *    node scripts/generic-migration.js coaches add-fields '{"isAdmin": false, "newField": "defaultValue"}'
 * 
 * 2. Transform existing data:
 *    node scripts/generic-migration.js trainers transform-data '(item) => ({ ...item, fullName: item.firstName + " " + item.lastName })'
 * 
 * 3. Clean recreate (delete all and recreate with new schema):
 *    node scripts/generic-migration.js exercises clean-recreate '{"newField": "defaultValue"}'
 * 
 * 4. Add specific records:
 *    node scripts/generic-migration.js coaches add-records '[{"coachId": "123", "name": "Admin", "isAdmin": true}]'
 */

// Available table names (without environment prefix) and their primary keys
const AVAILABLE_TABLES = {
  'coaches': { 
    name: 'matan-trainings-server-dev-coaches',
    primaryKey: 'coachId'
  },
  'trainers': { 
    name: 'matan-trainings-server-dev-trainers',
    primaryKey: 'trainerId'
  },
  'exercises': { 
    name: 'matan-trainings-server-dev-exercises',
    primaryKey: 'exerciseId'
  },
  'plans': { 
    name: 'matan-trainings-server-dev-plans',
    primaryKey: 'planId'
  },
  'progress': { 
    name: 'matan-trainings-server-dev-progress',
    primaryKey: 'progressId'
  },
  'plan-assignments': { 
    name: 'matan-trainings-server-dev-plan-assignments',
    primaryKey: 'assignmentId'
  }
};

// Get table info with environment prefix
function getTableInfo(tableName, environment = 'dev') {
  const envPrefix = `matan-trainings-server-${environment}-`;
  
  if (tableName.startsWith(envPrefix)) {
    // Find table info by full name
    const tableKey = Object.keys(AVAILABLE_TABLES).find(key => 
      AVAILABLE_TABLES[key].name === tableName
    );
    return tableKey ? AVAILABLE_TABLES[tableKey] : { name: tableName, primaryKey: 'id' };
  }
  
  return AVAILABLE_TABLES[tableName] || { 
    name: `${envPrefix}${tableName}`, 
    primaryKey: `${tableName}Id` 
  };
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log(`
📋 Generic DynamoDB Migration Script

Usage: node scripts/generic-migration.js <table> <operation> [data] [options]

Tables: ${Object.keys(AVAILABLE_TABLES).join(', ')}

Operations:
  add-fields <fieldsJson>     - Add new fields to all existing records
  transform-data <function>   - Transform existing data using a function
  clean-recreate [fieldsJson] - Delete all records and recreate with new schema
  add-records <recordsJson>   - Add specific records to the table
  delete-all                  - Delete all records from table
  backup                      - Create backup of all records

Examples:
  node scripts/generic-migration.js coaches add-fields '{"isAdmin": false}'
  node scripts/generic-migration.js trainers clean-recreate '{"plans": []}'
  node scripts/generic-migration.js coaches add-records '[{"coachId":"123","name":"Admin","isAdmin":true}]'
`);
    process.exit(1);
  }

  const [table, operation, data, ...options] = args;
  
  return {
    table,
    operation,
    data: data ? JSON.parse(data) : null,
    options: options.reduce((acc, opt) => {
      const [key, value] = opt.split('=');
      acc[key.replace('--', '')] = value || true;
      return acc;
    }, {})
  };
}

// Get all items from table
async function getAllItems(tableName) {
  console.log(`📖 Reading all items from ${tableName}...`);
  
  let items = [];
  let lastEvaluatedKey = null;
  
  do {
    const params = {
      TableName: tableName,
      ...(lastEvaluatedKey && { ExclusiveStartKey: lastEvaluatedKey })
    };
    
    const result = await docClient.send(new ScanCommand(params));
    items = items.concat(result.Items || []);
    lastEvaluatedKey = result.LastEvaluatedKey;
    
  } while (lastEvaluatedKey);
  
  console.log(`   Found ${items.length} items`);
  return items;
}

// Delete all items from table
async function deleteAllItems(tableName, items, keyField) {
  console.log(`🗑️ Deleting ${items.length} items from ${tableName}...`);
  
  for (const item of items) {
    const key = {};
    key[keyField] = item[keyField];
    
    await docClient.send(new DeleteCommand({
      TableName: tableName,
      Key: key
    }));
  }
  
  console.log(`   ✅ Deleted all items`);
}

// Put items back to table
async function putItems(tableName, items) {
  console.log(`📝 Writing ${items.length} items to ${tableName}...`);
  
  for (const item of items) {
    await docClient.send(new PutCommand({
      TableName: tableName,
      Item: item
    }));
  }
  
  console.log(`   ✅ Written all items`);
}

// Main migration function
async function migrate() {
  const { table, operation, data, options } = parseArgs();
  const tableInfo = getTableInfo(table, options.env);
  const tableName = tableInfo.name;
  const primaryKey = tableInfo.primaryKey;
  
  console.log(`🔄 Starting migration for table: ${tableName}`);
  console.log(`🔑 Primary key: ${primaryKey}`);
  console.log(`📋 Operation: ${operation}`);
  
  try {
    let items, updatedItems;
    
    switch (operation) {
      case 'add-fields':
        items = await getAllItems(tableName);
        updatedItems = items.map(item => ({
          ...item,
          ...data,
          updatedAt: new Date().toISOString()
        }));
        
        await deleteAllItems(tableName, items, primaryKey);
        await putItems(tableName, updatedItems);
        console.log(`✅ Added fields ${JSON.stringify(data)} to ${items.length} items`);
        break;
        
      case 'transform-data':
        items = await getAllItems(tableName);
        // Note: For security, this would need eval() which is dangerous
        // Better to define transform functions in the script itself
        console.log('❌ Transform-data operation requires custom implementation for security');
        break;
        
      case 'clean-recreate':
        items = await getAllItems(tableName);
        
        // Create backup first
        const backupFile = `backup-${table}-${Date.now()}.json`;
        require('fs').writeFileSync(backupFile, JSON.stringify(items, null, 2));
        console.log(`💾 Backup saved to: ${backupFile}`);
        
        updatedItems = items.map(item => ({
          ...item,
          ...(data || {}),
          updatedAt: new Date().toISOString()
        }));
        
        await deleteAllItems(tableName, items, primaryKey);
        await putItems(tableName, updatedItems);
        console.log(`✅ Clean recreated ${items.length} items with new schema`);
        break;
        
      case 'add-records':
        if (!Array.isArray(data)) {
          throw new Error('add-records requires an array of records');
        }
        await putItems(tableName, data);
        console.log(`✅ Added ${data.length} new records`);
        break;
        
      case 'delete-all':
        items = await getAllItems(tableName);
        if (items.length === 0) {
          console.log('📭 Table is already empty');
          break;
        }
        
        // Create backup first
        const deleteBackupFile = `backup-before-delete-${table}-${Date.now()}.json`;
        require('fs').writeFileSync(deleteBackupFile, JSON.stringify(items, null, 2));
        console.log(`💾 Backup saved to: ${deleteBackupFile}`);
        
        await deleteAllItems(tableName, items, primaryKey);
        console.log(`✅ Deleted all ${items.length} items`);
        break;
        
      case 'backup':
        items = await getAllItems(tableName);
        const backupFileName = `backup-${table}-${Date.now()}.json`;
        require('fs').writeFileSync(backupFileName, JSON.stringify(items, null, 2));
        console.log(`💾 Backup of ${items.length} items saved to: ${backupFileName}`);
        break;
        
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  migrate();
}

module.exports = {
  migrate,
  getAllItems,
  deleteAllItems,
  putItems,
  getTableInfo
};
