import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MuscleGroupSelect from '../MuscleGroupSelect';
import { MUSCLE_GROUPS } from '../../constants/muscleGroups';

describe('MuscleGroupSelect', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('should render with placeholder text', () => {
    render(
      <MuscleGroupSelect
        value=""
        onChange={mockOnChange}
        placeholder="בחר קבוצת שרירים..."
      />
    );

    expect(screen.getByPlaceholderText('בחר קבוצת שרירים...')).toBeInTheDocument();
  });

  it('should display current value', () => {
    render(
      <MuscleGroupSelect
        value="חזה עליון"
        onChange={mockOnChange}
      />
    );

    expect(screen.getByDisplayValue('חזה עליון')).toBeInTheDocument();
  });

  it('should open dropdown when input is focused', async () => {
    render(
      <MuscleGroupSelect
        value=""
        onChange={mockOnChange}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.focus(input);

    await waitFor(() => {
      // Should show all muscle groups
      expect(screen.getByText('חזה עליון')).toBeInTheDocument();
      expect(screen.getByText('חזה תחתון')).toBeInTheDocument();
      expect(screen.getByText('גב עליון')).toBeInTheDocument();
    });
  });

  it('should filter options based on search term', async () => {
    render(
      <MuscleGroupSelect
        value=""
        onChange={mockOnChange}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'חזה' } });

    await waitFor(() => {
      // Should show only chest muscle groups
      expect(screen.getByText('חזה עליון')).toBeInTheDocument();
      expect(screen.getByText('חזה תחתון')).toBeInTheDocument();
      expect(screen.getByText('חזה אמצעי')).toBeInTheDocument();
      
      // Should not show back muscle groups
      expect(screen.queryByText('גב עליון')).not.toBeInTheDocument();
      expect(screen.queryByText('גב תחתון')).not.toBeInTheDocument();
    });
  });

  it('should call onChange when option is selected', async () => {
    render(
      <MuscleGroupSelect
        value=""
        onChange={mockOnChange}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.getByText('חזה עליון')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('חזה עליון'));

    expect(mockOnChange).toHaveBeenCalledWith('חזה עליון');
  });

  it('should close dropdown after selection', async () => {
    render(
      <MuscleGroupSelect
        value=""
        onChange={mockOnChange}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.getByText('חזה עליון')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('חזה עליון'));

    await waitFor(() => {
      expect(screen.queryByText('חזה תחתון')).not.toBeInTheDocument();
    });
  });

  it('should support keyboard navigation', async () => {
    render(
      <MuscleGroupSelect
        value=""
        onChange={mockOnChange}
      />
    );

    const input = screen.getByRole('textbox');
    
    // Open dropdown with Enter key
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText('חזה עליון')).toBeInTheDocument();
    });

    // Select with Enter (should select the first highlighted item)
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockOnChange).toHaveBeenCalledWith(MUSCLE_GROUPS[0]); // First item (index 0)
  });

  it('should close dropdown with Escape key', async () => {
    render(
      <MuscleGroupSelect
        value=""
        onChange={mockOnChange}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.getByText('חזה עליון')).toBeInTheDocument();
    });

    fireEvent.keyDown(input, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByText('חזה עליון')).not.toBeInTheDocument();
    });
  });

  it('should be disabled when disabled prop is true', () => {
    render(
      <MuscleGroupSelect
        value=""
        onChange={mockOnChange}
        disabled={true}
      />
    );

    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('should be required when required prop is true', () => {
    render(
      <MuscleGroupSelect
        value=""
        onChange={mockOnChange}
        required={true}
      />
    );

    const input = screen.getByRole('textbox');
    expect(input).toBeRequired();
  });

  it('should show no results message when no matches found', async () => {
    render(
      <MuscleGroupSelect
        value=""
        onChange={mockOnChange}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'xyz123' } });

    await waitFor(() => {
      expect(screen.getByText('לא נמצאו תוצאות מתאימות')).toBeInTheDocument();
    });
  });

  it('should allow custom values when allowCustom is true', async () => {
    render(
      <MuscleGroupSelect
        value=""
        onChange={mockOnChange}
        allowCustom={true}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'קבוצת שרירים חדשה' } });

    expect(mockOnChange).toHaveBeenCalledWith('קבוצת שרירים חדשה');
  });

  it('should show different no results message when allowCustom is true', async () => {
    render(
      <MuscleGroupSelect
        value=""
        onChange={mockOnChange}
        allowCustom={true}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'xyz123' } });

    await waitFor(() => {
      expect(screen.getByText('לא נמצאו תוצאות - יכול להזין ערך חדש')).toBeInTheDocument();
    });
  });
});
