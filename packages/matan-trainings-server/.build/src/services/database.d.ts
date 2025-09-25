import { ExerciseCompletionData, UserProfile, TrainingPlan } from '../types';
/**
 * AWS DynamoDB database service
 * Simple NoSQL operations for JSON data
 */
export declare class DatabaseService {
    private client;
    private tablePrefix;
    constructor();
    private getTableName;
    getTrainingPlans(): Promise<TrainingPlan[]>;
    saveTrainingPlan(plan: TrainingPlan): Promise<boolean>;
    saveTrainingPlans(plans: TrainingPlan[]): Promise<boolean>;
    getUserProfile(userId: string): Promise<UserProfile | null>;
    saveUserProfile(profile: UserProfile): Promise<boolean>;
    getUserExerciseData(userId: string, fromDate?: string, toDate?: string): Promise<ExerciseCompletionData[]>;
    saveExerciseData(exerciseData: ExerciseCompletionData): Promise<boolean>;
    private updateUserLastActive;
    getAllUsers(): Promise<string[]>;
    clearAllDB(): Promise<boolean>;
    saveCoach(coach: any): Promise<boolean>;
    getCoach(coachId: string): Promise<any | null>;
    getCoachByEmail(email: string): Promise<any | null>;
    getCoachByNickname(nickname: string): Promise<any | null>;
    saveTrainer(trainer: any): Promise<boolean>;
    getTrainer(trainerId: string): Promise<any | null>;
    getTrainersByCoach(coachId: string): Promise<any[]>;
    getTrainerByCode(trainerCode: string): Promise<any | null>;
    saveExercise(exercise: any): Promise<boolean>;
    getExercisesByCoach(coachId: string): Promise<any[]>;
    savePlan(plan: any): Promise<boolean>;
    getPlansByCoach(coachId: string): Promise<any[]>;
    getPlansByTrainer(trainerId: string): Promise<any[]>;
    savePlanAssignment(assignment: any): Promise<boolean>;
    saveProgress(progress: any): Promise<boolean>;
    getProgressByTrainer(trainerId: string, filters?: any): Promise<any[]>;
    healthCheck(): Promise<boolean>;
}
export declare const db: DatabaseService;
//# sourceMappingURL=database.d.ts.map