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
  restDifficulty: number; // (maxRestTime - actualRest) / maxRestTime * 100
  displayDate: string;
}

const SimpleWorkoutGraph: React.FC<SimpleWorkoutGraphProps> = ({
  exerciseHistory,
  exerciseName,
  maxRestTime
}) => {
  const [containerWidth, setContainerWidth] = useState(320);
  const containerRef = useRef<HTMLDivElement>(null);

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
      
      // Calculate rest difficulty: higher value = less rest (more difficult)
      const restDifficulty = Math.max(0, Math.min(100, 
        ((maxRestTime - entry.restTime) / maxRestTime) * 100
      ));

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
      min: Math.max(0, avg - maxDistance - padding),
      max: avg + maxDistance + padding,
      avg
    };
  };

  const weightScale = calculateScale(weights);
  const repsScale = calculateScale(reps);
  const restScale = { min: 0, max: 100, avg: 50 }; // Rest difficulty is 0-100%

  // SVG dimensions
  const svgWidth = containerWidth;
  const svgHeight = 280;
  const margin = { top: 20, right: 20, bottom: 50, left: 70 }; // Increased left margin for Y-axis labels
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
          <div className="legend-color weight-color"></div>
          <span>משקל</span>
        </div>
        <div className="legend-item">
          <div className="legend-color reps-color"></div>
          <span>חזרות</span>
        </div>
        <div className="legend-item">
          <div className="legend-color rest-color"></div>
          <span>קושי מנוחה</span>
        </div>
      </div>

      <div className="graph-container">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="workout-chart">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 30" fill="none" stroke="var(--border-primary)" strokeWidth="0.5" opacity="0.2"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

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

          {/* Average lines (horizontal) */}
          <line
            x1={margin.left}
            y1={yScale(weightScale.avg, weightScale)}
            x2={svgWidth - margin.right}
            y2={yScale(weightScale.avg, weightScale)}
            stroke="#f59e0b"
            strokeWidth="1"
            strokeDasharray="5,5"
            opacity="0.5"
          />
          <line
            x1={margin.left}
            y1={yScale(repsScale.avg, repsScale)}
            x2={svgWidth - margin.right}
            y2={yScale(repsScale.avg, repsScale)}
            stroke="#3b82f6"
            strokeWidth="1"
            strokeDasharray="5,5"
            opacity="0.5"
          />

          {/* Data lines */}
          <path
            d={weightPath}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={repsPath}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={restPath}
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {dataPoints.map((point, index) => (
            <g key={index}>
              {/* Weight point */}
              <circle
                cx={xScale(index)}
                cy={yScale(point.weight, weightScale)}
                r="4"
                fill="#f59e0b"
                stroke="white"
                strokeWidth="2"
              />
              {/* Reps point */}
              <circle
                cx={xScale(index)}
                cy={yScale(point.reps, repsScale)}
                r="4"
                fill="#3b82f6"
                stroke="white"
                strokeWidth="2"
              />
              {/* Rest difficulty point */}
              <circle
                cx={xScale(index)}
                cy={yScale(point.restDifficulty, restScale)}
                r="4"
                fill="#10b981"
                stroke="white"
                strokeWidth="2"
              />
            </g>
          ))}

          {/* X-axis labels */}
          {dataPoints.map((point, index) => (
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

          {/* Y-axis labels for all three properties */}
          {dataPoints.map((point, index) => (
            <g key={`y-labels-${index}`}>
              {/* Weight values */}
              <text
                x={margin.left - 15}
                y={yScale(point.weight, weightScale)}
                textAnchor="end"
                fontSize="9"
                fill="#f59e0b"
                fontWeight="bold"
                dominantBaseline="middle"
              >
                {point.weight}
              </text>
              {/* Reps values */}
              <text
                x={margin.left - 30}
                y={yScale(point.reps, repsScale)}
                textAnchor="end"
                fontSize="9"
                fill="#3b82f6"
                fontWeight="bold"
                dominantBaseline="middle"
              >
                {point.reps}
              </text>
              {/* Rest difficulty values */}
              <text
                x={margin.left - 45}
                y={yScale(point.restDifficulty, restScale)}
                textAnchor="end"
                fontSize="9"
                fill="#10b981"
                fontWeight="bold"
                dominantBaseline="middle"
              >
                {point.restDifficulty}%
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};

export default SimpleWorkoutGraph;
