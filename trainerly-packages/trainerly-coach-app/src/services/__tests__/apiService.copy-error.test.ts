import { describe, it, expect, beforeEach, vi } from 'vitest';
import { apiService } from '../apiService';

// Mock fetch globally
global.fetch = vi.fn();

describe('ApiService - Copy Admin Exercise Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should parse server error message when copy admin exercise fails with 409 status', async () => {
    // Mock a 409 response with server error message
    const serverErrorResponse = {
      error: 'DUPLICATE_NAME',
      message: 'Exercise with this name already exists'
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 409,
      statusText: 'Conflict',
      json: vi.fn().mockResolvedValue(serverErrorResponse)
    });

    // After the fix, it should throw the specific server error message:
    await expect(
      apiService.copyAdminExercise('coach-123', 'admin-exercise-1', 'test-token')
    ).rejects.toThrow('Exercise with this name already exists');
  });

  it('should parse server error message when copy admin exercise fails with 404 status', async () => {
    // Mock a 404 response with server error message
    const serverErrorResponse = {
      error: 'NOT_FOUND',
      message: 'Admin exercise not found'
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: vi.fn().mockResolvedValue(serverErrorResponse)
    });

    // After the fix, it should throw the specific server error message:
    await expect(
      apiService.copyAdminExercise('coach-123', 'admin-exercise-1', 'test-token')
    ).rejects.toThrow('Admin exercise not found');
  });

  it('should parse server error message when copy admin exercise fails with 500 status', async () => {
    // Mock a 500 response with server error message
    const serverErrorResponse = {
      error: 'INTERNAL_ERROR',
      message: 'Failed to copy admin exercise'
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: vi.fn().mockResolvedValue(serverErrorResponse)
    });

    // After the fix, it should throw the specific server error message:
    await expect(
      apiService.copyAdminExercise('coach-123', 'admin-exercise-1', 'test-token')
    ).rejects.toThrow('Failed to copy admin exercise');
  });

  it('should handle malformed server error response gracefully', async () => {
    // Mock a response that fails to parse as JSON
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: vi.fn().mockRejectedValue(new Error('Invalid JSON'))
    });

    // Should fall back to the generic error message
    await expect(
      apiService.copyAdminExercise('coach-123', 'admin-exercise-1', 'test-token')
    ).rejects.toThrow('Failed to copy admin exercise: Internal Server Error');
  });

  it('should handle successful copy admin exercise', async () => {
    const copiedExercise = {
      exerciseId: 'copied-exercise-1',
      name: 'לחיצת חזה במוט',
      muscleGroup: 'חזה אמצעי',
      note: 'שכיבה על הספסל, אחיזה רחבה במוט',
      link: 'https://www.youtube.com/watch?v=rT7DgCr-3pg',
      isAdminExercise: false,
      coachId: 'coach-123',
      createdAt: '2025-09-26T09:46:06.221Z',
      originalExerciseId: 'admin-exercise-1'
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: vi.fn().mockResolvedValue(copiedExercise)
    });

    const result = await apiService.copyAdminExercise('coach-123', 'admin-exercise-1', 'test-token');
    expect(result).toEqual(copiedExercise);
  });
});
