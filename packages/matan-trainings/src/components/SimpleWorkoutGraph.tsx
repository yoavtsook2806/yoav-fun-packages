import React, { useRef, useEffect, useState } from 'react';
import { ExerciseHistoryEntry } from '../types';

interface SimpleWorkoutGraphProps {
  exerciseHistory: ExerciseHistoryEntry[];
  exerciseName: string;
  maxRestTime: number; // Coach's max recommendation for rest difficulty calculation
}

interface GraphDataPoint {
  date: string;
  weight: number;
  reps: number;
  restDifficulty: number; // maxRestTime - actualRestTime (in seconds)
  displayDate: string;
}

const SimpleWorkoutGraph: React.FC<SimpleWorkoutGraphProps> = ({
  exerciseHistory,
  exerciseName,
  maxRestTime
}) => {
  const [containerWidth, setContainerWidth] = useState(320);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State for showing/hiding each property
  const [showWeight, setShowWeight] = useState(true);
  const [showReps, setShowReps] = useState(true);
  const [showRest, setShowRest] = useState(true);

  // Update container width on mount and resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerWidth(Math.max(280, rect.width - 24)); // Account for padding, min 280px
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Prepare data points
  const dataPoints: GraphDataPoint[] = exerciseHistory
    .filter(entry => entry.setsData && entry.setsData.length > 0)
    .map(entry => {
      // Calculate averages from all sets
      const validSets = entry.setsData!.filter(set => set.weight && set.repeats);
      if (validSets.length === 0) return null;

      const avgWeight = validSets.reduce((sum, set) => sum + (set.weight || 0), 0) / validSets.length;
      const avgReps = validSets.reduce((sum, set) => sum + (set.repeats || 0), 0) / validSets.length;
      
      // Calculate rest difficulty: maxRestTime - actualRestTime (in seconds)
      const restDifficulty = Math.max(0, maxRestTime - entry.restTime);

      const date = new Date(entry.date);
      const displayDate = date.toLocaleDateString('he-IL', {
        month: '2-digit',
        day: '2-digit',
      });

      return {
        date: entry.date,
        weight: Math.round(avgWeight * 10) / 10,
        reps: Math.round(avgReps * 10) / 10,
        restDifficulty: Math.round(restDifficulty),
        displayDate
      };
    })
    .filter(point => point !== null) as GraphDataPoint[];

  if (dataPoints.length === 0) {
    return (
      <div className="simple-workout-graph" ref={containerRef}>
        <div className="graph-header">
          <h3>גרף התקדמות</h3>
        </div>
        <div className="no-data-message">
          <p>אין מספיק נתונים להצגת גרף</p>
          <p className="no-data-subtitle">בצע לפחות אימון אחד עם נתוני משקל וחזרות</p>
        </div>
      </div>
    );
  }

  // Calculate scales - put average in the middle of Y-axis
  const weights = dataPoints.map(d => d.weight);
  const reps = dataPoints.map(d => d.reps);
  const restDifficulties = dataPoints.map(d => d.restDifficulty);

  // For each metric, calculate range with average in middle
  const calculateScale = (values: number[]) => {
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Ensure average is in the middle by making range symmetric around average
    const maxDistance = Math.max(avg - min, max - avg);
    const padding = maxDistance * 0.2; // 20% padding
    
    return {
      min: Math.floor(Math.max(0, avg - maxDistance - padding)), // Floor the minimum
      max: Math.ceil(avg + maxDistance + padding), // Ceil the maximum
      avg
    };
  };

  const weightScale = calculateScale(weights);
  const repsScale = calculateScale(reps);
  const restScale = calculateScale(restDifficulties); // Rest difficulty in seconds

  // SVG dimensions
  const svgWidth = containerWidth;
  const svgHeight = 280;
  const margin = { top: 20, right: 20, bottom: 50, left: 80 }; // Increased left margin for Y-axis labels with more spacing
  const chartWidth = svgWidth - margin.left - margin.right;
  const chartHeight = svgHeight - margin.top - margin.bottom;

  // Helper functions
  const xScale = (index: number) => margin.left + (index / Math.max(1, dataPoints.length - 1)) * chartWidth;
  const yScale = (value: number, scale: { min: number; max: number }) => 
    margin.top + chartHeight - ((value - scale.min) / (scale.max - scale.min)) * chartHeight;

  // Generate path for each line
  const createPath = (values: number[], scale: { min: number; max: number }) => {
    return dataPoints.map((_, index) => {
      const x = xScale(index);
      const y = yScale(values[index], scale);
      return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    }).join(' ');
  };

  const weightPath = createPath(weights, weightScale);
  const repsPath = createPath(reps, repsScale);
  const restPath = createPath(restDifficulties, restScale);

  return (
    <div className="simple-workout-graph" ref={containerRef}>
      <div className="graph-header">
        <h3>גרף התקדמות - {exerciseName}</h3>
      </div>

      <div className="graph-legend">
        <div className="legend-item">
          <input
            type="checkbox"
            id="weight-checkbox"
            checked={showWeight}
            onChange={(e) => setShowWeight(e.target.checked)}
            className="legend-checkbox"
          />
          <label htmlFor="weight-checkbox" className="legend-label">
            <div className="legend-color weight-color"></div>
            <span>משקל</span>
          </label>
        </div>
        <div className="legend-item">
          <input
            type="checkbox"
            id="reps-checkbox"
            checked={showReps}
            onChange={(e) => setShowReps(e.target.checked)}
            className="legend-checkbox"
          />
          <label htmlFor="reps-checkbox" className="legend-label">
            <div className="legend-color reps-color"></div>
            <span>חזרות</span>
          </label>
        </div>
        <div className="legend-item">
          <input
            type="checkbox"
            id="rest-checkbox"
            checked={showRest}
            onChange={(e) => setShowRest(e.target.checked)}
            className="legend-checkbox"
          />
          <label htmlFor="rest-checkbox" className="legend-label">
            <div className="legend-color rest-color"></div>
            <span>קושי מנוחה</span>
          </label>
        </div>
      </div>

      <div className="graph-container">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="workout-chart">
          {/* Background */}
          <rect width="100%" height="100%" fill="transparent" />

          {/* Axes */}
          <line 
            x1={margin.left} 
            y1={margin.top} 
            x2={margin.left} 
            y2={svgHeight - margin.bottom}
            stroke="var(--text-secondary)" 
            strokeWidth="2"
          />
          <line 
            x1={margin.left} 
            y1={svgHeight - margin.bottom} 
            x2={svgWidth - margin.right} 
            y2={svgHeight - margin.bottom}
            stroke="var(--text-secondary)" 
            strokeWidth="2"
          />


          {/* Data lines */}
          {showWeight && (
            <path
              d={weightPath}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {showReps && (
            <path
              d={repsPath}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {showRest && (
            <path
              d={restPath}
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data points */}
          {dataPoints.map((point, index) => (
            <g key={index}>
              {/* Weight point */}
              {showWeight && (
                <circle
                  cx={xScale(index)}
                  cy={yScale(point.weight, weightScale)}
                  r="4"
                  fill="#f59e0b"
                  stroke="white"
                  strokeWidth="2"
                />
              )}
              {/* Reps point */}
              {showReps && (
                <circle
                  cx={xScale(index)}
                  cy={yScale(point.reps, repsScale)}
                  r="4"
                  fill="#3b82f6"
                  stroke="white"
                  strokeWidth="2"
                />
              )}
              {/* Rest difficulty point */}
              {showRest && (
                <circle
                  cx={xScale(index)}
                  cy={yScale(point.restDifficulty, restScale)}
                  r="4"
                  fill="#10b981"
                  stroke="white"
                  strokeWidth="2"
                />
              )}
            </g>
          ))}

          {/* X-axis labels */}
          {dataPoints.map((_, index) => (
            <text
              key={index}
              x={xScale(index)}
              y={svgHeight - margin.bottom + 20}
              textAnchor="middle"
              fontSize="12"
              fill="var(--text-secondary)"
            >
              w{index + 1}
            </text>
          ))}

          {/* Y-axis labels - 6 slots from 0 to top */}
          {Array.from({ length: 6 }, (_, i) => {
            const slotIndex = 5 - i; // 5, 4, 3, 2, 1, 0 (top to bottom)
            const yPosition = margin.top + (i * chartHeight / 5); // Divide chart into 5 intervals (6 slots)
            
            // Calculate values for each property at this Y level
            const weightValue = weightScale.min + (slotIndex / 5) * (weightScale.max - weightScale.min);
            const repsValue = repsScale.min + (slotIndex / 5) * (repsScale.max - repsScale.min);
            const restValue = restScale.min + (slotIndex / 5) * (restScale.max - restScale.min);
            
            return (
              <g key={`y-slot-${i}`}>
                {/* Weight values */}
                {showWeight && (
                  <text
                    x={margin.left - 15}
                    y={yPosition}
                    textAnchor="end"
                    fontSize="9"
                    fill="#f59e0b"
                    fontWeight="bold"
                    dominantBaseline="middle"
                  >
                    {Math.round(weightValue)}
                  </text>
                )}
                {/* Reps values */}
                {showReps && (
                  <text
                    x={margin.left - 35}
                    y={yPosition}
                    textAnchor="end"
                    fontSize="9"
                    fill="#3b82f6"
                    fontWeight="bold"
                    dominantBaseline="middle"
                  >
                    {Math.round(repsValue)}
                  </text>
                )}
                {/* Rest difficulty values */}
                {showRest && (
                  <text
                    x={margin.left - 55}
                    y={yPosition}
                    textAnchor="end"
                    fontSize="9"
                    fill="#10b981"
                    fontWeight="bold"
                    dominantBaseline="middle"
                  >
                    {Math.round(restValue)}
                  </text>
                )}
                {/* Horizontal grid line */}
                <line
                  x1={margin.left}
                  y1={yPosition}
                  x2={svgWidth - margin.right}
                  y2={yPosition}
                  stroke="var(--border-primary)"
                  strokeWidth="0.5"
                  opacity="0.3"
                />
              </g>
            );
          })}
        </svg>
      </div>
      
      {/* Explanation note */}
      <div className="graph-note">
        <p>* קושי מנוחה = זמן המנוחה המומלץ מינוס זמן המנוחה בפועל</p>
      </div>
    </div>
  );
};

export default SimpleWorkoutGraph;
