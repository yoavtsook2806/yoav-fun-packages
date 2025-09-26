# 🔄 Database Migration Scripts

This folder contains scripts to help with database schema changes during development.

## 📋 Available Scripts

### 1. Generic Migration Script
`generic-migration.js` - Universal migration tool for any DynamoDB table

### 2. Specific Migration Scripts
- `migrate-coaches.js` - Coach table migration (example)

## 🚀 Usage Examples

### Add new fields to existing records
```bash
# Add isAdmin field to all coaches
node scripts/generic-migration.js coaches add-fields '{"isAdmin": false}'

# Add plans array to all trainers  
node scripts/generic-migration.js trainers add-fields '{"plans": []}'

# Add multiple fields
node scripts/generic-migration.js exercises add-fields '{"isAdminExercise": false, "originalExerciseId": null}'
```

### Clean recreate with new schema
```bash
# Recreate all coaches with new fields (creates backup first)
node scripts/generic-migration.js coaches clean-recreate '{"isAdmin": false}'

# Recreate trainers with plans array
node scripts/generic-migration.js trainers clean-recreate '{"plans": []}'
```

### Add specific records
```bash
# Add admin coach
node scripts/generic-migration.js coaches add-records '[{"coachId":"admin-123","name":"Admin User","email":"admin@test.com","isAdmin":true}]'
```

### Backup and delete
```bash
# Create backup of table
node scripts/generic-migration.js coaches backup

# Delete all records (creates backup first)
node scripts/generic-migration.js coaches delete-all
```

### Environment support
```bash
# Run on production (default is dev)
node scripts/generic-migration.js coaches add-fields '{"isAdmin": false}' --env=prod
```

## 🛡️ Safety Features

- **Automatic backups** before destructive operations
- **Validation** of table names and operations
- **Dry-run support** (coming soon)
- **Progress logging** for large operations

## 📊 Available Tables

- `coaches` - Coach profiles and authentication
- `trainers` - Trainee/athlete profiles  
- `exercises` - Exercise definitions
- `plans` - Training plan templates
- `progress` - Training progress tracking
- `plan-assignments` - Plan-to-trainer assignments

## 🔧 Common Migration Patterns

### Adding optional fields
```bash
# Always provide default values for new optional fields
node scripts/generic-migration.js <table> add-fields '{"newField": "defaultValue"}'
```

### Schema restructuring  
```bash
# Use clean-recreate for major schema changes
node scripts/generic-migration.js <table> clean-recreate '{"newStructure": {}}'
```

### Data cleanup
```bash
# Backup first, then delete problematic records
node scripts/generic-migration.js <table> backup
# Then manually clean the backup file and restore
```

## ⚠️ Important Notes

1. **Always backup before migrations** - The script does this automatically for destructive operations
2. **Test on dev first** - Never run migrations directly on prod
3. **Monitor AWS costs** - Large table scans can be expensive
4. **Check table structure** - Ensure you know the primary key structure
5. **Validate results** - Always check the DynamoDB console after migrations

## 🎯 Future Enhancements

- [ ] Dry-run mode
- [ ] Batch operations for large tables  
- [ ] Custom transform functions
- [ ] Migration rollback support
- [ ] Schema validation
- [ ] Progress bars for large operations
