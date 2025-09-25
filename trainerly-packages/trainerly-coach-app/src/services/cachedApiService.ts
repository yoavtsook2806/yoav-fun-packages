/**
 * Cached API Service - Wraps the original API service with local storage caching
 * Provides cache-first loading with background updates
 */

import { apiService, Coach, Exercise, TrainingPlanSummary, Trainee } from './apiService';
import { cacheService, CACHE_KEYS } from './cacheService';

export interface CachedData<T> {
  data: T;
  fromCache: boolean;
  timestamp: number;
}

export interface LoadOptions {
  forceRefresh?: boolean;
  backgroundUpdate?: boolean;
}

class CachedApiService {
  /**
   * Generic cached data loader
   */
  private async loadWithCache<T>(
    cacheKey: string,
    coachId: string,
    fetchFn: () => Promise<T>,
    options: LoadOptions = {}
  ): Promise<CachedData<T>> {
    const { forceRefresh = false, backgroundUpdate = true } = options;

    // Try to get from cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = cacheService.get<T>(coachId, cacheKey);
      if (cached) {
        // Return cached data immediately
        const result: CachedData<T> = {
          data: cached,
          fromCache: true,
          timestamp: Date.now()
        };

        // Optionally fetch fresh data in background
        if (backgroundUpdate) {
          this.updateCacheInBackground(cacheKey, coachId, fetchFn);
        }

        return result;
      }
    }

    // Fetch fresh data
    try {
      const freshData = await fetchFn();
      
      // Update cache
      cacheService.set(coachId, cacheKey, freshData);

      return {
        data: freshData,
        fromCache: false,
        timestamp: Date.now()
      };
    } catch (error) {
      // If fetch fails, try to return stale cache as fallback
      const staleCache = cacheService.get<T>(coachId, cacheKey, { maxAge: 24 * 60 * 60 * 1000 }); // 24 hours
      if (staleCache) {
        console.warn('API failed, returning stale cache:', error);
        return {
          data: staleCache,
          fromCache: true,
          timestamp: Date.now()
        };
      }
      
      throw error;
    }
  }

  /**
   * Update cache in background without blocking UI
   */
  private async updateCacheInBackground<T>(
    cacheKey: string,
    coachId: string,
    fetchFn: () => Promise<T>
  ): Promise<void> {
    try {
      const freshData = await fetchFn();
      
      // Only update cache if data has actually changed
      if (cacheService.hasChanged(coachId, cacheKey, freshData)) {
        cacheService.set(coachId, cacheKey, freshData);
        console.log(`🔄 Background update: ${cacheKey} for coach ${coachId}`);
        
        // Emit custom event for components to update UI
        window.dispatchEvent(new CustomEvent('cacheUpdated', {
          detail: { cacheKey, coachId, data: freshData }
        }));
      }
    } catch (error) {
      console.warn('Background cache update failed:', error);
    }
  }

  // Coach Profile
  async getCoach(coachId: string, token: string, options?: LoadOptions): Promise<CachedData<Coach>> {
    return this.loadWithCache(
      CACHE_KEYS.COACH_PROFILE,
      coachId,
      () => apiService.getCoach(coachId, token),
      options
    );
  }

  async updateCoach(coachId: string, token: string, updateData: Partial<Pick<Coach, 'name' | 'phone' | 'age'>>): Promise<Coach> {
    const updatedCoach = await apiService.updateCoach(coachId, token, updateData);
    
    // Update cache immediately
    cacheService.set(coachId, CACHE_KEYS.COACH_PROFILE, updatedCoach);
    
    return updatedCoach;
  }

  // Exercises
  async getExercises(coachId: string, token: string, options?: LoadOptions): Promise<CachedData<Exercise[]>> {
    return this.loadWithCache(
      CACHE_KEYS.EXERCISES,
      coachId,
      () => apiService.getExercises(coachId, token),
      options
    );
  }

  async createExercise(coachId: string, token: string, exerciseData: Omit<Exercise, 'exerciseId' | 'coachId' | 'createdAt'>): Promise<Exercise> {
    const newExercise = await apiService.createExercise(coachId, token, exerciseData);
    
    // Update exercises cache by adding the new exercise
    const cachedExercises = cacheService.get<Exercise[]>(coachId, CACHE_KEYS.EXERCISES) || [];
    const updatedExercises = [...cachedExercises, newExercise];
    cacheService.set(coachId, CACHE_KEYS.EXERCISES, updatedExercises);
    
    return newExercise;
  }

  // Training Plans
  async getTrainingPlans(coachId: string, token: string, options?: LoadOptions): Promise<CachedData<TrainingPlanSummary[]>> {
    return this.loadWithCache(
      CACHE_KEYS.TRAINING_PLANS,
      coachId,
      () => apiService.getTrainingPlans(coachId, token),
      options
    );
  }

  async createTrainingPlan(coachId: string, token: string, planData: any): Promise<any> {
    const newPlan = await apiService.createTrainingPlan(coachId, token, planData);
    
    // Invalidate training plans cache to force refresh
    cacheService.remove(coachId, CACHE_KEYS.TRAINING_PLANS);
    
    return newPlan;
  }

  // Trainees
  async getTrainees(coachId: string, token: string, options?: LoadOptions): Promise<CachedData<Trainee[]>> {
    return this.loadWithCache(
      CACHE_KEYS.TRAINEES,
      coachId,
      () => apiService.getTrainees(coachId, token),
      options
    );
  }

  async createTrainee(coachId: string, token: string, traineeData: any): Promise<Trainee> {
    const newTrainee = await apiService.createTrainee(coachId, token, traineeData);
    
    // Update trainees cache by adding the new trainee
    const cachedTrainees = cacheService.get<Trainee[]>(coachId, CACHE_KEYS.TRAINEES) || [];
    const updatedTrainees = [...cachedTrainees, newTrainee];
    cacheService.set(coachId, CACHE_KEYS.TRAINEES, updatedTrainees);
    
    return newTrainee;
  }

  async assignPlanToTrainee(coachId: string, traineeId: string, planId: string, token: string): Promise<void> {
    console.log('🔄 CACHED API - Assigning plan via API service:', { coachId, traineeId, planId });
    
    await apiService.assignPlanToTrainee(coachId, traineeId, planId, token);
    
    console.log('✅ CACHED API - Plan assigned successfully, invalidating trainees cache');
    
    // Invalidate trainees cache to force refresh (since assignments changed)
    cacheService.remove(coachId, CACHE_KEYS.TRAINEES);
    
    console.log('🗑️ CACHED API - Trainees cache invalidated');
  }

  // Trainee Progress
  async getTraineeProgress(coachId: string, traineeId: string, token: string, options?: LoadOptions): Promise<CachedData<any[]>> {
    return this.loadWithCache(
      CACHE_KEYS.TRAINEE_PROGRESS(traineeId),
      coachId,
      () => apiService.getTraineeProgress(coachId, traineeId, token),
      options
    );
  }

  // Cache Management
  clearCoachCache(coachId: string): void {
    cacheService.clearCoachCache(coachId);
  }

  clearAllCache(): void {
    cacheService.clearAllCache();
  }

  getCacheStats(coachId: string) {
    return cacheService.getStats(coachId);
  }

  // Admin Exercise Bank Methods
  async getAdminExercises(token: string, options?: LoadOptions): Promise<CachedData<Exercise[]>> {
    return this.loadWithCache(
      'admin_exercises',
      'admin', // Use 'admin' as coachId for admin exercises
      () => apiService.getAdminExercises(token),
      options
    );
  }

  async copyAdminExercise(coachId: string, adminExerciseId: string, token: string): Promise<Exercise> {
    const copiedExercise = await apiService.copyAdminExercise(coachId, adminExerciseId, token);
    
    // Update the coach's exercises cache
    const cachedExercises = cacheService.get<Exercise[]>(coachId, CACHE_KEYS.EXERCISES) || [];
    const updatedExercises = [...cachedExercises, copiedExercise];
    cacheService.set(coachId, CACHE_KEYS.EXERCISES, updatedExercises);
    
    return copiedExercise;
  }

  // Admin Training Plan Bank Methods
  async getAdminTrainingPlans(token: string, options?: LoadOptions): Promise<CachedData<TrainingPlanSummary[]>> {
    return this.loadWithCache(
      'admin_training_plans',
      'admin', // Use 'admin' as coachId for admin training plans
      () => apiService.getAdminTrainingPlans(token),
      options
    );
  }

  async copyAdminTrainingPlan(coachId: string, adminPlanId: string, token: string): Promise<TrainingPlan> {
    const copiedPlan = await apiService.copyAdminTrainingPlan(coachId, adminPlanId, token);
    
    // Update the coach's training plans cache
    const cachedPlans = cacheService.get<TrainingPlanSummary[]>(coachId, CACHE_KEYS.TRAINING_PLANS) || [];
    const newPlanSummary: TrainingPlanSummary = {
      planId: copiedPlan.planId,
      name: copiedPlan.name,
      description: copiedPlan.description,
      trainingsCount: copiedPlan.trainings.length,
      isAdminPlan: copiedPlan.isAdminPlan,
      originalPlanId: copiedPlan.originalPlanId,
      customTrainee: copiedPlan.customTrainee,
      createdAt: copiedPlan.createdAt
    };
    const updatedPlans = [...cachedPlans, newPlanSummary];
    cacheService.set(coachId, CACHE_KEYS.TRAINING_PLANS, updatedPlans);
    
    return copiedPlan;
  }

  // Custom Trainee Training Plan Methods
  async createCustomTrainingPlan(
    coachId: string, 
    traineeId: string, 
    traineeName: string,
    basePlanId: string, 
    token: string
  ): Promise<TrainingPlan> {
    const customPlan = await apiService.createCustomTrainingPlan(coachId, traineeId, traineeName, basePlanId, token);
    
    // Update the coach's training plans cache
    const cachedPlans = cacheService.get<TrainingPlanSummary[]>(coachId, CACHE_KEYS.TRAINING_PLANS) || [];
    const newPlanSummary: TrainingPlanSummary = {
      planId: customPlan.planId,
      name: customPlan.name,
      description: customPlan.description,
      trainingsCount: customPlan.trainings.length,
      isAdminPlan: customPlan.isAdminPlan,
      originalPlanId: customPlan.originalPlanId,
      customTrainee: customPlan.customTrainee,
      createdAt: customPlan.createdAt
    };
    const updatedPlans = [...cachedPlans, newPlanSummary];
    cacheService.set(coachId, CACHE_KEYS.TRAINING_PLANS, updatedPlans);
    
    return customPlan;
  }

  async makeCustomPlanGeneric(coachId: string, planId: string, token: string): Promise<TrainingPlan> {
    const updatedPlan = await apiService.makeCustomPlanGeneric(coachId, planId, token);
    
    // Update the training plans cache
    const cachedPlans = cacheService.get<TrainingPlanSummary[]>(coachId, CACHE_KEYS.TRAINING_PLANS) || [];
    const updatedPlans = cachedPlans.map(plan => 
      plan.planId === planId 
        ? { ...plan, customTrainee: undefined } 
        : plan
    );
    cacheService.set(coachId, CACHE_KEYS.TRAINING_PLANS, updatedPlans);
    
    return updatedPlan;
  }

  async getTraineeCustomPlans(coachId: string, traineeId: string, token: string, options?: LoadOptions): Promise<CachedData<TrainingPlanSummary[]>> {
    return this.loadWithCache(
      `trainee_custom_plans_${traineeId}`,
      coachId,
      () => apiService.getTraineeCustomPlans(coachId, traineeId, token),
      options
    );
  }

  async deleteTrainingPlan(coachId: string, planId: string, token: string): Promise<void> {
    await apiService.deleteTrainingPlan(coachId, planId, token);
    
    // Remove from training plans cache
    const cachedPlans = cacheService.get<TrainingPlanSummary[]>(coachId, CACHE_KEYS.TRAINING_PLANS) || [];
    const updatedPlans = cachedPlans.filter(plan => plan.planId !== planId);
    cacheService.set(coachId, CACHE_KEYS.TRAINING_PLANS, updatedPlans);
    
    // Emit cache update event
    window.dispatchEvent(new CustomEvent('cacheUpdated', { 
      detail: { key: CACHE_KEYS.TRAINING_PLANS, coachId } 
    }));
  }

  async getTrainingPlan(coachId: string, planId: string, token: string): Promise<TrainingPlan> {
    return await apiService.getTrainingPlan(coachId, planId, token);
  }

  async updateTrainingPlan(coachId: string, planId: string, token: string, planData: Partial<TrainingPlan>): Promise<TrainingPlan> {
    const updatedPlan = await apiService.updateTrainingPlan(coachId, planId, token, planData);
    
    // Update the training plans cache
    const cachedPlans = cacheService.get<TrainingPlanSummary[]>(coachId, CACHE_KEYS.TRAINING_PLANS) || [];
    const updatedPlans = cachedPlans.map(plan => 
      plan.planId === planId 
        ? { 
            ...plan, 
            name: updatedPlan.name, 
            description: updatedPlan.description,
            trainingsCount: updatedPlan.trainings?.length || 0
          } 
        : plan
    );
    cacheService.set(coachId, CACHE_KEYS.TRAINING_PLANS, updatedPlans);
    
    // Emit cache update event
    window.dispatchEvent(new CustomEvent('cacheUpdated', { 
      detail: { key: CACHE_KEYS.TRAINING_PLANS, coachId } 
    }));
    
    return updatedPlan;
  }
}

export const cachedApiService = new CachedApiService();

// Re-export types for convenience
export type { Coach, Exercise, TrainingPlanSummary, Trainee } from './apiService';
