/**
 * OCR utility using Gemini 2.5 Flash API
 */

/**
 * Main OCR function - uses Gemini API only
 */
export const extractNutritionFromImage = async (imageData) => {
    try {
        const result = await extractWithGemini(imageData);
        if (result) {
            console.log('OCR: Used Gemini 2.5 Flash');
            return result;
        }
    } catch (error) {
        console.error('Gemini OCR failed:', error.message);
        return {
            _source: 'error',
            _error: error.message
        };
    }

    return null;
};

/**
 * Extract nutrition data using Gemini 2.5 Flash API
 */
/**
 * Extract nutrition data using Gemini 2.5 Flash API
 */
const extractWithGemini = async (imageData) => {
    const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageData }),
    });

    const result = await response.json();

    // Debug logging
    console.log('Gemini OCR Response:', {
        status: response.status,
        success: result.success,
        data: result.data,
        error: result.error,
        debug: result.debug
    });

    if (!response.ok || result.error || result.fallback) {
        console.warn('Gemini API failed:', result);
        throw new Error(result.error || 'Gemini OCR failed');
    }

    // Transform Gemini response to match expected format
    const data = result.data;

    // Check if data has actual values
    const hasValues = Object.values(data || {}).some(v => v !== null && v !== undefined);
    if (!hasValues) {
        console.warn('Gemini returned no values:', data);
        throw new Error('No nutrition data extracted');
    }

    return {
        energy_100g: data.energy_100g?.toString() || '',
        carbohydrates_100g: data.carbohydrates_100g?.toString() || '',
        sugars_100g: data.sugars_100g?.toString() || '',
        fat_100g: data.fat_100g?.toString() || '',
        saturated_fat_100g: data.saturated_fat_100g?.toString() || '',
        sodium_100g: data.sodium_100g?.toString() || '',
        proteins_100g: data.proteins_100g?.toString() || '',
        fiber_100g: data.fiber_100g?.toString() || '',
        _source: 'gemini-2.5-flash',
        _debug: result.debug
    };
};
