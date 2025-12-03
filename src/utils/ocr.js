import Tesseract from 'tesseract.js';

export const extractNutritionFromImage = async (imageData) => {
    try {
        const result = await Tesseract.recognize(
            imageData,
            'eng',
            {
                logger: m => console.log(m) // Optional: log progress
            }
        );

        const text = result.data.text;
        console.log("OCR Extracted Text:", text);

        return parseNutritionText(text);
    } catch (error) {
        console.error("OCR Error:", error);
        return null;
    }
};

const parseNutritionText = (text) => {
    const extracted = {};

    // Helper regex to find value after key words
    // Looks for: Keyword -> (optional non-digits) -> Number -> (optional decimal) -> Number
    const findValue = (regex) => {
        const match = text.match(regex);
        if (match && match[2]) {
            // Replace comma with dot for decimals, remove non-numeric chars except dot
            return match[2].replace(',', '.').replace(/[^0-9.]/g, '');
        }
        return null;
    };

    // Energy / Calories
    // Matches: Energy, Calories, Kcal followed by number
    extracted.energy_100g = findValue(/(energy|calories|kcal|kj)[^0-9]*([0-9]+)/i);

    // Sugars
    // Matches: Sugars, Carbohydrate... of which sugars
    extracted.sugars_100g = findValue(/(sugars?|carbohydrates?)[^0-9]*([0-9]+[.,]?[0-9]*)/i);

    // Saturated Fat
    // Matches: Saturated, Sat Fat
    extracted.saturated_fat_100g = findValue(/(saturated|sat\.? fat)[^0-9]*([0-9]+[.,]?[0-9]*)/i);

    // Sodium / Salt
    // Matches: Sodium, Salt
    extracted.sodium_100g = findValue(/(sodium|salt)[^0-9]*([0-9]+[.,]?[0-9]*)/i);

    // Protein
    extracted.proteins_100g = findValue(/(protein|proteins)[^0-9]*([0-9]+[.,]?[0-9]*)/i);

    // Fiber
    extracted.fiber_100g = findValue(/(fiber|fibre)[^0-9]*([0-9]+[.,]?[0-9]*)/i);

    // Clean up: remove nulls
    Object.keys(extracted).forEach(key => {
        if (extracted[key] === null) {
            delete extracted[key];
        }
    });

    return extracted;
};
