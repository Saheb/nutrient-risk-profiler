
/**
 * Calculates a risk score from 0 (Bad) to 100 (Good) for a product.
 * Based on the official Nutri-Score algorithm.
 * 
 * Nutri-Score = Negative Points (N) - Positive Points (P)
 * 
 * Negative Points (0-40):
 * - Energy (kJ) (0-10)
 * - Sugars (g) (0-10)
 * - Saturated Fat (g) (0-10)
 * - Sodium (mg) (0-10)
 * 
 * Positive Points (0-15):
 * - Fruits, Vegetables, Legumes, Nuts, Oils (FVLN) % (0-5)
 * - Fiber (g) (0-5)
 * - Protein (g) (0-5)
 * 
 * Final Score Range: -15 (Best) to +40 (Worst)
 * We map this to 0-100 (Best).
 */
export const calculateScore = (product) => {
    if (!product || !product.nutriments) return null;

    const nutriments = product.nutriments;

    // 1. Calculate Negative Points (N)
    // Energy (kJ)
    const energyKj = (nutriments['energy-kcal_100g'] || 0) * 4.184; // Convert kcal to kJ if needed, or use energy-kj_100g
    const energyPoints = getPoints(energyKj, energyTable);

    // Sugars (g)
    const sugars = nutriments['sugars_100g'] || 0;
    const sugarPoints = getPoints(sugars, sugarsTable);

    // Saturated Fat (g)
    const satFat = nutriments['saturated-fat_100g'] || 0;
    const satFatPoints = getPoints(satFat, satFatTable);

    // Sodium (mg)
    const sodium = (nutriments['sodium_100g'] || 0) * 1000; // g to mg
    const sodiumPoints = getPoints(sodium, sodiumTable);

    const negativePoints = energyPoints + sugarPoints + satFatPoints + sodiumPoints;

    // 2. Calculate Positive Points (P)
    // FVLN (%)
    const fvln = nutriments['fruits-vegetables-nuts-estimate-from-ingredients_100g'] || 0;
    const fvlnPoints = getPoints(fvln, fvlnTable);

    // Fiber (g)
    const fiber = nutriments['fiber_100g'] || 0;
    const fiberPoints = getPoints(fiber, fiberTable);

    // Protein (g)
    const protein = nutriments['proteins_100g'] || 0;
    const proteinPoints = getPoints(protein, proteinTable);

    // 3. Calculate Final Nutri-Score
    let positivePoints = 0;

    // Special rule for protein:
    // If N >= 11, protein is not counted unless FVLN points >= 5
    if (negativePoints >= 11 && fvlnPoints < 5) {
        positivePoints = fvlnPoints + fiberPoints;
    } else {
        positivePoints = fvlnPoints + fiberPoints + proteinPoints;
    }

    const nutriScore = negativePoints - positivePoints;

    // 4. Map to 0-100 Scale
    // Nutri-Score range: -15 (Best) to 40 (Worst)
    // We want 100 (Best) to 0 (Worst)
    // Linear mapping: 
    // Score = 100 - ((nutriScore - min) / (max - min)) * 100
    // min = -15, max = 40, range = 55

    // Clamp Nutri-Score just in case
    const clampedNutriScore = Math.max(-15, Math.min(40, nutriScore));

    const normalizedScore = 100 - ((clampedNutriScore + 15) / 55) * 100;

    return Math.round(normalizedScore);
};

// --- Points Tables ---

// Helper to find points from a table
// Table format: [threshold, points]
// If value > threshold, take those points. 
// We iterate from highest threshold down? Or lowest up?
// The tables usually say " > X ".
const getPoints = (value, table) => {
    for (let i = table.length - 1; i >= 0; i--) {
        if (value > table[i].threshold) {
            return table[i].points;
        }
    }
    return 0; // Default if <= lowest threshold
};

// Energy (kJ/100g)
const energyTable = [
    { threshold: 3350, points: 10 },
    { threshold: 3015, points: 9 },
    { threshold: 2680, points: 8 },
    { threshold: 2345, points: 7 },
    { threshold: 2010, points: 6 },
    { threshold: 1675, points: 5 },
    { threshold: 1340, points: 4 },
    { threshold: 1005, points: 3 },
    { threshold: 670, points: 2 },
    { threshold: 335, points: 1 },
    { threshold: -1, points: 0 } // <= 335
];

// Sugars (g/100g)
const sugarsTable = [
    { threshold: 45, points: 10 },
    { threshold: 40, points: 9 },
    { threshold: 36, points: 8 },
    { threshold: 31, points: 7 },
    { threshold: 27, points: 6 },
    { threshold: 22.5, points: 5 },
    { threshold: 18, points: 4 },
    { threshold: 13.5, points: 3 },
    { threshold: 9, points: 2 },
    { threshold: 4.5, points: 1 },
    { threshold: -1, points: 0 }
];

// Saturated Fat (g/100g)
const satFatTable = [
    { threshold: 10, points: 10 },
    { threshold: 9, points: 9 },
    { threshold: 8, points: 8 },
    { threshold: 7, points: 7 },
    { threshold: 6, points: 6 },
    { threshold: 5, points: 5 },
    { threshold: 4, points: 4 },
    { threshold: 3, points: 3 },
    { threshold: 2, points: 2 },
    { threshold: 1, points: 1 },
    { threshold: -1, points: 0 }
];

// Sodium (mg/100g)
const sodiumTable = [
    { threshold: 900, points: 10 },
    { threshold: 810, points: 9 },
    { threshold: 720, points: 8 },
    { threshold: 630, points: 7 },
    { threshold: 540, points: 6 },
    { threshold: 450, points: 5 },
    { threshold: 360, points: 4 },
    { threshold: 270, points: 3 },
    { threshold: 180, points: 2 },
    { threshold: 90, points: 1 },
    { threshold: -1, points: 0 }
];

// FVLN (%) - Positive Points
const fvlnTable = [
    { threshold: 80, points: 5 },
    { threshold: 60, points: 2 }, // Note: skip in points (1, 2, 5)
    { threshold: 40, points: 1 },
    { threshold: -1, points: 0 }
];
// Wait, official table is: >80=5, >60=2, >40=1. 
// Actually for general foods: >80=5, >60=2, >40=1. 
// Let's stick to this for now.

// Fiber (g/100g)
const fiberTable = [
    { threshold: 4.7, points: 5 },
    { threshold: 3.7, points: 4 },
    { threshold: 2.8, points: 3 },
    { threshold: 1.9, points: 2 },
    { threshold: 0.9, points: 1 },
    { threshold: -1, points: 0 }
];

// Protein (g/100g)
const proteinTable = [
    { threshold: 8.0, points: 5 },
    { threshold: 6.4, points: 4 },
    { threshold: 4.8, points: 3 },
    { threshold: 3.2, points: 2 },
    { threshold: 1.6, points: 1 },
    { threshold: -1, points: 0 }
];


export const getScoreColor = (score) => {
    if (score === null || score === undefined) return 'bg-gray-200 text-gray-500';
    // Map 0-100 to Nutri-Score colors
    // A: 80-100 (approx -1 to -15)
    // B: 70-79 (approx 0 to 2)
    // C: 55-69 (approx 3 to 10)
    // D: 40-54 (approx 11 to 18)
    // E: 0-39 (approx 19 to 40)

    if (score >= 80) return 'bg-[#038141] text-white'; // Dark Green (A)
    if (score >= 70) return 'bg-[#85BB2F] text-white'; // Light Green (B)
    if (score >= 55) return 'bg-[#FECB02] text-black'; // Yellow (C)
    if (score >= 40) return 'bg-[#EE8100] text-white'; // Orange (D)
    return 'bg-[#E63E11] text-white'; // Red (E)
};

export const getScoreLabel = (score) => {
    if (score === null || score === undefined) return 'Unknown';
    if (score >= 80) return 'Excellent (A)';
    if (score >= 70) return 'Good (B)';
    if (score >= 55) return 'Moderate (C)';
    if (score >= 40) return 'Poor (D)';
    return 'Bad (E)';
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
