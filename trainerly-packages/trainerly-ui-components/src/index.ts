// Export all UI components from organized directories
export { default as Card, type CardProps } from './components/Card';
export { default as Modal, type ModalProps } from './components/Modal';
export { default as ExerciseGroupView, type ExerciseGroupViewProps, type BaseExercise } from './components/ExerciseGroupView';
export { default as LoadingSpinner, type LoadingSpinnerProps } from './components/LoadingSpinner';
export { default as Button, type ButtonProps } from './components/Button';
export { default as Input, type InputProps } from './components/Input';
export { default as Auth, type AuthProps, type AuthUser, type LoginData, type RegisterData } from './components/Auth';

// Toast system - main export is ToastContainer with helper functions
export { 
  ToastContainer, 
  showToast, 
  showError, 
  showSuccess, 
  showWarning, 
  showInfo,
  type ToastMessage 
} from './components/Toast/index';

// MuscleGroupSelect with constants and types
export { 
  default as MuscleGroupSelect, 
  MUSCLE_GROUPS, 
  type MuscleGroup, 
  type MuscleGroupSelectProps,
  isValidMuscleGroup 
} from './components/MuscleGroupSelect';

// Title component
export { Title, type TitleProps } from './components/Title';
