
import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

// Simple polyfill for fetch if not available in environment (though vitest usually has it)
if (!globalThis.fetch) {
    // This might be needed if running in node environment without fetch
    // But modern node has fetch.
}

describe('OCR Benchmark', () => {
    let testImageBase64;
    const API_URL = process.env.API_URL || 'http://localhost:8788/api/ocr';
    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    const MISTRAL_KEY = process.env.MISTRAL_API_KEY;

    beforeAll(() => {
        // Load the test image
        const imagePath = path.resolve(__dirname, '../../public/test-assets/nutrition-label.jpg');
        try {
            const imageBuffer = fs.readFileSync(imagePath);
            testImageBase64 = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
        } catch (e) {
            console.warn('Test image not found, skipping benchmarks');
        }
    });

    it('benchmarks Gemini 2.5 Flash', async () => {
        if (!testImageBase64 || !GEMINI_KEY) {
            console.log('Skipping Gemini benchmark: Missing image or key');
            return;
        }

        const start = Date.now();
        const response = await fetch(API_URL, { // This assumes the worker is running!
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: testImageBase64, provider: 'gemini' })
        });
        const end = Date.now();
        const duration = end - start;

        expect(response.ok).toBe(true);
        const result = await response.json();

        console.log(`Gemini Duration: ${duration}ms`);
        console.log('Gemini Data:', result.data);

        // Basic validation of the synthetic image
        // Calories 200, Fat 8g, etc.
        if (result.data) {
            expect(Number(result.data.energy_100g) || Number(result.data.energy_serving)).toBeGreaterThan(0);
        }
    }, 30000); // Long timeout

    it('benchmarks Mistral AI', async () => {
        if (!testImageBase64 || !MISTRAL_KEY) {
            console.log('Skipping Mistral benchmark: Missing image or key');
            return;
        }

        console.time('Mistral OCR');
        const start = Date.now();

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: testImageBase64, provider: 'mistral' })
            });

            const end = Date.now();
            const duration = end - start;
            console.timeEnd('Mistral OCR');

            if (!response.ok) {
                const text = await response.text();
                console.error('Mistral API error:', text);
                throw new Error(`Mistral API error: ${text}`);
            }

            const data = await response.json();
            console.log(`Mistral Duration: ${duration}ms`);
            console.log('Mistral Data:', data.data);

            expect(data.success).toBe(true);
            expect(data.source).toBe('mistral');

            // Basic validation
            if (data.data) {
                expect(Number(data.data.energy_100g)).toBeGreaterThan(0);
            }

        } catch (e) {
            console.warn('Mistral benchmark failed', e);
            throw e;
        }
    }, 30000);
});
