import React from 'react';

interface TrainingCompleteProps {
  onRestart: () => void;
}

const TrainingComplete: React.FC<TrainingCompleteProps> = ({ onRestart }) => {
  return (
    <div className="training-complete">
      <h2>🎉 כל הכבוד! 🎉</h2>
      <p style={{ fontSize: '20px', marginBottom: '30px' }}>
        סיימת את האימון בהצלחה!
      </p>
      <button
        className="green-button"
        onClick={onRestart}
        style={{ padding: '15px 30px', fontSize: '18px' }}
      >
        התחל אימון חדש
      </button>
    </div>
  );
};

export default TrainingComplete;
