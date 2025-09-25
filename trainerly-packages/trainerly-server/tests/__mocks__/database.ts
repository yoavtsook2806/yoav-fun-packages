// Mock database service for testing
export const mockDatabase = {
  // In-memory storage for test isolation
  coaches: new Map<string, any>(),
  trainers: new Map<string, any>(),
  exercises: new Map<string, any>(),
  plans: new Map<string, any>(),
  assignments: new Map<string, any>(),
  progress: new Map<string, any>(),

  // Clear all data between tests
  clear() {
    this.coaches.clear();
    this.trainers.clear();
    this.exercises.clear();
    this.plans.clear();
    this.assignments.clear();
    this.progress.clear();
  },

  // Coach operations
  async saveCoach(coach: any): Promise<boolean> {
    this.coaches.set(coach.coachId, coach);
    return true;
  },

  async getCoach(coachId: string): Promise<any | null> {
    return this.coaches.get(coachId) || null;
  },

  async getCoachByEmail(email: string): Promise<any | null> {
    for (const coach of this.coaches.values()) {
      if (coach.email === email) {
        return coach;
      }
    }
    return null;
  },

  async getCoachByNickname(nickname: string): Promise<any | null> {
    for (const coach of this.coaches.values()) {
      if (coach.nickname === nickname) {
        return coach;
      }
    }
    return null;
  },

  async updateCoach(coach: any): Promise<boolean> {
    if (this.coaches.has(coach.coachId)) {
      this.coaches.set(coach.coachId, coach);
      return true;
    }
    return false;
  },

  // Exercise operations
  async saveExercise(exercise: any): Promise<boolean> {
    this.exercises.set(exercise.exerciseId, exercise);
    return true;
  },

  async getExercise(exerciseId: string): Promise<any | null> {
    return this.exercises.get(exerciseId) || null;
  },

  getExercisesByCoach(coachId: string): any[] {
    const exercises = [];
    for (const exercise of this.exercises.values()) {
      if (exercise.coachId === coachId) {
        exercises.push(exercise);
      }
    }
    return exercises;
  },

  // Training plan operations
  async savePlan(plan: any): Promise<boolean> {
    this.plans.set(plan.planId, plan);
    return true;
  },

  async saveTrainingPlan(plan: any): Promise<boolean> {
    this.plans.set(plan.planId, plan);
    return true;
  },

  async getTrainingPlan(planId: string): Promise<any | null> {
    return this.plans.get(planId) || null;
  },

  async getPlansByCoach(coachId: string): Promise<any[]> {
    const plans = [];
    for (const plan of this.plans.values()) {
      if (plan.coachId === coachId) {
        plans.push(plan);
      }
    }
    return plans;
  },

  async updateTrainingPlan(plan: any): Promise<boolean> {
    if (this.plans.has(plan.planId)) {
      this.plans.set(plan.planId, plan);
      return true;
    }
    return false;
  },

  async deleteTrainingPlan(planId: string): Promise<boolean> {
    return this.plans.delete(planId);
  },

  // Trainer operations
  async saveTrainer(trainer: any): Promise<boolean> {
    this.trainers.set(trainer.trainerId, trainer);
    return true;
  },

  async getTrainer(trainerId: string): Promise<any | null> {
    return this.trainers.get(trainerId) || null;
  },

  async getTrainersByCoach(coachId: string): Promise<any[]> {
    const trainers = [];
    for (const trainer of this.trainers.values()) {
      if (trainer.coachId === coachId) {
        trainers.push(trainer);
      }
    }
    return trainers;
  },

  async getTrainerByCode(trainerCode: string): Promise<any | null> {
    for (const trainer of this.trainers.values()) {
      if (trainer.trainerCode === trainerCode) {
        return trainer;
      }
    }
    return null;
  },

  // Plan assignment operations
  async savePlanAssignment(assignment: any): Promise<boolean> {
    this.assignments.set(assignment.assignmentId, assignment);
    return true;
  },

  async getPlansByTrainer(trainerId: string): Promise<any[]> {
    const assignments = [];
    for (const assignment of this.assignments.values()) {
      if (assignment.trainerId === trainerId && assignment.active) {
        const plan = this.plans.get(assignment.planId);
        if (plan) {
          assignments.push(plan);
        }
      }
    }
    return assignments;
  },

  // Progress operations
  async saveProgress(progress: any): Promise<boolean> {
    const key = `${progress.trainerId}_${progress.planId}_${progress.trainingId}`;
    this.progress.set(key, progress);
    return true;
  },

  async getProgressByTrainer(trainerId: string): Promise<any[]> {
    const progressList = [];
    for (const progress of this.progress.values()) {
      if (progress.trainerId === trainerId) {
        progressList.push(progress);
      }
    }
    return progressList;
  },

  async getProgressByCoachAndTrainer(coachId: string, trainerId: string): Promise<any[]> {
    const progressList = [];
    for (const progress of this.progress.values()) {
      if (progress.trainerId === trainerId) {
        // Check if trainer belongs to coach
        const trainer = this.trainers.get(trainerId);
        if (trainer && trainer.coachId === coachId) {
          progressList.push(progress);
        }
      }
    }
    return progressList;
  },

  // Admin operations
  async getAdminExercises(): Promise<any[]> {
    const adminExercises = [];
    for (const exercise of this.exercises.values()) {
      if (exercise.isAdminExercise) {
        adminExercises.push(exercise);
      }
    }
    return adminExercises;
  },

  async getAdminTrainingPlans(): Promise<any[]> {
    const adminPlans = [];
    for (const plan of this.plans.values()) {
      if (plan.isAdminPlan) {
        adminPlans.push({
          planId: plan.planId,
          name: plan.name,
          description: plan.description,
          trainingsCount: plan.trainings?.length || 0,
          isAdminPlan: plan.isAdminPlan,
          originalPlanId: plan.originalPlanId,
          customTrainee: plan.customTrainee,
          createdAt: plan.createdAt
        });
      }
    }
    return adminPlans;
  },

  async getCustomTrainingPlansForTrainee(coachId: string, traineeName: string): Promise<any[]> {
    const customPlans = [];
    for (const plan of this.plans.values()) {
      if (plan.coachId === coachId && plan.customTrainee === traineeName) {
        customPlans.push(plan);
      }
    }
    return customPlans;
  }
};

// Create the mock database service
export const db = mockDatabase;
