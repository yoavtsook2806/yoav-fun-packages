import React, { useState } from 'react';
import { ExerciseHistoryEntry } from '../types';
import { calculateExerciseAdjustedVolumeHistory, getAdjustedVolumeFormulaExplanation } from '../utils/adjustedVolume';

interface ExercisePerformanceGraphProps {
  exerciseName: string;
  exerciseHistory: ExerciseHistoryEntry[];
}

const ExercisePerformanceGraph: React.FC<ExercisePerformanceGraphProps> = ({
  exerciseName,
  exerciseHistory,
}) => {
  const [showFormulaInfo, setShowFormulaInfo] = useState(false);
  
  // Calculate adjusted volume data
  const adjustedVolumeData = calculateExerciseAdjustedVolumeHistory(exerciseHistory);
  
  // Format date for display (for tooltips)
  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
      month: '2-digit',
      day: '2-digit',
    });
  };

  // Find min/max values for scaling - add padding for better visualization
  const maxVolume = Math.max(...adjustedVolumeData.map(d => d.adjustedVolume), 1);
  const minVolume = Math.min(...adjustedVolumeData.map(d => d.adjustedVolume), 0);
  const volumeRange = maxVolume - minVolume || 1;
  
  // Add 10% padding to Y-axis for better visualization
  const paddedMax = maxVolume + volumeRange * 0.1;
  const paddedMin = Math.max(0, minVolume - volumeRange * 0.1);
  const paddedRange = paddedMax - paddedMin;

  // SVG dimensions - with proper margins to show everything
  const svgWidth = 320; // Smaller width to fit on screen with margins
  const svgHeight = 220; // Smaller height to fit on screen
  const margin = { top: 15, right: 25, bottom: 35, left: 45 }; // Optimized margins
  const chartWidth = svgWidth - margin.left - margin.right;
  const chartHeight = svgHeight - margin.top - margin.bottom;

  // Calculate points for the line chart using equal spacing for training numbers
  const points = adjustedVolumeData.map((data, index) => {
    const trainingNumber = index + 1;
    // Equal spacing: divide chart width by number of intervals (length - 1)
    // If only one point, center it
    const x = adjustedVolumeData.length === 1 
      ? margin.left + chartWidth / 2
      : margin.left + (index / (adjustedVolumeData.length - 1)) * chartWidth;
    const y = margin.top + chartHeight - ((data.adjustedVolume - paddedMin) / paddedRange) * chartHeight;
    return { x, y, data, trainingNumber };
  });

  if (adjustedVolumeData.length === 0) {
    return (
      <div className="no-graph-data">
        <div className="no-graph-icon">📊</div>
        <h3>אין נתונים מפורטים</h3>
        <p>גרף הביצועים זמין רק עבור אימונים עם נתוני סטים מפורטים.</p>
        <p>התחל להשתמש בגרסה החדשה כדי לראות את הגרף!</p>
      </div>
    );
  }

  return (
    <div className="performance-graph">
      {/* Header with info button */}
      <div className="graph-header">
        <h3>גרף ביצועים - נפח מתואם</h3>
        <button 
          className="formula-info-btn"
          onClick={() => setShowFormulaInfo(true)}
          title="איך מחושב הנפח המתואם?"
        >
          ℹ️
        </button>
      </div>

      {/* Graph container */}
      <div className="graph-container">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="performance-chart">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 30" fill="none" stroke="var(--border-primary)" strokeWidth="0.5" opacity="0.3"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Y-axis */}
          <line 
            x1={margin.left} 
            y1={margin.top} 
            x2={margin.left} 
            y2={svgHeight - margin.bottom}
            stroke="var(--text-secondary)" 
            strokeWidth="2"
          />

          {/* X-axis */}
          <line 
            x1={margin.left} 
            y1={svgHeight - margin.bottom} 
            x2={svgWidth - margin.right} 
            y2={svgHeight - margin.bottom}
            stroke="var(--text-secondary)" 
            strokeWidth="2"
          />

          {/* Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
            const value = Math.round(paddedMin + ratio * paddedRange);
            const y = margin.top + chartHeight - ratio * chartHeight;
            return (
              <g key={ratio}>
                <line 
                  x1={margin.left - 5} 
                  y1={y} 
                  x2={margin.left} 
                  y2={y}
                  stroke="var(--text-secondary)" 
                />
                <text 
                  x={margin.left - 10} 
                  y={y + 4} 
                  textAnchor="end" 
                  fill="var(--text-secondary)"
                  fontSize="12"
                >
                  {value}
                </text>
              </g>
            );
          })}

          {/* X-axis labels - show all training numbers with equal spacing */}
          {points.map((point, index) => (
            <g key={index}>
              <line 
                x1={point.x} 
                y1={svgHeight - margin.bottom} 
                x2={point.x} 
                y2={svgHeight - margin.bottom + 5}
                stroke="var(--text-secondary)" 
              />
              <text 
                x={point.x} 
                y={svgHeight - margin.bottom + 18} 
                textAnchor="middle" 
                fill="var(--text-secondary)"
                fontSize="12"
              >
                {point.trainingNumber}
              </text>
            </g>
          ))}

          {/* Line chart */}
          {points.length > 1 && (
            <path
              d={`M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`}
              fill="none"
              stroke="var(--primary)"
              strokeWidth="3"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}

          {/* Data points */}
          {points.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="5"
              fill="var(--primary)"
              stroke="var(--bg-primary)"
              strokeWidth="2"
              className="data-point"
            >
              <title>
                אימון {point.trainingNumber} ({formatDateShort(point.data.date)}): {point.data.adjustedVolume} נפח מתואם
              </title>
            </circle>
          ))}

          {/* Axis labels */}
          <text 
            x={svgWidth / 2} 
            y={svgHeight - 10} 
            textAnchor="middle" 
            fill="var(--text-primary)"
            fontSize="14"
            fontWeight="600"
          >
            מספר אימון
          </text>
          
          <text 
            x="20" 
            y={svgHeight / 2} 
            textAnchor="middle" 
            fill="var(--text-primary)"
            fontSize="14"
            fontWeight="600"
            transform={`rotate(-90, 20, ${svgHeight / 2})`}
          >
            נפח מתואם
          </text>
        </svg>
      </div>

      {/* Formula explanation modal */}
      {showFormulaInfo && (
        <div className="formula-modal-overlay" onClick={() => setShowFormulaInfo(false)}>
          <div className="formula-modal" onClick={(e) => e.stopPropagation()}>
            <div className="formula-modal-header">
              <h3>איך מחושב הנפח המתואם?</h3>
              <button 
                className="formula-close-btn"
                onClick={() => setShowFormulaInfo(false)}
              >
                ✕
              </button>
            </div>
            <div className="formula-modal-content">
              <div className="formula-explanation">
                {getAdjustedVolumeFormulaExplanation().split('\n').map((line, index) => {
                  if (line.startsWith('**') && line.endsWith('**')) {
                    return <h4 key={index}>{line.replace(/\*\*/g, '')}</h4>;
                  }
                  if (line.startsWith('🏋️') || line.startsWith('⏱️') || line.startsWith('✅') || line.startsWith('📈')) {
                    return <p key={index} className="formula-component"><strong>{line}</strong></p>;
                  }
                  if (line.trim()) {
                    return <p key={index}>{line}</p>;
                  }
                  return <br key={index} />;
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExercisePerformanceGraph;
