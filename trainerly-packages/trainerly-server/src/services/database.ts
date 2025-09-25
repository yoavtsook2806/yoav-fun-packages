import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  GetCommand, 
  PutCommand, 
  QueryCommand, 
  ScanCommand,
  UpdateCommand,
  DeleteCommand
} from '@aws-sdk/lib-dynamodb';
import { ExerciseCompletionData, UserProfile, TrainingPlan } from '../types';

/**
 * AWS DynamoDB database service
 * Simple NoSQL operations for JSON data
 */
export class DatabaseService {
  private client: DynamoDBDocumentClient;
  private tablePrefix: string;

  constructor() {
    // Configure DynamoDB client for local or AWS
    const isLocal = process.env.IS_LOCAL === 'true';
    const dynamoConfig: any = {
      region: process.env.AWS_REGION || 'eu-central-1'
    };
    
    // Use local DynamoDB endpoint if running locally
    if (isLocal && process.env.DYNAMODB_ENDPOINT) {
      dynamoConfig.endpoint = process.env.DYNAMODB_ENDPOINT;
      dynamoConfig.credentials = {
        accessKeyId: 'dummy',
        secretAccessKey: 'dummy'
      };
    }
    
    const dynamoClient = new DynamoDBClient(dynamoConfig);
    this.client = DynamoDBDocumentClient.from(dynamoClient);
    this.tablePrefix = process.env.DYNAMODB_TABLE_PREFIX || 'matan-trainings-server-dev';
    
    console.log(`🗄️  Database configured for ${isLocal ? 'LOCAL' : 'AWS'} environment`);
    console.log(`📋 Table prefix: ${this.tablePrefix}`);
  }

  private getTableName(table: string): string {
    return `${this.tablePrefix}-${table}`;
  }

  // Training Plans
  async getTrainingPlans(): Promise<TrainingPlan[]> {
    try {
      const command = new ScanCommand({
        TableName: this.getTableName('training-plans')
      });
      
      const result = await this.client.send(command);
      return result.Items as TrainingPlan[] || [];
    } catch (error) {
      console.error('Error getting training plans:', error);
      return [];
    }
  }

  async saveTrainingPlan(plan: TrainingPlan): Promise<boolean> {
    try {
      const command = new PutCommand({
        TableName: this.getTableName('training-plans'),
        Item: plan
      });
      
      await this.client.send(command);
      return true;
    } catch (error) {
      console.error('Error saving training plan:', error);
      return false;
    }
  }

  async saveTrainingPlans(plans: TrainingPlan[]): Promise<boolean> {
    try {
      // Save each plan individually (DynamoDB doesn't have batch put for different items)
      const promises = plans.map(plan => this.saveTrainingPlan(plan));
      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error('Error saving training plans:', error);
      return false;
    }
  }

  // User Profiles
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const command = new GetCommand({
        TableName: this.getTableName('user-profiles'),
        Key: { userId }
      });
      
      const result = await this.client.send(command);
      return result.Item as UserProfile || null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  async saveUserProfile(profile: UserProfile): Promise<boolean> {
    try {
      const command = new PutCommand({
        TableName: this.getTableName('user-profiles'),
        Item: profile
      });
      
      await this.client.send(command);
      return true;
    } catch (error) {
      console.error('Error saving user profile:', error);
      return false;
    }
  }

  // Exercise Data
  async getUserExerciseData(userId: string, fromDate?: string, toDate?: string): Promise<ExerciseCompletionData[]> {
    try {
      const command = new QueryCommand({
        TableName: this.getTableName('exercise-data'),
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        },
        ScanIndexForward: false, // Sort by timestamp descending (newest first)
        Limit: 1000 // Limit to prevent huge responses
      });
      
      const result = await this.client.send(command);
      let data = result.Items as ExerciseCompletionData[] || [];
      
      // Filter by date range if provided
      if (fromDate || toDate) {
        data = data.filter(item => {
          const itemDate = new Date(item.date);
          const from = fromDate ? new Date(fromDate) : new Date(0);
          const to = toDate ? new Date(toDate) : new Date();
          return itemDate >= from && itemDate <= to;
        });
      }
      
      return data;
    } catch (error) {
      console.error('Error getting user exercise data:', error);
      return [];
    }
  }

  async saveExerciseData(exerciseData: ExerciseCompletionData): Promise<boolean> {
    try {
      const userId = exerciseData.userId;
      
      // Ensure timestamp is set
      if (!exerciseData.timestamp) {
        exerciseData.timestamp = new Date().toISOString();
      }
      
      const command = new PutCommand({
        TableName: this.getTableName('exercise-data'),
        Item: exerciseData
      });
      
      await this.client.send(command);
      
      // Update user profile last active time
      await this.updateUserLastActive(userId);
      
      return true;
    } catch (error) {
      console.error('Error saving exercise data:', error);
      return false;
    }
  }

  private async updateUserLastActive(userId: string): Promise<void> {
    try {
      // Get or create user profile
      let profile = await this.getUserProfile(userId);
      if (!profile) {
        profile = {
          userId,
          createdAt: new Date().toISOString(),
          lastActive: new Date().toISOString()
        };
      } else {
        profile.lastActive = new Date().toISOString();
      }
      
      await this.saveUserProfile(profile);
    } catch (error) {
      console.error('Error updating user last active:', error);
    }
  }

  // Utility methods
  async getAllUsers(): Promise<string[]> {
    try {
      const command = new ScanCommand({
        TableName: this.getTableName('user-profiles'),
        ProjectionExpression: 'userId'
      });
      
      const result = await this.client.send(command);
      return result.Items?.map(item => item.userId) || [];
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  // Clear all data from all tables
  async clearAllDB(): Promise<boolean> {
    try {
      console.log('🗑️  Starting database cleanup...');
      
      const tables = [
        // New tables
        { name: 'coaches', key: 'coachId' },
        { name: 'trainers', key: 'trainerId' },
        { name: 'exercises', key: 'exerciseId' },
        { name: 'plans', key: 'planId' },
        { name: 'plan-assignments', key: 'assignmentId' },
        { name: 'progress', key: 'progressId' },
        // Legacy tables
        { name: 'training-plans', key: 'version' },
        { name: 'user-profiles', key: 'userId' },
        { name: 'exercise-data', keys: ['userId', 'timestamp'] }
      ];
      let totalDeleted = 0;
      
      for (const table of tables) {
        const tableName = this.getTableName(table.name);
        console.log(`🧹 Clearing table: ${tableName}`);
        
        try {
          // Scan all items
          const scanCommand = new ScanCommand({
            TableName: tableName
          });
          
          const result = await this.client.send(scanCommand);
          const items = result.Items || [];
          
          // Delete each item
          for (const item of items) {
            let key: any = {};
            
            // Build key structure
            if (table.keys) {
              // Composite key (like exercise-data)
              for (const keyName of table.keys) {
                key[keyName] = item[keyName];
              }
            } else {
              // Single key
              key[table.key] = item[table.key];
            }
            
            const deleteCommand = new DeleteCommand({
              TableName: tableName,
              Key: key
            });
            
            await this.client.send(deleteCommand);
            totalDeleted++;
          }
          
          console.log(`✅ Cleared ${items.length} items from ${tableName}`);
        } catch (tableError: any) {
          if (tableError.name === 'ResourceNotFoundException') {
            console.log(`ℹ️  Table ${tableName} does not exist (skipping)`);
          } else {
            console.error(`❌ Error clearing table ${tableName}:`, tableError);
          }
        }
      }
      
      console.log(`🎉 Database cleanup complete! Deleted ${totalDeleted} total items.`);
      return true;
    } catch (error) {
      console.error('❌ Error clearing database:', error);
      return false;
    }
  }

  // Coach management methods
  async saveCoach(coach: any): Promise<boolean> {
    try {
      const command = new PutCommand({
        TableName: this.getTableName('coaches'),
        Item: coach
      });
      
      await this.client.send(command);
      console.log(`✅ Coach ${coach.coachId} saved successfully`);
      return true;
    } catch (error) {
      console.error('❌ Error saving coach:', error);
      return false;
    }
  }

  async getCoach(coachId: string): Promise<any | null> {
    try {
      const command = new GetCommand({
        TableName: this.getTableName('coaches'),
        Key: { coachId }
      });
      
      const result = await this.client.send(command);
      return result.Item || null;
    } catch (error) {
      console.error('❌ Error getting coach:', error);
      return null;
    }
  }

  async getCoachByEmail(email: string): Promise<any | null> {
    try {
      const command = new ScanCommand({
        TableName: this.getTableName('coaches'),
        FilterExpression: 'email = :email',
        ExpressionAttributeValues: { ':email': email }
      });
      
      const result = await this.client.send(command);
      return result.Items?.[0] || null;
    } catch (error) {
      console.error('❌ Error getting coach by email:', error);
      return null;
    }
  }

  async getCoachByNickname(nickname: string): Promise<any | null> {
    try {
      const command = new ScanCommand({
        TableName: this.getTableName('coaches'),
        FilterExpression: 'nickname = :nickname',
        ExpressionAttributeValues: { ':nickname': nickname }
      });
      
      const result = await this.client.send(command);
      return result.Items?.[0] || null;
    } catch (error) {
      console.error('❌ Error getting coach by nickname:', error);
      return null;
    }
  }

  async updateCoach(coach: any): Promise<boolean> {
    try {
      const command = new PutCommand({
        TableName: this.getTableName('coaches'),
        Item: coach
      });
      
      await this.client.send(command);
      console.log(`✅ Coach ${coach.coachId} updated successfully`);
      return true;
    } catch (error) {
      console.error('❌ Error updating coach:', error);
      return false;
    }
  }

  // Trainer management methods
  async saveTrainer(trainer: any): Promise<boolean> {
    try {
      const command = new PutCommand({
        TableName: this.getTableName('trainers'),
        Item: trainer
      });
      
      await this.client.send(command);
      console.log(`✅ Trainer ${trainer.trainerId} saved successfully`);
      return true;
    } catch (error) {
      console.error('❌ Error saving trainer:', error);
      return false;
    }
  }

  async getTrainer(trainerId: string): Promise<any | null> {
    try {
      const command = new GetCommand({
        TableName: this.getTableName('trainers'),
        Key: { trainerId }
      });
      
      const result = await this.client.send(command);
      return result.Item || null;
    } catch (error) {
      console.error('❌ Error getting trainer:', error);
      return null;
    }
  }

  async getTrainersByCoach(coachId: string): Promise<any[]> {
    try {
      const command = new ScanCommand({
        TableName: this.getTableName('trainers'),
        FilterExpression: 'coachId = :coachId',
        ExpressionAttributeValues: { ':coachId': coachId }
      });
      
      const result = await this.client.send(command);
      return result.Items || [];
    } catch (error) {
      console.error('❌ Error getting trainers by coach:', error);
      return [];
    }
  }

  async getTrainerByCode(trainerCode: string): Promise<any | null> {
    try {
      const command = new ScanCommand({
        TableName: this.getTableName('trainers'),
        FilterExpression: 'trainerCode = :trainerCode',
        ExpressionAttributeValues: { ':trainerCode': trainerCode }
      });
      
      const result = await this.client.send(command);
      return result.Items?.[0] || null;
    } catch (error) {
      console.error('❌ Error getting trainer by code:', error);
      return null;
    }
  }

  // Exercise management methods
  async saveExercise(exercise: any): Promise<boolean> {
    try {
      const command = new PutCommand({
        TableName: this.getTableName('exercises'),
        Item: exercise
      });
      
      await this.client.send(command);
      console.log(`✅ Exercise ${exercise.exerciseId} saved successfully`);
      return true;
    } catch (error) {
      console.error('❌ Error saving exercise:', error);
      return false;
    }
  }

  async getExercisesByCoach(coachId: string): Promise<any[]> {
    try {
      const command = new ScanCommand({
        TableName: this.getTableName('exercises'),
        FilterExpression: 'coachId = :coachId',
        ExpressionAttributeValues: { ':coachId': coachId }
      });
      
      const result = await this.client.send(command);
      return result.Items || [];
    } catch (error) {
      console.error('❌ Error getting exercises by coach:', error);
      return [];
    }
  }

  // Training plan management methods (updated for new structure)
  async savePlan(plan: any): Promise<boolean> {
    try {
      const command = new PutCommand({
        TableName: this.getTableName('plans'),
        Item: plan
      });
      
      await this.client.send(command);
      console.log(`✅ Plan ${plan.planId} saved successfully`);
      return true;
    } catch (error) {
      console.error('❌ Error saving plan:', error);
      return false;
    }
  }

  async getPlan(planId: string): Promise<any | null> {
    try {
      const command = new GetCommand({
        TableName: this.getTableName('plans'),
        Key: { planId }
      });
      
      const result = await this.client.send(command);
      return result.Item || null;
    } catch (error) {
      console.error('❌ Error getting plan:', error);
      return null;
    }
  }

  async getPlansByCoach(coachId: string): Promise<any[]> {
    try {
      const command = new ScanCommand({
        TableName: this.getTableName('plans'),
        FilterExpression: 'coachId = :coachId',
        ExpressionAttributeValues: { ':coachId': coachId }
      });
      
      const result = await this.client.send(command);
      return result.Items || [];
    } catch (error) {
      console.error('❌ Error getting plans by coach:', error);
      return [];
    }
  }

  async getPlansByTrainer(trainerId: string): Promise<any[]> {
    try {
      // First get plan assignments for this trainer
      const assignmentsCommand = new ScanCommand({
        TableName: this.getTableName('plan-assignments'),
        FilterExpression: 'trainerId = :trainerId AND active = :active',
        ExpressionAttributeValues: { 
          ':trainerId': trainerId,
          ':active': true 
        }
      });
      
      const assignmentsResult = await this.client.send(assignmentsCommand);
      const assignments = assignmentsResult.Items || [];
      
      if (assignments.length === 0) {
        return [];
      }

      // Get the actual plans
      const plans = [];
      for (const assignment of assignments) {
        const planCommand = new GetCommand({
          TableName: this.getTableName('plans'),
          Key: { planId: assignment.planId }
        });
        
        const planResult = await this.client.send(planCommand);
        if (planResult.Item) {
          plans.push(planResult.Item);
        }
      }
      
      return plans;
    } catch (error) {
      console.error('❌ Error getting plans by trainer:', error);
      return [];
    }
  }

  // Plan assignment methods
  async savePlanAssignment(assignment: any): Promise<boolean> {
    try {
      const command = new PutCommand({
        TableName: this.getTableName('plan-assignments'),
        Item: assignment
      });
      
      await this.client.send(command);
      console.log(`✅ Plan assignment ${assignment.assignmentId} saved successfully`);
      return true;
    } catch (error) {
      console.error('❌ Error saving plan assignment:', error);
      return false;
    }
  }

  // Progress tracking methods
  async saveProgress(progress: any): Promise<boolean> {
    try {
      const command = new PutCommand({
        TableName: this.getTableName('progress'),
        Item: progress
      });
      
      await this.client.send(command);
      console.log(`✅ Progress ${progress.progressId} saved successfully`);
      return true;
    } catch (error) {
      console.error('❌ Error saving progress:', error);
      return false;
    }
  }

  async getProgressByTrainer(trainerId: string, filters?: any): Promise<any[]> {
    try {
      let filterExpression = 'trainerId = :trainerId';
      const expressionAttributeValues: any = { ':trainerId': trainerId };

      if (filters?.planId) {
        filterExpression += ' AND planId = :planId';
        expressionAttributeValues[':planId'] = filters.planId;
      }

      if (filters?.trainingId) {
        filterExpression += ' AND trainingId = :trainingId';
        expressionAttributeValues[':trainingId'] = filters.trainingId;
      }

      const command = new ScanCommand({
        TableName: this.getTableName('progress'),
        FilterExpression: filterExpression,
        ExpressionAttributeValues: expressionAttributeValues
      });
      
      const result = await this.client.send(command);
      return result.Items || [];
    } catch (error) {
      console.error('❌ Error getting progress by trainer:', error);
      return [];
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      // Try to scan the coaches table with limit 1
      const command = new ScanCommand({
        TableName: this.getTableName('coaches'),
        Limit: 1
      });
      
      await this.client.send(command);
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }
}

export const db = new DatabaseService();