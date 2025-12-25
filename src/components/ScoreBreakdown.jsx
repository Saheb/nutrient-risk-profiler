import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Minus, Plus, Info } from 'lucide-react';
import {
    BASE_SCORE,
    SCORING_PENALTIES,
    SCORING_BONUSES,
    DIRTY_BULK_THRESHOLDS,
    SUGAR_TRAP_THRESHOLD,
    HIGH_RISK_ADDITIVES
} from '../utils/constants';

/**
import { calculateDetailedScore } from '../utils/scoring';
// BASE_SCORE is no longer directly used in this file, as it's handled by calculateDetailedScore
// import { BASE_SCORE } from '../utils/constants'; 

/**
 * ScoreBreakdown component - shows how the score was calculated
 * Now uses the centralized logic from scoring.js for robustness.
 */
// Maps to the new calculateDetailedScore output
const calculateScoreBreakdown = (product) => {
    return calculateDetailedScore(product);
};

/**
 * ScoreBreakdown component - shows how the score was calculated
 */
const ScoreBreakdown = ({ product }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const breakdown = calculateScoreBreakdown(product);

    if (!breakdown) return null;

    const penalties = breakdown.adjustments.filter(a => a.type === 'penalty');
    const bonuses = breakdown.adjustments.filter(a => a.type === 'bonus');

    return (
        <div className="w-full bg-background/50 rounded-lg border border-border/50 overflow-hidden">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-3 flex items-center justify-between hover:bg-secondary/10 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        How is this score calculated?
                    </span>
                </div>
                {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
            </button>

            {isExpanded && (
                <div className="px-3 pb-3 space-y-3">
                    {/* Base score */}
                    <div className="flex items-center justify-between text-sm py-1 border-b border-border/30">
                        <span className="text-muted-foreground">Base Score</span>
                        <span className="font-semibold">{breakdown.baseScore}</span>
                    </div>

                    {/* Penalties */}
                    {penalties.length > 0 && (
                        <div className="space-y-1.5">
                            <span className="text-xs font-medium text-red-500 uppercase">Penalties</span>
                            {penalties.map((adj, i) => (
                                <div key={i} className="flex items-center justify-between text-sm pl-2">
                                    <span className="text-foreground/80">
                                        {adj.label} <span className="text-muted-foreground text-xs">({adj.value})</span>
                                    </span>
                                    <span className="flex items-center gap-1 text-red-500 font-medium">
                                        <Minus className="h-3 w-3" />
                                        {Math.abs(adj.points)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Bonuses */}
                    {bonuses.length > 0 && (
                        <div className="space-y-1.5">
                            <span className="text-xs font-medium text-green-500 uppercase">Bonuses</span>
                            {bonuses.map((adj, i) => (
                                <div key={i} className="flex items-center justify-between text-sm pl-2">
                                    <span className="text-foreground/80">
                                        {adj.label} <span className="text-muted-foreground text-xs">({adj.value})</span>
                                    </span>
                                    <span className="flex items-center gap-1 text-green-500 font-medium">
                                        <Plus className="h-3 w-3" />
                                        {adj.points}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Final score */}
                    <div className="flex items-center justify-between text-sm pt-2 border-t border-border/30">
                        <span className="font-semibold">Final Score</span>
                        <span className="font-bold text-lg">{breakdown.score}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScoreBreakdown;
