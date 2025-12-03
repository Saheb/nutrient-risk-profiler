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
    // Looks for: Keyword -> (optional non-digits) -> Number -> (optional decimal/space) -> Number
    const findValue = (regex, fieldName) => {
        const match = text.match(regex);
        console.log(`Searching for ${fieldName}:`, regex, "Match:", match ? match[2] : "null");

        if (match && match[2]) {
            let value = match[2];
            // Common OCR fixes:
            // "8 . 0" -> "8.0"
            // "8 ' 0" -> "8.0"
            // "8 0" -> "8.0" (risky, but if it's < 100g usually safe for nutrients like sugar/fat?)

            // Replace common OCR artifacts for decimal points
            value = value.replace(/[\s,'"]+/g, '.');

            // Remove any remaining non-numeric chars except dot
            value = value.replace(/[^0-9.]/g, '');

            // Fix double dots ".." -> "."
            value = value.replace(/\.+/g, '.');

            // Remove trailing dot if present (e.g. "12." -> "12")
            if (value.endsWith('.')) {
                value = value.slice(0, -1);
            }

            return value;
        }
        return null;
    };

    // Energy / Calories (usually whole numbers)
    extracted.energy_100g = findValue(/(energy|calories|kcal|kj)[^0-9]*([0-9]+)/i, 'energy');

    // Nutrients (can be decimals)
    // We use explicit regexes to avoid issues with dynamic RegExp creation
    // Pattern: Digits + (Optional Separator: dot, comma, space, quote) + (Optional Digits)
    const numberPattern = "([0-9]+[\\s.,']*[0-9]*)";

    // Sugars
    // Prioritize "Sugars" over "Carbohydrates" to avoid picking up the total carb value
    extracted.sugars_100g = findValue(new RegExp(`(sugars?|of which sugars)[^0-9]*${numberPattern}`, 'i'), 'sugars');

    // Fallback for sugars if not found (sometimes just listed under carbs)
    if (!extracted.sugars_100g) {
        extracted.sugars_100g = findValue(new RegExp(`(carbohydrates?)[^0-9]*${numberPattern}`, 'i'), 'carbs_fallback');
    }

    extracted.saturated_fat_100g = findValue(new RegExp(`(saturated|sat\\.? fat)[^0-9]*${numberPattern}`, 'i'), 'sat_fat');
    extracted.sodium_100g = findValue(new RegExp(`(sodium|salt)[^0-9]*${numberPattern}`, 'i'), 'sodium');
    extracted.proteins_100g = findValue(new RegExp(`(protein|proteins)[^0-9]*${numberPattern}`, 'i'), 'protein');
    extracted.fiber_100g = findValue(new RegExp(`(fiber|fibre)[^0-9]*${numberPattern}`, 'i'), 'fiber');

    // Clean up: remove nulls
    Object.keys(extracted).forEach(key => {
        if (extracted[key] === null) {
            delete extracted[key];
        }
    });

    console.log("Final Extracted Data:", extracted);
    return extracted;
};
