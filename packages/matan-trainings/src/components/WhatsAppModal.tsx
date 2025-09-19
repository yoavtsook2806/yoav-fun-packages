import React, { useState } from 'react';

interface WhatsAppModalProps {
  exerciseName: string;
  trainingNumber: string;
  onClose: () => void;
  groupChatId?: string;
}

const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  exerciseName,
  trainingNumber,
  onClose,
  groupChatId = '972546989899'
}) => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = () => {
    if (!message.trim()) return;

    setIsLoading(true);

    const fullMessage = `🏋️‍♂️ *אימון ${trainingNumber}*
💪 *תרגיל: ${exerciseName}*

📝 *שאלה:*
${message}`;

    const whatsappUrl = `https://wa.me/${groupChatId}?text=${encodeURIComponent(fullMessage)}`;

    try {
      window.open(whatsappUrl, '_blank');

      setTimeout(() => {
        setIsLoading(false);
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Error opening WhatsApp:', error);
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div className="modal-content whatsapp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <img
              src="/src/images/whatsapp.jpg"
              alt="WhatsApp"
              className="whatsapp-icon-img"
            />
            שלח שאלה לקבוצת האימונים
          </h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="exercise-info-card">
            <div className="exercise-info-item">
              <span className="info-label">אימון:</span>
              <span className="info-value">{trainingNumber}</span>
            </div>
            <div className="exercise-info-item">
              <span className="info-label">תרגיל:</span>
              <span className="info-value">{exerciseName}</span>
            </div>
          </div>

          <div className="message-input-section">
            <label htmlFor="whatsapp-message" className="input-label">
              מה השאלה שלך לקבוצה?
            </label>
            <textarea
              id="whatsapp-message"
              className="message-textarea"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="כתוב כאן את השאלה שלך על התרגיל..."
              rows={4}
              maxLength={500}
            />
            <div className="character-count">
              {message.length}/500
            </div>
          </div>

          <div className="modal-actions">
            <button
              className="secondary-button"
              onClick={onClose}
              disabled={isLoading}
            >
              ביטול
            </button>
            <button
              className="whatsapp-send-button"
              onClick={handleSend}
              disabled={!message.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner"></div>
                  שולח...
                </>
              ) : (
                <>
                  <img
                    src="/src/images/whatsapp.jpg"
                    alt="WhatsApp"
                    className="button-icon"
                  />
                  שלח לווטסאפ
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppModal;