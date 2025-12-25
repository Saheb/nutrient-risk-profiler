
import { describe, it, expect } from 'vitest';
import { calculateDetailedScore } from './scoring';

describe('calculateDetailedScore - Inclusive Fat Logic + Tweaked Sat Fat', () => {
    it('calculates fat penalty with relaxed Sat Fat threshold (20g)', () => {
        const alooBhujia = {
            nutriments: {
                'energy-kcal_100g': 569,
                'fat_100g': 38,
                'saturated-fat_100g': 17,
                // Sat Fat Logic: Range 1-20g. 17g is (16/19)*50 = ~42.1 pts.
                // Other Fat Logic: 38 - 17 = 21g. Range 5-35g. 21g is (16/30)*30 = 16 pts.
                // Total Fat Penalty: 42 + 16 = 58 pts.
                // Previous (double dip + tight cap): 80 pts -> 66 pts.
                // Improvement: ~8 more points.
                'sugars_100g': 0,
                'sodium_100g': 0.432,
                'fiber_100g': 0,
                'proteins_100g': 0
            },
            additives_n: 0
        };

        const result = calculateDetailedScore(alooBhujia);

        // Find penalties
        const satFatAdj = result.adjustments.find(a => a.label === 'Saturated Fat');

        expect(satFatAdj).toBeDefined();
        const satPoints = Math.abs(satFatAdj.points);

        // Expect ~42 points, definitely < 50
        expect(satPoints).toBeLessThan(50);
        expect(satPoints).toBeGreaterThan(40);

        // Final Score Anticipation:
        // Deductions: 
        // Energy ~27
        // Sat Fat ~42
        // Other Fat ~16
        // Sodium ~8
        // Total ~93
        // Base 100
        // Result ~ 7.
        // Significant improvement from 0-2.
        expect(result.score).toBeGreaterThan(5);
        expect(result.score).toBeLessThan(15);
    });
});
