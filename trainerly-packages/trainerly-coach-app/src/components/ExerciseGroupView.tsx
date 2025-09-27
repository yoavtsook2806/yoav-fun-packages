import React, { useState } from 'react';
import { Exercise } from '../services/cachedApiService';

interface ExerciseGroupViewProps {
  exercises: Exercise[];
  onExerciseAction?: (exercise: Exercise, action: string) => void;
  renderExerciseCard: (exercise: Exercise) => React.ReactNode;
  showCopyButton?: boolean;
  copiedExercises?: Set<string>;
  copying?: string | null;
}

interface MuscleGroupData {
  name: string;
  exercises: Exercise[];
  count: number;
}

const ExerciseGroupView: React.FC<ExerciseGroupViewProps> = ({
  exercises,
  renderExerciseCard
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Group exercises by muscle group
  const muscleGroups: MuscleGroupData[] = exercises.reduce((groups, exercise) => {
    const muscleGroup = exercise.muscleGroup || 'לא מוגדר';
    const existingGroup = groups.find(g => g.name === muscleGroup);
    
    if (existingGroup) {
      existingGroup.exercises.push(exercise);
      existingGroup.count++;
    } else {
      groups.push({
        name: muscleGroup,
        exercises: [exercise],
        count: 1
      });
    }
    
    return groups;
  }, [] as MuscleGroupData[])
  .sort((a, b) => a.name.localeCompare(b.name, 'he')); // Sort alphabetically in Hebrew

  const toggleGroup = (groupName: string) => {
    const newExpandedGroups = new Set(expandedGroups);
    if (expandedGroups.has(groupName)) {
      newExpandedGroups.delete(groupName);
    } else {
      newExpandedGroups.add(groupName);
    }
    setExpandedGroups(newExpandedGroups);
  };

  if (exercises.length === 0) {
    return null;
  }

  return (
    <div className="exercise-group-view">
      {muscleGroups.map((group) => {
        const isExpanded = expandedGroups.has(group.name);
        
        return (
          <div key={group.name} className="muscle-group-section">
            <div 
              className="muscle-group-header"
              onClick={() => toggleGroup(group.name)}
            >
              <div className="muscle-group-info">
                <h3 className="muscle-group-name">{group.name}</h3>
                <span className="exercise-count">{group.count} תרגילים</span>
              </div>
              <div className="expand-icon">
                {isExpanded ? '▼' : '◀'}
              </div>
            </div>
            
            {isExpanded && (
              <div className="muscle-group-exercises">
                <div className="exercises-grid">
                  {group.exercises.map((exercise) => (
                    <div key={exercise.exerciseId}>
                      {renderExerciseCard(exercise)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ExerciseGroupView;
