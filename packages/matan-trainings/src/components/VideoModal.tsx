import React, { useEffect, useRef } from 'react';

interface VideoModalProps {
  videoUrl: string;
  isOpen: boolean;
  onClose: () => void;
  exerciseName?: string;
}

const VideoModal: React.FC<VideoModalProps> = ({ videoUrl, isOpen, onClose, exerciseName }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string): string | null => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };

  // Generate YouTube app deep link
  const getYouTubeAppUrl = (url: string): string => {
    const videoId = getYouTubeVideoId(url);
    if (videoId) {
      return `youtube://watch?v=${videoId}`;
    }
    return url;
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle click outside
  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  const videoId = getYouTubeVideoId(videoUrl);
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : null;

  return (
    <div className="video-modal-overlay" onClick={handleOverlayClick}>
      <div className="video-modal" ref={modalRef} onClick={(e) => e.stopPropagation()}>
        <div className="video-modal-header">
          <h2 className="video-modal-title">
            {exerciseName ? `סרטון הדרכה - ${exerciseName}` : 'סרטון הדרכה'}
          </h2>
          <button className="video-modal-close" onClick={onClose} aria-label="סגור">
            ✕
          </button>
        </div>
        
        <div className="video-modal-content">
          {embedUrl ? (
            <div className="video-container">
              <iframe
                src={embedUrl}
                title={exerciseName ? `סרטון הדרכה - ${exerciseName}` : 'סרטון הדרכה'}
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                className="video-iframe"
              />
            </div>
          ) : (
            <div className="video-error">
              <p>לא ניתן להציג את הסרטון כאן</p>
              <button
                className="video-external-btn"
                onClick={() => window.open(videoUrl, '_blank')}
              >
                פתח בדפדפן
              </button>
            </div>
          )}
        </div>

        <div className="video-modal-footer">
          <button
            className="video-app-btn"
            onClick={() => {
              const appUrl = getYouTubeAppUrl(videoUrl);
              window.location.href = appUrl;
            }}
            title="פתח באפליקציית YouTube"
          >
            📱 פתח באפליקציית YouTube
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoModal;