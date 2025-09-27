import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AdminExerciseBank from '../AdminExerciseBank';
import { cachedApiService } from '../../services/cachedApiService';
import { showError, showSuccess } from '../ToastContainer';

// Mock the services
vi.mock('../../services/cachedApiService');
vi.mock('../ToastContainer');

const mockCachedApiService = vi.mocked(cachedApiService);
const mockShowError = vi.mocked(showError);
const mockShowSuccess = vi.mocked(showSuccess);

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('AdminExerciseBank - Debug Copy Indication', () => {
  const mockCoachId = 'coach-123';
  const mockToken = 'token-123';
  
  const mockAdminExercise = {
    exerciseId: 'admin-exercise-1',
    name: 'כיפופי זרוע ריכוז',
    muscleGroup: 'זרועות',
    note: 'תרגיל מצוין',
    link: '',
    isAdminExercise: true,
    createdAt: '2023-01-01T00:00:00.000Z'
  };

  const mockCoachExercise = {
    exerciseId: 'coach-exercise-1',
    name: 'כיפופי זרוע ריכוז',
    muscleGroup: 'זרועות',
    note: 'תרגיל מצוין',
    link: '',
    originalExerciseId: 'admin-exercise-1', // This should match the admin exercise ID
    isAdminExercise: false,
    coachId: mockCoachId,
    createdAt: '2023-01-02T00:00:00.000Z'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    
    // Default API responses
    mockCachedApiService.getAdminExercises.mockResolvedValue({
      data: [mockAdminExercise],
      fromCache: false
    });
    
    mockCachedApiService.getExercises.mockResolvedValue({
      data: [mockCoachExercise],
      fromCache: false
    });
  });

  it('should debug the copy indication logic step by step', async () => {
    // ARRANGE: Set up localStorage with copied exercise
    const storedCopiedIds = JSON.stringify(['admin-exercise-1']);
    mockLocalStorage.getItem.mockImplementation((key) => {
      console.log('🔍 localStorage.getItem called with key:', key);
      if (key === `copied_admin_exercises_${mockCoachId}`) {
        console.log('💾 Returning stored copied IDs:', storedCopiedIds);
        return storedCopiedIds;
      }
      return null;
    });

    // Mock console.log to capture the debug output
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // ACT: Render the component
    render(
      <AdminExerciseBank
        isOpen={true}
        onClose={() => {}}
        coachId={mockCoachId}
        token={mockToken}
      />
    );

    // Wait for the component to load
    await waitFor(() => {
      expect(mockCachedApiService.getAdminExercises).toHaveBeenCalled();
    }, { timeout: 5000 });

    // Wait a bit more for the copy indication logic to run
    await waitFor(() => {
      expect(mockCachedApiService.getExercises).toHaveBeenCalled();
    }, { timeout: 5000 });

    // ASSERT: Check what was logged
    const logCalls = consoleSpy.mock.calls;
    console.log('📋 All console.log calls:');
    logCalls.forEach((call, index) => {
      console.log(`${index + 1}. ${call.join(' ')}`);
    });

    // Check if the copy indication logic was called
    const copyIndicationLogs = logCalls.filter(call => 
      call.some(arg => typeof arg === 'string' && arg.includes('Loading copied exercises'))
    );
    
    expect(copyIndicationLogs.length).toBeGreaterThan(0);

    // Check if localStorage was accessed
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith(`copied_admin_exercises_${mockCoachId}`);

    // Check if coach exercises were fetched
    expect(mockCachedApiService.getExercises).toHaveBeenCalledWith(mockCoachId, mockToken);

    // Clean up
    consoleSpy.mockRestore();
  });

  it('should show the actual DOM structure for debugging', async () => {
    // ARRANGE: Set up localStorage with copied exercise
    const storedCopiedIds = JSON.stringify(['admin-exercise-1']);
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === `copied_admin_exercises_${mockCoachId}`) {
        return storedCopiedIds;
      }
      return null;
    });

    // ACT: Render the component
    render(
      <AdminExerciseBank
        isOpen={true}
        onClose={() => {}}
        coachId={mockCoachId}
        token={mockToken}
      />
    );

    // Wait for loading
    await waitFor(() => {
      expect(mockCachedApiService.getAdminExercises).toHaveBeenCalled();
    });

    // ASSERT: Show the DOM structure
    console.log('🏗️ Current DOM structure:');
    console.log(document.body.innerHTML);

    // Try to find any copy button
    const copyButtons = screen.queryAllByText(/העתק|הועתק|מעתיק/);
    console.log('🔘 Found copy buttons:', copyButtons.length);
    
    copyButtons.forEach((button, index) => {
      console.log(`Button ${index + 1}:`, button.textContent, button.className);
    });

    // Try to find the exercise name in any form
    const exerciseElements = screen.queryAllByText(/כיפופי זרוע ריכוז/);
    console.log('🏋️ Found exercise name elements:', exerciseElements.length);
    
    exerciseElements.forEach((element, index) => {
      console.log(`Exercise ${index + 1}:`, element.textContent, element.tagName, element.className);
    });

    // Check if the muscle group section is there
    const muscleGroupElements = screen.queryAllByText(/זרועות/);
    console.log('💪 Found muscle group elements:', muscleGroupElements.length);
    
    muscleGroupElements.forEach((element, index) => {
      console.log(`Muscle group ${index + 1}:`, element.textContent, element.tagName, element.className);
    });
  });
});
