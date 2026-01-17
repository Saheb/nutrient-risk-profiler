/**
 * Scoring Constants for Nutrient Risk Profiler
 * Centralized configuration for easier tuning and transparency.
 */

// Base score
export const BASE_SCORE = 100;
export const MIN_SCORE = 0;
export const MAX_SCORE = 100;

// Penalty thresholds and max points
export const SCORING_PENALTIES = {
    energy: {
        min: 300,      // kcal - no penalty below this
        max: 700,      // kcal - max penalty at/above this
        maxPoints: 40
    },
    sugar: {
        min: 5,        // grams
        max: 50,       // grams
        maxPoints: 70
    },
    totalFat: {
        min: 5,        // grams
        max: 35,       // grams
        maxPoints: 30
    },
    saturatedFat: {
        min: 1,        // grams
        max: 20,       // grams (moved from 10 to 20 to strictly penalize only extremely high values)
        maxPoints: 50
    },
    sodium: {
        min: 0.2,      // grams
        max: 2,        // grams
        maxPoints: 35
    },
    netCarbs: {
        min: 20,       // grams (Carbs - Fiber) - no penalty below this
        max: 60,       // grams - max penalty at/above this  
        maxPoints: 25  // moderate penalty since sugars are already penalized separately
    },
    additives: {
        basePerAdditive: 1,
        perHighRisk: 5,
        perOther: 2,
        maxPoints: 40
    }
};



// Bonus thresholds
export const SCORING_BONUSES = {
    fiber: {
        thresholds: [
            { min: 8, points: 10 },
            { min: 5, points: 7 },
            { min: 3, points: 4 }
        ]
    },
    protein: {
        thresholds: [
            { min: 15, points: 15 },
            { min: 10, points: 10 },
            { min: 5, points: 5 }
        ]
    },
    fruitVeg: {
        thresholds: [
            { min: 80, points: 15 },
            { min: 60, points: 10 },
            { min: 40, points: 5 }
        ]
    }
};

// Dirty Bulk penalty thresholds
export const DIRTY_BULK_THRESHOLDS = {
    saturatedFat: 10,  // grams - protein bonus halved if exceeded
    sugar: 20          // grams - protein bonus halved if exceeded
};

// Sugar Trap threshold - disables fruit/veg bonus
export const SUGAR_TRAP_THRESHOLD = 30; // grams

// High-risk additives (e-numbers)
export const HIGH_RISK_ADDITIVES = [
    'en:e250', 'en:e251', 'en:e252', // Nitrites/Nitrates
    'en:e320', 'en:e321',             // BHA, BHT
    'en:e102', 'en:e110', 'en:e129', 'en:e133', // Artificial Colors
    'en:e171',                        // Titanium Dioxide
    'en:e950', 'en:e951', 'en:e954', // Artificial Sweeteners
    'en:e621',                        // MSG
    'en:e407',                        // Carrageenan
    'en:e338', 'en:e339', 'en:e340', 'en:e341', 'en:e450', 'en:e451', 'en:e452' // Phosphates
];

// Nutrient level thresholds (for UI display)
export const NUTRIENT_LEVELS = {
    sugar: { high: 22.5, medium: 5 },
    'added-sugars': { high: 12.5, medium: 5 },
    fat: { high: 17.5, medium: 3 },
    'saturated-fat': { high: 5, medium: 1.5 },
    'trans-fat': { high: 1, medium: 0.1 },
    sodium: { high: 0.6, medium: 0.1 },
    fiber: { good: 3 },
    protein: { good: 8 }
};

// Score categories
export const SCORE_CATEGORIES = [
    { min: 90, label: 'Excellent', colorClass: 'bg-emerald-600 text-white' },
    { min: 70, label: 'Good', colorClass: 'bg-green-500 text-white' },
    { min: 40, label: 'Moderate', colorClass: 'bg-yellow-500 text-white' },
    { min: 20, label: 'Poor', colorClass: 'bg-red-500 text-white' },
    { min: 0, label: 'Bad', colorClass: 'bg-red-900 text-white' }
];

// Required nutrients for score calculation
export const REQUIRED_NUTRIENTS = [
    'energy-kcal_100g',
    'sugars_100g',
    'saturated-fat_100g',
    'sodium_100g'
];
