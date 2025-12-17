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
 * Calculates the detailed score breakdown for a product.
 * Returns both the final score and an array of adjustments.
 * 
 * @param {Object} product - Product data from OpenFoodFacts API
 * @returns {Object|null} Score breakdown with adjustments
 */
export const calculateScoreBreakdown = (product) => {
    if (!product || !product.nutriments) return null;

    const nutriments = product.nutriments;
    const adjustments = [];
    let runningScore = BASE_SCORE;

    // Helper to add adjustment
    const addAdjustment = (label, value, points, type) => {
        if (points !== 0) {
            adjustments.push({
                label,
                value,
                points,
                type // 'penalty' or 'bonus'
            });
        }
    };

    // Energy penalty
    const energy = nutriments['energy-kcal_100g'] || 0;
    if (energy > SCORING_PENALTIES.energy.min) {
        const pts = linearScore(energy, SCORING_PENALTIES.energy.min, SCORING_PENALTIES.energy.max, SCORING_PENALTIES.energy.maxPoints);
        addAdjustment('Calories', `${Math.round(energy)} kcal`, -pts, 'penalty');
        runningScore -= pts;
    }

    // Sugar penalty
    const sugar = nutriments['sugars_100g'] || 0;
    if (sugar > SCORING_PENALTIES.sugar.min) {
        const pts = linearScore(sugar, SCORING_PENALTIES.sugar.min, SCORING_PENALTIES.sugar.max, SCORING_PENALTIES.sugar.maxPoints);
        addAdjustment('Sugars', `${sugar.toFixed(1)}g`, -pts, 'penalty');
        runningScore -= pts;
    }

    // Saturated fat penalty
    const satFat = nutriments['saturated-fat_100g'] || 0;
    if (satFat > SCORING_PENALTIES.saturatedFat.min) {
        const pts = linearScore(satFat, SCORING_PENALTIES.saturatedFat.min, SCORING_PENALTIES.saturatedFat.max, SCORING_PENALTIES.saturatedFat.maxPoints);
        addAdjustment('Saturated Fat', `${satFat.toFixed(1)}g`, -pts, 'penalty');
        runningScore -= pts;
    }

    // Sodium penalty
    const sodium = nutriments['sodium_100g'] || 0;
    if (sodium > SCORING_PENALTIES.sodium.min) {
        const pts = linearScore(sodium, SCORING_PENALTIES.sodium.min, SCORING_PENALTIES.sodium.max, SCORING_PENALTIES.sodium.maxPoints);
        addAdjustment('Sodium', `${(sodium * 1000).toFixed(0)}mg`, -pts, 'penalty');
        runningScore -= pts;
    }

    // Additives penalty
    const additivesCount = product.additives_n || 0;
    const additivesTags = product.additives_tags || [];
    if (additivesCount > 0) {
        let additivePenalty = additivesCount * SCORING_PENALTIES.additives.basePerAdditive;
        let highRiskCount = 0;

        additivesTags.forEach(tag => {
            if (HIGH_RISK_ADDITIVES.includes(tag)) {
                additivePenalty += SCORING_PENALTIES.additives.perHighRisk;
                highRiskCount++;
            } else {
                additivePenalty += SCORING_PENALTIES.additives.perOther;
            }
        });

        additivePenalty = Math.min(additivePenalty, SCORING_PENALTIES.additives.maxPoints);
        addAdjustment(
            'Additives',
            highRiskCount > 0 ? `${additivesCount} (${highRiskCount} high-risk)` : `${additivesCount} additives`,
            -additivePenalty,
            'penalty'
        );
        runningScore -= additivePenalty;
    }

    // Fiber bonus
    const fiber = nutriments['fiber_100g'] || 0;
    for (const tier of SCORING_BONUSES.fiber.thresholds) {
        if (fiber > tier.min) {
            addAdjustment('Fiber', `${fiber.toFixed(1)}g`, tier.points, 'bonus');
            runningScore += tier.points;
            break;
        }
    }

    // Protein bonus (with dirty bulk check)
    const protein = nutriments['proteins_100g'] || 0;
    let proteinBonus = 0;
    for (const tier of SCORING_BONUSES.protein.thresholds) {
        if (protein > tier.min) {
            proteinBonus = tier.points;
            break;
        }
    }

    // Apply dirty bulk penalty
    if (proteinBonus > 0 && (satFat > DIRTY_BULK_THRESHOLDS.saturatedFat || sugar > DIRTY_BULK_THRESHOLDS.sugar)) {
        proteinBonus = Math.round(proteinBonus * 0.5);
        addAdjustment('Protein', `${protein.toFixed(1)}g (reduced: high fat/sugar)`, proteinBonus, 'bonus');
    } else if (proteinBonus > 0) {
        addAdjustment('Protein', `${protein.toFixed(1)}g`, proteinBonus, 'bonus');
    }
    runningScore += proteinBonus;

    // Fruit/Veg bonus (with sugar trap check)
    const fruitVeg = nutriments['fruits-vegetables-nuts-estimate-from-ingredients_100g'] || 0;
    if (sugar <= SUGAR_TRAP_THRESHOLD) {
        for (const tier of SCORING_BONUSES.fruitVeg.thresholds) {
            if (fruitVeg > tier.min) {
                addAdjustment('Fruits/Vegetables', `${Math.round(fruitVeg)}%`, tier.points, 'bonus');
                runningScore += tier.points;
                break;
            }
        }
    }

    // Clamp score
    const finalScore = Math.max(0, Math.min(100, Math.round(runningScore)));

    return {
        score: finalScore,
        adjustments,
        baseScore: BASE_SCORE
    };
};

// Helper for linear interpolation
function linearScore(val, minVal, maxVal, maxPoints) {
    if (val <= minVal) return 0;
    if (val >= maxVal) return maxPoints;
    return Math.round(((val - minVal) / (maxVal - minVal)) * maxPoints);
}

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
