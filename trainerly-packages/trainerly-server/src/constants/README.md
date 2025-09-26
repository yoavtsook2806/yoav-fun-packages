# Exercise Constants

This file contains 60 comprehensive gym exercises with Hebrew names, descriptions, and valid YouTube links.

## Usage

```typescript
import { 
  GYM_EXERCISES, 
  getExercisesByCategory, 
  getExercisesByEquipment,
  getRandomExercises,
  convertToServerExercise 
} from './exercises';

// Get all exercises
console.log(`Total exercises: ${GYM_EXERCISES.length}`);

// Get chest exercises
const chestExercises = getExercisesByCategory('chest');
console.log(`Chest exercises: ${chestExercises.length}`);

// Get dumbbell exercises  
const dumbbellExercises = getExercisesByEquipment('dumbbell');
console.log(`Dumbbell exercises: ${dumbbellExercises.length}`);

// Get 5 random exercises
const randomExercises = getRandomExercises(5);
console.log('Random exercises:', randomExercises.map(e => e.name));

// Convert to server format
const serverExercise = convertToServerExercise(
  GYM_EXERCISES[0], 
  'exercise-id-123',
  'admin'
);
```

## Exercise Categories

- **chest**: 6 exercises (bench press, push-ups, flyes, etc.)
- **back**: 6 exercises (pull-ups, rows, deadlifts, etc.)  
- **legs**: 10 exercises (squats, lunges, hip thrusts, etc.)
- **shoulders**: 7 exercises (presses, raises, shrugs, etc.)
- **arms**: 9 exercises (bicep curls, tricep extensions, etc.)
- **core**: 7 exercises (planks, crunches, mountain climbers, etc.)
- **full-body**: 4 exercises (burpees, kettlebell swings, etc.)

## Equipment Types

- **barbell**: Olympic barbell exercises
- **dumbbell**: Dumbbell exercises  
- **machine**: Gym machine exercises
- **bodyweight**: No equipment needed
- **cable**: Cable machine exercises
- **mixed**: Requires multiple equipment types

## Exercise Structure

Each exercise includes:

- `name`: Hebrew exercise name
- `short`: Short Hebrew description
- `note`: Detailed Hebrew instructions
- `link`: Valid YouTube tutorial URL
- `category`: Body part category
- `equipment`: Required equipment type

## Popular Exercises Included

**Men's Favorites:**
- Pull-ups (משיכות לסנטר)
- Bench Press (לחיצת חזה במוט)
- Deadlifts (הרמת מתים)
- Squats (סקוואט)

**Women's Favorites:**  
- Hip Thrusts (היפ תראסט)
- Glute Bridges variations
- Lateral Raises (הרמות צד)
- Core exercises

**Exercise Variations:**
- Barbell vs Dumbbell versions
- Different grip positions
- Beginner to advanced progressions
