import React from 'react';
import { getScoreColor } from '../utils/scoring';

const ScoreGauge = ({ score }) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    let color = '#ef4444'; // red-500
    if (score >= 70) color = '#22c55e'; // green-500
    else if (score >= 40) color = '#eab308'; // yellow-500

    return (
        <div className="relative flex items-center justify-center h-32 w-32">
            <svg className="transform -rotate-90 w-full h-full">
                <circle
                    cx="64"
                    cy="64"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-secondary"
                />
                <circle
                    cx="64"
                    cy="64"
                    r={radius}
                    stroke={color}
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-bold text-foreground">{score}</span>
                <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
        </div>
    );
};

export default ScoreGauge;
