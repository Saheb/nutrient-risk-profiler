import { SCORING_PENALTIES } from './constants';


/**
 * Calculates a risk score from 0 (Bad) to 100 (Good) for a product.
 * Based on a simplified Nutri-Score algorithm + Additives penalty.
 */
/**
 * Calculates detailed risk score breakdown.
 * Returns { score, adjustments, baseScore }
 */
export const calculateDetailedScore = (product) => {
    if (!product || !product.nutriments) return null;

    const nutriments = product.nutriments;

    // Check for essential nutrients
    const requiredNutrients = ['energy-kcal_100g', 'sugars_100g', 'saturated-fat_100g', 'sodium_100g'];
    const hasData = requiredNutrients.every(key => nutriments[key] !== undefined && nutriments[key] !== null);

    if (!hasData) {
        // Try fallback for energy (kJ)
        if (!(nutriments['energy-kj_100g'] !== undefined &&
            nutriments['sugars_100g'] !== undefined &&
            nutriments['saturated-fat_100g'] !== undefined &&
            nutriments['sodium_100g'] !== undefined)) {
            return null;
        }
    }

    const adjustments = [];
    let runningScore = 100; // Base Score

    const addAdjustment = (label, value, points, type) => {
        if (points !== 0) {
            adjustments.push({ label, value, points, type });
        }
    };

    // --- Penalties ---

    // Energy
    const energyVal = nutriments['energy-kcal_100g'] || 0;
    const energyScore = calculateEnergyScore(energyVal);
    addAdjustment('Calories', `${Math.round(energyVal)} kcal`, -energyScore, 'penalty');
    runningScore -= energyScore;

    // Sugar
    const sugarVal = nutriments['sugars_100g'] || 0;
    const sugarScore = calculateSugarScore(sugarVal);
    addAdjustment('Sugars', `${sugarVal.toFixed(1)}g`, -sugarScore, 'penalty');
    runningScore -= sugarScore;

    // Saturated Fat
    const satFatVal = nutriments['saturated-fat_100g'] || 0;
    const satFatScore = calculateSaturatedFatScore(satFatVal);
    addAdjustment('Saturated Fat', `${satFatVal.toFixed(1)}g`, -satFatScore, 'penalty');
    runningScore -= satFatScore;

    // Total Fat -> Now "Other Fats" (Total - Saturated) to avoid double counting
    const totalFatVal = nutriments['fat_100g'] || 0;
    const otherFatVal = Math.max(0, totalFatVal - satFatVal);

    // We reuse the total fat scoring curve for the "other" fats.
    const otherFatScore = calculateTotalFatScore(otherFatVal);
    addAdjustment('Other Fats', `${otherFatVal.toFixed(1)}g`, -otherFatScore, 'penalty');
    runningScore -= otherFatScore;

    // Sodium
    const sodiumVal = nutriments['sodium_100g'] || 0;
    const sodiumScore = calculateSodiumScore(sodiumVal);
    addAdjustment('Sodium', `${(sodiumVal * 1000).toFixed(0)}mg`, -sodiumScore, 'penalty');
    runningScore -= sodiumScore;

    // Additives
    let additivesPenalty = 0;
    const additivesCount = product.additives_n || 0;
    const additivesTags = product.additives_tags || [];

    // Base penalty
    additivesPenalty += additivesCount * 1;

    // High Risk Penalty
    const highRiskAdditives = [
        'en:e250', 'en:e251', 'en:e252', // Nitrites/Nitrates
        'en:e320', 'en:e321', // BHA, BHT
        'en:e102', 'en:e110', 'en:e129', 'en:e133', // Artificial Colors
        'en:e171', // Titanium Dioxide
        'en:e950', 'en:e951', 'en:e954', // Artificial Sweeteners
        'en:e621', // MSG
        'en:e407', // Carrageenan
        'en:e338', 'en:e339', 'en:e340', 'en:e341', 'en:e450', 'en:e451', 'en:e452' // Phosphates
    ];

    let highRiskCount = 0;
    additivesTags.forEach(tag => {
        if (highRiskAdditives.includes(tag)) {
            additivesPenalty += 5;
            highRiskCount++;
        } else {
            additivesPenalty += 2;
        }
    });

    additivesPenalty = Math.min(additivesPenalty, 40);
    // Add logic to describe additives better
    const additiveLabel = highRiskCount > 0 ? `${additivesCount} (High Risk)` : `${additivesCount} additives`;
    addAdjustment('Additives', additiveLabel, -additivesPenalty, 'penalty');
    runningScore -= additivesPenalty;


    // --- Bonuses ---

    // Fiber
    const fiberVal = nutriments['fiber_100g'] || 0;
    const fiberScore = calculateFiberScore(fiberVal);
    addAdjustment('Fiber', `${fiberVal.toFixed(1)}g`, fiberScore, 'bonus');
    runningScore += fiberScore;

    // Protein
    const proteinVal = nutriments['proteins_100g'] || 0;
    let proteinScore = calculateProteinScore(proteinVal);

    // Dirty Bulk Logic
    let proteinLabel = `${proteinVal.toFixed(1)}g`;
    if ((nutriments['saturated-fat_100g'] || 0) > 10 || (nutriments['sugars_100g'] || 0) > 20) {
        proteinScore = Math.round(proteinScore * 0.5);
        proteinLabel += ' (reduced: high fat/sugar)';
    }
    addAdjustment('Protein', proteinLabel, proteinScore, 'bonus');
    runningScore += proteinScore;

    // Fruit/Veg
    let fruitVegScore = 0;
    const fruitVegVal = nutriments['fruits-vegetables-nuts-estimate-from-ingredients_100g'] || 0;
    if ((nutriments['sugars_100g'] || 0) <= 30) {
        fruitVegScore = calculateFruitVegScore(fruitVegVal);
        addAdjustment('Fruits/Vegetables', `${Math.round(fruitVegVal)}%`, fruitVegScore, 'bonus');
    }
    runningScore += fruitVegScore;

    // 3. Organic Bonus - REMOVED
    // if (product.labels_tags && product.labels_tags.some(tag => tag.includes('organic') || tag.includes('bio'))) {
    //     rawScore += 10;
    // }

    const finalScore = Math.max(0, Math.min(100, Math.round(runningScore)));

    return {
        score: finalScore,
        adjustments: adjustments,
        baseScore: 100
    };
};

/**
 * Calculates a risk score from 0 (Bad) to 100 (Good) for a product.
 * Based on a simplified Nutri-Score algorithm + Additives penalty.
 */
export const calculateScore = (product) => {
    const result = calculateDetailedScore(product);
    return result ? result.score : null;
};

// Helpers - These return "Penalty points" (positive numbers to be subtracted)
// Helper for linear interpolation
function linearScore(val, minVal, maxVal, maxPoints) {
    if (val <= minVal) return 0;
    if (val >= maxVal) return maxPoints;
    // Linear mapping
    return Math.round(((val - minVal) / (maxVal - minVal)) * maxPoints);
}

function calculateEnergyScore(val) {
    const { min, max, maxPoints } = SCORING_PENALTIES.energy;
    return linearScore(val, min, max, maxPoints);
}

function calculateSugarScore(val) {
    const { min, max, maxPoints } = SCORING_PENALTIES.sugar;
    return linearScore(val, min, max, maxPoints);
}

function calculateTotalFatScore(val) {
    const { min, max, maxPoints } = SCORING_PENALTIES.totalFat;
    return linearScore(val, min, max, maxPoints);
}

function calculateSaturatedFatScore(val) {
    const { min, max, maxPoints } = SCORING_PENALTIES.saturatedFat;
    return linearScore(val, min, max, maxPoints);
}

function calculateSodiumScore(val) {
    const { min, max, maxPoints } = SCORING_PENALTIES.sodium;
    return linearScore(val, min, max, maxPoints);
}

// Helpers - These return "Bonus points" (positive numbers to be added)
function calculateFiberScore(val) {
    if (val > 8) return 10;
    if (val > 5) return 7;
    if (val > 3) return 4;
    return 0;
}

function calculateProteinScore(val) {
    if (val > 15) return 15;
    if (val > 10) return 10;
    if (val > 5) return 5;
    return 0;
}

function calculateFruitVegScore(val) {
    if (val > 80) return 15;
    if (val > 60) return 10;
    if (val > 40) return 5;
    return 0;
}

export const getScoreColor = (score) => {
    if (score === null || score === undefined) return 'bg-gray-200 text-gray-500';
    if (score >= 90) return 'bg-emerald-600 text-white'; // Excellent (Darker Green)
    if (score >= 70) return 'bg-green-500 text-white'; // Good (Green)
    if (score >= 40) return 'bg-yellow-500 text-white'; // Moderate
    if (score >= 20) return 'bg-red-500 text-white'; // Poor
    return 'bg-red-900 text-white'; // Bad (Dark Red)
};

export const getScoreLabel = (score) => {
    if (score === null || score === undefined) return 'Unknown';
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 40) return 'Moderate';
    if (score >= 20) return 'Poor';
    return 'Bad';
};

export const getNutrientLevel = (nutrient, value) => {
    if (value === undefined || value === null) return 'unknown';

    // Thresholds based on FSA/Nutri-Score general guidelines (simplified)
    switch (nutrient) {
        case 'sugar':
            if (value > 22.5) return 'high';
            if (value > 5) return 'medium';
            return 'low';
        case 'added-sugars':
            if (value > 12.5) return 'high';
            if (value > 5) return 'medium';
            return 'low';
        case 'fat':
            if (value > 17.5) return 'high';
            if (value > 3) return 'medium';
            return 'low';
        case 'saturated-fat':
            if (value > 5) return 'high';
            if (value > 1.5) return 'medium';
            return 'low';
        case 'trans-fat':
            if (value > 1) return 'high';
            if (value > 0.1) return 'medium';
            return 'low';
        case 'sodium': // Salt = Sodium * 2.5. High salt > 1.5g (Sodium > 0.6g)
            if (value > 0.6) return 'high';
            if (value > 0.1) return 'medium';
            return 'low';
        case 'fiber': // Higher is better
            if (value > 3) return 'good';
            return 'neutral';
        case 'protein': // Higher is better
            if (value > 8) return 'good';
            return 'neutral';
        default:
            return 'neutral';
    }
};
