// Mock database service for testing
export const mockDatabase = {
  // In-memory storage for test isolation
  coaches: new Map<string, any>(),
  trainers: new Map<string, any>(),
  exercises: new Map<string, any>(),
  plans: new Map<string, any>(),
  exerciseSessions: new Map<string, any>(),

  // Clear all data between tests
  clear() {
    this.coaches.clear();
    this.trainers.clear();
    this.exercises.clear();
    this.plans.clear();
    this.exerciseSessions.clear();
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

  // Trainer plans (using trainer.plans array instead of assignments)
  async getPlansByTrainer(trainerId: string): Promise<any[]> {
    const trainer = this.trainers.get(trainerId);
    if (!trainer || !trainer.plans || trainer.plans.length === 0) {
      return [];
    }
    
    const plans = [];
    for (const planId of trainer.plans) {
      const plan = this.plans.get(planId);
      if (plan) {
        plans.push(plan);
      }
    }
    return plans;
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


  async getCustomTrainingPlansForTrainee(coachId: string, traineeName: string): Promise<any[]> {
    const customPlans = [];
    for (const plan of this.plans.values()) {
      if (plan.coachId === coachId && plan.customTrainee === traineeName) {
        customPlans.push(plan);
      }
    }
    return customPlans;
  },

  // Exercise Session operations
  async saveExerciseSession(session: any): Promise<boolean> {
    this.exerciseSessions.set(session.sessionId, session);
    return true;
  },

  async getExerciseSessionsByTrainer(trainerId: string, limit?: number): Promise<any[]> {
    const sessions = [];
    for (const session of this.exerciseSessions.values()) {
      if (session.trainerId === trainerId) {
        sessions.push(session);
      }
    }
    // Sort by completedAt descending (newest first)
    sessions.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
    
    if (limit && sessions.length > limit) {
      return sessions.slice(0, limit);
    }
    
    return sessions;
  }
};

// Create the mock database service
export const db = mockDatabase;
