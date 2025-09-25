export interface Coach {
    coachId: string;
    name: string;
    email: string;
    nickname: string;
    passwordHash: string;
    valid: boolean;
    phone?: string;
    age?: number;
    createdAt: string;
    updatedAt: string;
}
export interface Trainer {
    trainerId: string;
    coachId: string;
    firstName: string;
    lastName: string;
    email?: string;
    trainerCode?: string;
    createdAt: string;
}
export interface Exercise {
    exerciseId: string;
    coachId: string;
    name: string;
    link?: string;
    note?: string;
    short: string;
    muscleGroup?: 'legs' | 'back' | 'chest' | 'shoulders' | 'arms' | 'core' | 'full_body' | 'other';
    createdAt: string;
}
export interface PrescribedExercise {
    exerciseName: string;
    numberOfSets: number;
    minimumTimeToRest: number;
    maximumTimeToRest: number;
    minimumNumberOfRepeasts: number;
    maximumNumberOfRepeasts: number;
    prescriptionNote?: string;
}
export interface TrainingItem {
    trainingId: string;
    name: string;
    order: number;
    exercises: PrescribedExercise[];
}
export interface TrainingPlan {
    planId: string;
    coachId: string;
    name: string;
    description?: string;
    trainings: TrainingItem[];
    createdAt: string;
    updatedAt: string;
}
export interface PlanAssignment {
    assignmentId: string;
    trainerId: string;
    planId: string;
    assignedAt: string;
    active: boolean;
}
export interface SetResult {
    setIndex: number;
    repsDone?: number;
    timeSecDone?: number;
    weightKg?: number;
    rpe?: number;
    notes?: string;
}
export interface ExerciseProgressItem {
    exerciseId: string;
    results: SetResult[];
}
export interface TrainingProgress {
    progressId: string;
    trainerId: string;
    planId: string;
    trainingId: string;
    performedAt: string;
    exercises: ExerciseProgressItem[];
    createdAt: string;
}
export interface ExerciseCompletionData {
    userId: string;
    exerciseName: string;
    trainingType: string;
    date: string;
    weight?: number;
    repeats?: number;
    restTime: number;
    setsData?: {
        weight?: number;
        repeats?: number;
    }[];
    completed: boolean;
    timestamp: string;
}
export interface UserProfile {
    userId: string;
    createdAt: string;
    lastActive: string;
    preferences?: {
        defaultRestTime?: number;
        preferredWeights?: Record<string, number>;
    };
}
export interface ServerResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    timestamp: string;
}
export interface GetTrainingPlansRequest {
    currentVersion?: string;
}
export interface GetTrainingPlansResponse extends ServerResponse<TrainingPlan[]> {
}
export interface SaveExerciseDataRequest {
    exerciseData: ExerciseCompletionData;
}
export interface SaveExerciseDataResponse extends ServerResponse<{
    saved: boolean;
}> {
}
export interface GetUserDataRequest {
    userId: string;
    fromDate?: string;
    toDate?: string;
}
export interface GetUserDataResponse extends ServerResponse<{
    profile: UserProfile;
    exerciseData: ExerciseCompletionData[];
}> {
}
export interface AddTrainingPlanRequest {
    trainingId: string;
    trainingData: Record<string, Record<string, Exercise>>;
    name?: string;
}
export interface AddTrainingPlanResponse extends ServerResponse<{
    saved: boolean;
    version: string;
}> {
}
export interface NicknameCheckResponse {
    input: string;
    canonical: string;
    valid: boolean;
    available: boolean;
    reason?: string;
}
export interface CoachCreateRequest {
    name: string;
    email: string;
    password: string;
    nickname: string;
}
export interface CoachCreateResponse {
    coachId: string;
    token: string;
    valid: boolean;
    nickname: string;
}
export interface CoachLoginRequest {
    email: string;
    password: string;
}
export interface CoachLoginResponse {
    coachId: string;
    token: string;
    valid: boolean;
}
export interface CoachGetResponse {
    coachId: string;
    name: string;
    email: string;
    createdAt: string;
    valid: boolean;
    nickname: string;
    phone?: string;
    age?: number;
}
export interface CoachUpdateRequest {
    name?: string;
    phone?: string;
    age?: number;
}
export interface CoachUpdateResponse {
    coachId: string;
    name: string;
    email: string;
    nickname: string;
    phone?: string;
    age?: number;
    updatedAt: string;
}
export interface TrainerCreateRequest {
    firstName: string;
    lastName: string;
    email?: string;
}
export interface TrainerCreateResponse {
    trainerId: string;
}
export interface TrainerIdentifyRequest {
    coachNickname?: string;
    firstName?: string;
    lastName?: string;
    trainerCode?: string;
}
export interface TrainerIdentifyResponse {
    trainerId: string;
}
export interface TrainerListResponse {
    items: Array<{
        trainerId: string;
        firstName: string;
        lastName: string;
        email?: string;
        createdAt: string;
    }>;
}
export interface ExerciseCreateRequest {
    name: string;
    link?: string;
    note?: string;
    short: string;
    muscleGroup?: string;
}
export interface ExerciseCreateResponse {
    exerciseId: string;
}
export interface ExerciseListResponse {
    items: Array<{
        exerciseId: string;
        name: string;
        link?: string;
        note?: string;
        short: string;
        muscleGroup?: string;
        createdAt: string;
    }>;
}
export interface PlanCreateRequest {
    name: string;
    description?: string;
    trainings: TrainingItem[];
}
export interface PlanCreateResponse {
    planId: string;
}
export interface PlanListResponse {
    items: Array<{
        planId: string;
        name: string;
        description?: string;
        trainingsCount: number;
        createdAt: string;
    }>;
}
export interface PlanAssignResponse {
    assignmentId: string;
    trainerId: string;
    planId: string;
    assignedAt: string;
    active: boolean;
}
export interface TrainerPlansListResponse {
    items: Array<{
        planId: string;
        name: string;
        description?: string;
        trainings: TrainingItem[];
    }>;
}
export interface ProgressCreateRequest {
    planId: string;
    trainingId: string;
    performedAt: string;
    exercises: ExerciseProgressItem[];
}
export interface ProgressCreateResponse {
    progressId: string;
}
//# sourceMappingURL=index.d.ts.map