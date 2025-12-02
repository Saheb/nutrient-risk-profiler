
/**
 * Calculates a risk score from 0 (Bad) to 100 (Good) for a product.
 * Based on a simplified Nutri-Score algorithm + Additives penalty.
 */
export const calculateScore = (product) => {
    if (!product || !product.nutriments) return null;

    let score = 0;
    const nutriments = product.nutriments;

    // Check for essential nutrients. If any are missing, we cannot calculate a reliable score.
    // We check for undefined because 0 is a valid value.
    const requiredNutrients = ['energy-kcal_100g', 'sugars_100g', 'saturated-fat_100g', 'sodium_100g'];
    const hasData = requiredNutrients.every(key => nutriments[key] !== undefined && nutriments[key] !== null);

    if (!hasData) {
        // Try fallback for energy (kJ) if kcal is missing
        if (nutriments['energy-kj_100g'] !== undefined &&
            nutriments['sugars_100g'] !== undefined &&
            nutriments['saturated-fat_100g'] !== undefined &&
            nutriments['sodium_100g'] !== undefined) {
            // We have enough data (using kJ)
        } else {
            return null;
        }
    }

    // 1. Nutritional Score (Base 0-100)
    // We start with a baseline and subtract points for "bad" nutrients and add for "good".
    // However, to map to 0-100 where 100 is best, we'll calculate a "health score".

    // Negative factors (Lower is better) - Max penalty 40 points each
    const energyScore = calculateEnergyScore(nutriments['energy-kcal_100g'] || 0);
    const sugarScore = calculateSugarScore(nutriments['sugars_100g'] || 0);
    const fatScore = calculateSaturatedFatScore(nutriments['saturated-fat_100g'] || 0);
    const sodiumScore = calculateSodiumScore(nutriments['sodium_100g'] || 0);

    // Positive factors (Higher is better) - Max bonus 15 points each
    const fiberScore = calculateFiberScore(nutriments['fiber_100g'] || 0);
    const proteinScore = calculateProteinScore(nutriments['proteins_100g'] || 0);
    const fruitVegScore = calculateFruitVegScore(nutriments['fruits-vegetables-nuts-estimate-from-ingredients_100g'] || 0);

    // Base calculation: Start at 50? Or sum up?
    // Let's use a simpler approach: Start at 100 and subtract penalties.
    // Wait, Nutri-Score is complex. Let's use a simplified heuristic for this MVP.

    // Heuristic:
    // Start at 80.
    // Subtract for bad stuff.
    // Add for good stuff.
    // Clamp between 0 and 100.

    let rawScore = 90;

    rawScore -= energyScore;
    rawScore -= sugarScore;
    rawScore -= fatScore;
    rawScore -= sodiumScore;

    rawScore += fiberScore;
    rawScore += proteinScore;
    rawScore += fruitVegScore;

    // 2. Additives Penalty
    // OpenFoodFacts provides 'additives_n' (number of additives) and 'additives_tags' (risk levels).
    // We'll penalize based on count and risk.
    const additivesCount = product.additives_n || 0;
    // Simple penalty: 3 points per additive (capped at 30)
    const additivesPenalty = Math.min(additivesCount * 3, 30);

    rawScore -= additivesPenalty;

    // 3. Organic Bonus - REMOVED
    // if (product.labels_tags && product.labels_tags.some(tag => tag.includes('organic') || tag.includes('bio'))) {
    //     rawScore += 10;
    // }

    // Clamp
    return Math.max(0, Math.min(100, Math.round(rawScore)));
};

// Helpers - These return "Penalty points" (positive numbers to be subtracted)
function calculateEnergyScore(val) {
    // > 800 kcal is very high. 
    if (val > 700) return 30;
    if (val > 500) return 20;
    if (val > 350) return 15;
    if (val > 200) return 5;
    return 0;
}

function calculateSugarScore(val) {
    // > 50g is huge
    if (val > 40) return 30;
    if (val > 30) return 25;
    if (val > 20) return 20;
    if (val > 10) return 15;
    if (val > 5) return 5;
    return 0;
}

function calculateSaturatedFatScore(val) {
    if (val > 10) return 25;
    if (val > 7) return 20;
    if (val > 4) return 15;
    if (val > 2) return 5;
    return 0;
}

function calculateSodiumScore(val) {
    // Sodium in g. Salt = Sodium * 2.5
    if (val > 2) return 35; // Very salty
    if (val > 1) return 25;
    if (val > 0.5) return 10;
    if (val > 0.2) return 5;
    return 0;
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
