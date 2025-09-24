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
      
      const tables = ['training-plans', 'user-profiles', 'exercise-data'];
      let totalDeleted = 0;
      
      for (const table of tables) {
        const tableName = this.getTableName(table);
        console.log(`🧹 Clearing table: ${tableName}`);
        
        // Scan all items
        const scanCommand = new ScanCommand({
          TableName: tableName
        });
        
        const result = await this.client.send(scanCommand);
        const items = result.Items || [];
        
        // Delete each item
        for (const item of items) {
          let key: any = {};
          
          // Set the appropriate key based on table structure
          if (table === 'training-plans') {
            key = { version: item.version };
          } else if (table === 'user-profiles') {
            key = { userId: item.userId };
          } else if (table === 'exercise-data') {
            key = { userId: item.userId, timestamp: item.timestamp };
          }
          
          const deleteCommand = new DeleteCommand({
            TableName: tableName,
            Key: key
          });
          
          await this.client.send(deleteCommand);
          totalDeleted++;
        }
        
        console.log(`✅ Cleared ${items.length} items from ${tableName}`);
      }
      
      console.log(`🎉 Database cleanup complete! Deleted ${totalDeleted} total items.`);
      return true;
    } catch (error) {
      console.error('❌ Error clearing database:', error);
      return false;
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      // Try to scan the training plans table with limit 1
      const command = new ScanCommand({
        TableName: this.getTableName('training-plans'),
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