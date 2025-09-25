# Training Platform API Test Suite

This comprehensive test suite ensures the Training Platform API behaves correctly according to the OpenAPI specification and business requirements.

## Test Structure

### Unit Tests (`/api/`)
- **`coaches.test.ts`** - Coach authentication and management
- **`trainers.test.ts`** - Trainer creation and identification
- **`exercises.test.ts`** - Exercise library management
- **`plans.test.ts`** - Training plan creation and assignment

### Integration Tests (`/integration/`)
- **`complete-flow.test.ts`** - End-to-end workflow testing

## Test Coverage

### Authentication & Authorization
✅ **Nickname validation and normalization**
- Valid nicknames are accepted
- Invalid characters are rejected
- Reserved nicknames are blocked
- Case-insensitive uniqueness checking
- Proper normalization (spaces → underscores, lowercase)

✅ **Coach registration**
- All required fields validated
- Email uniqueness enforced
- Nickname uniqueness enforced
- Password hashing
- JWT token generation

✅ **Coach login**
- Email/password validation
- Password verification
- JWT token generation
- Invalid credentials handling

✅ **Trainer identification**
- Multiple identification methods (name + coach nickname, trainer code)
- Case-insensitive name matching
- Coach nickname lookup

### Data Management
✅ **Exercise Management**
- Hebrew exercise names supported
- Exercise metadata (link, note, short description)
- Muscle group categorization
- Coach-specific exercise libraries

✅ **Training Plan Management**
- Complex training plan structure
- Exercise prescriptions (sets, reps, rest times)
- Multiple trainings per plan
- Hebrew content preservation
- Plan assignment to trainers

✅ **Trainer Management**
- Trainer creation by coaches
- Automatic trainer code generation
- Trainer listing and retrieval

### Data Integrity
✅ **Hebrew Language Support**
- All Hebrew text preserved correctly
- Special characters and symbols supported
- Unicode handling throughout the system

✅ **Training Data Structure**
- Original v3.6 training plan format compatibility
- Exercise-prescription separation
- Proper data relationships

### Error Handling
✅ **Validation Errors**
- Missing required fields
- Invalid data formats
- Business rule violations

✅ **Not Found Errors**
- Non-existent resources
- Invalid IDs

✅ **Authentication Errors**
- Invalid credentials
- Missing tokens
- Expired sessions

## Running Tests

### All Tests
```bash
yarn test
```

### Watch Mode (Development)
```bash
yarn test:watch
```

### Coverage Report
```bash
yarn test:coverage
```

### CI Mode
```bash
yarn test:ci
```

## Test Data

### Sample Coach
```json
{
  "name": "מתן המאמן",
  "email": "matan@example.com",
  "nickname": "matan_coach",
  "password": "password123"
}
```

### Sample Trainer
```json
{
  "firstName": "יוסי",
  "lastName": "כהן",
  "email": "yossi@example.com"
}
```

### Sample Exercise
```json
{
  "name": "פרפר, מ. יד/מכונה",
  "link": "https://www.youtube.com/watch?v=example",
  "note": "מרפקים מעט מכופפים, חזה פתוח",
  "short": "פרפר",
  "muscleGroup": "chest"
}
```

### Sample Training Plan
```json
{
  "name": "תוכנית אימונים v3.6",
  "description": "תוכנית אימונים מקיפה",
  "trainings": [
    {
      "trainingId": "training-a",
      "name": "Training A",
      "order": 1,
      "exercises": [
        {
          "exerciseName": "לחיצת חזה, מ. יד, שיפוע 30*",
          "numberOfSets": 8,
          "minimumTimeToRest": 15,
          "maximumTimeToRest": 60,
          "minimumNumberOfRepeasts": 8,
          "maximumNumberOfRepeasts": 8
        }
      ]
    }
  ]
}
```

## API Behavior Verification

The test suite verifies that the API behaves exactly as specified in the OpenAPI specification:

1. **Correct HTTP status codes** for all scenarios
2. **Proper response formats** matching the schema
3. **Validation rules** enforced consistently
4. **Error messages** are clear and actionable
5. **Data relationships** maintained correctly
6. **Unicode/Hebrew support** throughout

## Custom Matchers

The test suite includes custom Jest matchers:

- `toBeValidUUID()` - Validates UUID format
- `toBeValidISODate()` - Validates ISO 8601 date format

## Mocking Strategy

- **DynamoDB operations** mocked with `aws-sdk-mock`
- **Password hashing** mocked for performance
- **JWT operations** mocked for testing
- **Network calls** avoided for unit tests

## Test Philosophy

These tests serve as:
1. **Living documentation** of API behavior
2. **Regression prevention** for future changes
3. **Specification compliance** verification
4. **Integration confidence** for client applications

By running these tests, you can be confident that the server behaves exactly as intended according to the OpenAPI specification.
