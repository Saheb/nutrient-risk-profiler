
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
    let proteinScore = calculateProteinScore(nutriments['proteins_100g'] || 0);

    // "Dirty Bulk" Penalty: If Saturated Fat > 10g OR Sugars > 20g, reduce Protein Bonus by 50%.
    // This prevents sugary protein bars or fatty snacks from scoring too high purely on protein.
    if ((nutriments['saturated-fat_100g'] || 0) > 10 || (nutriments['sugars_100g'] || 0) > 20) {
        proteinScore = Math.round(proteinScore * 0.5);
    }

    // "Sugar Trap" Rule: If sugar is high (> 30g), disable the fruit/veg bonus.
    // This prevents sugary snacks (like dried fruit mixes) from scoring artificially high.
    let fruitVegScore = 0;
    if ((nutriments['sugars_100g'] || 0) <= 30) {
        fruitVegScore = calculateFruitVegScore(nutriments['fruits-vegetables-nuts-estimate-from-ingredients_100g'] || 0);
    }

    // Base calculation: Start at 50? Or sum up?
    // Let's use a simpler approach: Start at 100 and subtract penalties.
    // Wait, Nutri-Score is complex. Let's use a simplified heuristic for this MVP.

    // Heuristic:
    // Start at 100.
    // Subtract for bad stuff.
    // Add for good stuff.
    // Clamp between 0 and 100.

    let rawScore = 100;

    rawScore -= energyScore;
    rawScore -= sugarScore;
    rawScore -= fatScore;
    rawScore -= sodiumScore;

    rawScore += fiberScore;
    rawScore += proteinScore;
    rawScore += fruitVegScore;

    // 2. Additives Penalty
    // Refined logic: Base penalty on count + specific penalty for high-risk additives.
    // Since we don't have a full risk database, we'll use a known list of high-risk additives
    // and falling back to a default penalty for unknown ones if tags are present.

    let additivesPenalty = 0;
    const additivesCount = product.additives_n || 0;
    const additivesTags = product.additives_tags || [];

    // Base penalty: 1 point per additive (to discourage highly processed foods)
    additivesPenalty += additivesCount * 1;

    // Specific Risk Penalty (Heuristic)
    // Common high-risk additives (Nitrites, BHA/BHT, some colors)
    const highRiskAdditives = [
        'en:e250', 'en:e251', 'en:e252', // Nitrites/Nitrates
        'en:e320', 'en:e321', // BHA, BHT
        'en:e102', 'en:e110', 'en:e129', 'en:e133', // Artificial Colors
        'en:e171', // Titanium Dioxide
        'en:e950', 'en:e951', 'en:e954', // Artificial Sweeteners (Aspartame, Acesulfame K, Saccharin) -> Debated, but penalized in some systems
        'en:e621', // MSG (often penalized)
        'en:e407', // Carrageenan
        'en:e338', 'en:e339', 'en:e340', 'en:e341', 'en:e450', 'en:e451', 'en:e452' // Phosphates
    ];

    additivesTags.forEach(tag => {
        if (highRiskAdditives.includes(tag)) {
            additivesPenalty += 5; // Extra 5 points for high risk
        } else {
            additivesPenalty += 2; // Extra 2 points for other additives (total 3 per additive)
        }
    });

    // Cap penalty at 40 points
    additivesPenalty = Math.min(additivesPenalty, 40);

    rawScore -= additivesPenalty;

    // 3. Organic Bonus - REMOVED
    // if (product.labels_tags && product.labels_tags.some(tag => tag.includes('organic') || tag.includes('bio'))) {
    //     rawScore += 10;
    // }

    // Clamp
    return Math.max(0, Math.min(100, Math.round(rawScore)));
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
    // Range: 300 kcal (0 pts) -> 700 kcal (30 pts)
    return linearScore(val, 300, 700, 30);
}

function calculateSugarScore(val) {
    // Range: 5g (0 pts) -> 50g (70 pts)
    // Extended range to 50g to allow differentiation at high levels
    return linearScore(val, 5, 50, 70);
}

function calculateSaturatedFatScore(val) {
    // Range: 1g (0 pts) -> 10g (50 pts)
    // Very high penalty - saturated fat is a major health concern
    // 10g sat fat = 50% daily value, should heavily penalize
    return linearScore(val, 1, 10, 50);
}

function calculateSodiumScore(val) {
    // Range: 0.2g (0 pts) -> 2g (35 pts)
    return linearScore(val, 0.2, 2, 35);
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
