import React from 'react';

interface TrainingCompleteProps {
  onRestart: () => void;
}

const TrainingComplete: React.FC<TrainingCompleteProps> = ({ onRestart }) => {
  const handleSendLoveMessage = () => {
    const phoneNumber = '972546989899';
    const message = 'מתן, אתה גבר שבגברים, פסיכונאוט אמיתי. אנחנו מתגעגעים אליך!';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="training-complete">
      <div className="celebration-container">
        <div className="celebration-header">
          <h1 className="celebration-title">🎉 כל הכבוד! 🎉</h1>
          <div className="achievement-badge">
            <div className="badge-inner">
              <span className="trophy">🏆</span>
              <span className="badge-text">השלמת אימון!</span>
            </div>
          </div>
        </div>

        <div className="celebration-content">
          <p className="completion-message">
            סיימת את האימון בהצלחה! 💪
          </p>
          <p className="motivation-text">
            אתה צועד קדימה בדרך לחיזוק הגוף והנפש שלך
          </p>
        </div>

        <div className="action-buttons">
          <button
            className="restart-button"
            onClick={onRestart}
          >
            <span className="button-icon">🔄</span>
            התחל אימון חדש
          </button>

          <button
            className="whatsapp-celebration-button"
            onClick={handleSendLoveMessage}
          >
            <span className="button-icon">💚</span>
            שלח למתן הודעת אהבה
          </button>
        </div>

        <div className="celebration-footer">
          <p className="encouragement">המשך כך! אתה עושה עבודה מדהימה! ✨</p>
        </div>
      </div>
    </div>
  );
};

export default TrainingComplete;
