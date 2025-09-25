# Matan Trainings Server - AWS Lambda

A serverless API for the Matan Trainings app, built with AWS Lambda and DynamoDB.

## 🚀 Quick Setup Guide

### Prerequisites
1. **AWS Account** (free tier is enough to start)
2. **Node.js 18+** and **yarn**
3. **AWS CLI** configured

### Step 1: Install Dependencies
```bash
cd packages/matan-trainings-server
yarn install
```

### Step 2: Configure AWS CLI
```bash
# Install AWS CLI if not already installed
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /

# Configure AWS credentials
aws configure
```

You'll need:
- **AWS Access Key ID** (from AWS Console)
- **AWS Secret Access Key** (from AWS Console)  
- **Default region** (e.g., `us-east-1`)
- **Output format** (just press enter for default)

### Step 3: Install Serverless Framework
```bash
# Install globally
npm install -g serverless

# Or use yarn
yarn global add serverless
```

### Step 4: Deploy to AWS
```bash
# Deploy to development environment
yarn deploy:dev

# Or deploy to production
yarn deploy:prod
```

### Step 5: Test Your API
After deployment, you'll get API endpoints like:
```
https://abc123.execute-api.us-east-1.amazonaws.com/dev/health
https://abc123.execute-api.us-east-1.amazonaws.com/dev/trainings/latest
https://abc123.execute-api.us-east-1.amazonaws.com/dev/user/exercise-data
```

## 🧪 Local Development

### Start Local Server
```bash
yarn dev
```
Your API will be available at `http://localhost:3000`

### Test Locally
```bash
# Health check
curl http://localhost:3000/health

# Get training plans
curl http://localhost:3000/trainings/latest

# Save exercise data
curl -X POST http://localhost:3000/user/exercise-data \
  -H "Content-Type: application/json" \
  -d '{
    "exerciseData": {
      "userId": "user123",
      "exerciseName": "Push Up",
      "trainingType": "חזה",
      "date": "2025-01-15",
      "repeats": 10,
      "restTime": 60,
      "completed": true
    }
  }'
```

## 🗄️ AWS Resources Created

### DynamoDB Tables (NoSQL Database):
- `matan-trainings-server-dev-training-plans`
- `matan-trainings-server-dev-user-profiles` 
- `matan-trainings-server-dev-exercise-data`

### Lambda Functions:
- `health` - Health check endpoint
- `getTrainingPlans` - Get training plans
- `saveExerciseData` - Save exercise data
- `getUserData` - Get user data

### API Gateway:
- RESTful API with CORS enabled
- Automatic scaling
- Pay-per-request pricing

## 💰 Cost Estimation (10,000 users)

### DynamoDB:
- **Free tier**: 25 GB storage, 25 read/write capacity units
- **After free tier**: ~$1-5/month for 10k users

### Lambda:
- **Free tier**: 1M requests/month, 400,000 GB-seconds
- **After free tier**: ~$0.20 per 1M requests

### API Gateway:
- **Free tier**: 1M API calls/month
- **After free tier**: ~$3.50 per 1M requests

**Total estimated cost for 10k active users: $5-15/month**

## 📡 API Endpoints

### `GET /health`
Health check endpoint.

### `GET /trainings/latest?currentVersion=3.6`
Get training plans newer than specified version.

### `POST /user/exercise-data`
Save exercise completion data.

### `GET /user/exercise-data?userId=user123&fromDate=2025-01-01`
Get user profile and exercise data.

## 🔧 Environment Configuration

The app automatically uses different environments:
- **Development**: `yarn deploy:dev`
- **Production**: `yarn deploy:prod`

Each environment has its own DynamoDB tables and Lambda functions.

## 📊 Monitoring & Logs

### View Logs:
```bash
# View function logs
yarn logs

# Or specific function
serverless logs -f health --stage dev
```

### AWS Console:
- **CloudWatch**: View logs and metrics
- **DynamoDB**: View and edit data
- **Lambda**: Monitor function performance
- **API Gateway**: View API usage

## 🔄 Data Management

### Populate Training Plans
You'll need to add your training plans to DynamoDB. You can:

1. **Use AWS Console** (DynamoDB > Tables > training-plans)
2. **Create a migration script** (recommended)
3. **Use the API** to POST training plans

### Backup Strategy
- DynamoDB has **Point-in-time recovery** (enable in AWS Console)
- **On-demand backups** available
- **Cross-region replication** for high availability

## 🚨 Important Security Notes

### Current Setup (Development):
- ✅ CORS enabled for all origins
- ✅ Input validation with Zod
- ⚠️  No authentication (add later)

### For Production, Add:
- **API Keys** or **JWT authentication**
- **Rate limiting**
- **Input sanitization**
- **Error monitoring** (Sentry, etc.)

## 📱 Connect to Your Frontend

Update your `serverService.ts` in the frontend to use the real API:

```typescript
// Replace local data calls with:
const API_BASE_URL = 'https://your-api-id.execute-api.us-east-1.amazonaws.com/prod';

export const fetchNewTrainings = async (currentVersion?: string) => {
  const url = currentVersion 
    ? `${API_BASE_URL}/trainings/latest?currentVersion=${currentVersion}`
    : `${API_BASE_URL}/trainings/latest`;
    
  const response = await fetch(url);
  return response.json();
};
```

## 🎯 Next Steps

1. **Deploy the server** to AWS
2. **Populate training plans** in DynamoDB
3. **Update frontend** to use real API
4. **Test end-to-end** functionality
5. **Add authentication** when ready
6. **Set up monitoring** and alerts

## 🆘 Troubleshooting

### Common Issues:
- **AWS credentials not configured**: Run `aws configure`
- **Permission denied**: Check IAM permissions
- **Table not found**: Make sure deployment completed
- **CORS errors**: Check API Gateway CORS settings

### Get Help:
```bash
# Check AWS credentials
aws sts get-caller-identity

# Check deployed resources
serverless info --stage dev

# Remove everything (if needed)
serverless remove --stage dev
```