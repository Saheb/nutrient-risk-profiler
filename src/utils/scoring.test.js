import { describe, it, expect } from 'vitest';
import { calculateScore, getScoreColor, getScoreLabel, getNutrientLevel } from './scoring';

describe('calculateScore', () => {
    it('returns null for invalid product', () => {
        expect(calculateScore(null)).toBeNull();
        expect(calculateScore({})).toBeNull();
        expect(calculateScore({ nutriments: {} })).toBeNull();
    });

    it('returns 100 for a perfect product with minimal bad nutrients', () => {
        const product = {
            nutriments: {
                'energy-kcal_100g': 100,
                'sugars_100g': 2,
                'saturated-fat_100g': 0.5,
                'sodium_100g': 0.1,
                'fiber_100g': 10,
                'proteins_100g': 20
            }
        };
        const score = calculateScore(product);
        expect(score).toBe(100); // Capped at 100
    });

    it('penalizes high sugar products', () => {
        const lowSugar = {
            nutriments: {
                'energy-kcal_100g': 200,
                'sugars_100g': 4,
                'saturated-fat_100g': 1,
                'sodium_100g': 0.2
            }
        };
        const highSugar = {
            nutriments: {
                'energy-kcal_100g': 200,
                'sugars_100g': 45,
                'saturated-fat_100g': 1,
                'sodium_100g': 0.2
            }
        };
        const lowScore = calculateScore(lowSugar);
        const highScore = calculateScore(highSugar);
        expect(highScore).toBeLessThan(lowScore);
    });

    it('penalizes high sodium products', () => {
        const lowSodium = {
            nutriments: {
                'energy-kcal_100g': 200,
                'sugars_100g': 5,
                'saturated-fat_100g': 1,
                'sodium_100g': 0.1
            }
        };
        const highSodium = {
            nutriments: {
                'energy-kcal_100g': 200,
                'sugars_100g': 5,
                'saturated-fat_100g': 1,
                'sodium_100g': 1.8
            }
        };
        expect(calculateScore(highSodium)).toBeLessThan(calculateScore(lowSodium));
    });

    it('penalizes additives', () => {
        const noAdditives = {
            nutriments: {
                'energy-kcal_100g': 200,
                'sugars_100g': 5,
                'saturated-fat_100g': 1,
                'sodium_100g': 0.2
            },
            additives_n: 0,
            additives_tags: []
        };
        const withAdditives = {
            nutriments: {
                'energy-kcal_100g': 200,
                'sugars_100g': 5,
                'saturated-fat_100g': 1,
                'sodium_100g': 0.2
            },
            additives_n: 5,
            additives_tags: ['en:e250', 'en:e621', 'en:e102']
        };
        expect(calculateScore(withAdditives)).toBeLessThan(calculateScore(noAdditives));
    });

    it('gives protein bonus', () => {
        // Use higher base penalties so scores don't both cap at 100
        const lowProtein = {
            nutriments: {
                'energy-kcal_100g': 400,
                'sugars_100g': 15,
                'saturated-fat_100g': 3,
                'sodium_100g': 0.4,
                'proteins_100g': 2
            }
        };
        const highProtein = {
            nutriments: {
                'energy-kcal_100g': 400,
                'sugars_100g': 15,
                'saturated-fat_100g': 3,
                'sodium_100g': 0.4,
                'proteins_100g': 20
            }
        };
        expect(calculateScore(highProtein)).toBeGreaterThan(calculateScore(lowProtein));
    });

    it('reduces protein bonus for dirty bulk (high fat/sugar)', () => {
        const cleanProtein = {
            nutriments: {
                'energy-kcal_100g': 200,
                'sugars_100g': 10,
                'saturated-fat_100g': 5,
                'sodium_100g': 0.2,
                'proteins_100g': 20
            }
        };
        const dirtyProtein = {
            nutriments: {
                'energy-kcal_100g': 200,
                'sugars_100g': 25, // > 20g triggers dirty bulk
                'saturated-fat_100g': 5,
                'sodium_100g': 0.2,
                'proteins_100g': 20
            }
        };
        // Dirty bulk should have lower score due to reduced protein bonus
        // But also higher sugar penalty, so definitely lower
        expect(calculateScore(dirtyProtein)).toBeLessThan(calculateScore(cleanProtein));
    });

    it('disables fruit/veg bonus for sugar trap (high sugar)', () => {
        const normalFruit = {
            nutriments: {
                'energy-kcal_100g': 200,
                'sugars_100g': 20,
                'saturated-fat_100g': 1,
                'sodium_100g': 0.2,
                'fruits-vegetables-nuts-estimate-from-ingredients_100g': 90
            }
        };
        const sugarTrap = {
            nutriments: {
                'energy-kcal_100g': 200,
                'sugars_100g': 35, // > 30g triggers sugar trap
                'saturated-fat_100g': 1,
                'sodium_100g': 0.2,
                'fruits-vegetables-nuts-estimate-from-ingredients_100g': 90
            }
        };
        // Sugar trap loses fruit/veg bonus AND has higher sugar penalty
        expect(calculateScore(sugarTrap)).toBeLessThan(calculateScore(normalFruit));
    });

    it('clamps score between 0 and 100', () => {
        const veryBad = {
            nutriments: {
                'energy-kcal_100g': 800,
                'sugars_100g': 60,
                'saturated-fat_100g': 20,
                'sodium_100g': 3
            },
            additives_n: 15,
            additives_tags: ['en:e250', 'en:e251', 'en:e252', 'en:e320', 'en:e321']
        };
        const score = calculateScore(veryBad);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
    });
});

describe('getScoreColor', () => {
    it('returns correct colors for score ranges', () => {
        expect(getScoreColor(95)).toContain('emerald');
        expect(getScoreColor(75)).toContain('green');
        expect(getScoreColor(50)).toContain('yellow');
        expect(getScoreColor(25)).toContain('red-500');
        expect(getScoreColor(10)).toContain('red-900');
    });

    it('handles null/undefined', () => {
        expect(getScoreColor(null)).toContain('gray');
        expect(getScoreColor(undefined)).toContain('gray');
    });
});

describe('getScoreLabel', () => {
    it('returns correct labels', () => {
        expect(getScoreLabel(95)).toBe('Excellent');
        expect(getScoreLabel(75)).toBe('Good');
        expect(getScoreLabel(50)).toBe('Moderate');
        expect(getScoreLabel(25)).toBe('Poor');
        expect(getScoreLabel(10)).toBe('Bad');
    });

    it('handles null/undefined', () => {
        expect(getScoreLabel(null)).toBe('Unknown');
        expect(getScoreLabel(undefined)).toBe('Unknown');
    });
});

describe('getNutrientLevel', () => {
    it('classifies sugar levels correctly', () => {
        expect(getNutrientLevel('sugar', 25)).toBe('high');
        expect(getNutrientLevel('sugar', 10)).toBe('medium');
        expect(getNutrientLevel('sugar', 3)).toBe('low');
    });

    it('classifies sodium levels correctly', () => {
        expect(getNutrientLevel('sodium', 0.8)).toBe('high');
        expect(getNutrientLevel('sodium', 0.3)).toBe('medium');
        expect(getNutrientLevel('sodium', 0.05)).toBe('low');
    });

    it('classifies fiber as good', () => {
        expect(getNutrientLevel('fiber', 5)).toBe('good');
        expect(getNutrientLevel('fiber', 1)).toBe('neutral');
    });

    it('handles unknown nutrients', () => {
        expect(getNutrientLevel('unknown', 50)).toBe('neutral');
    });

    it('handles null/undefined values', () => {
        expect(getNutrientLevel('sugar', null)).toBe('unknown');
        expect(getNutrientLevel('sugar', undefined)).toBe('unknown');
    });
});
