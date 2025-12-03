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
    const findValue = (regex) => {
        const match = text.match(regex);
        if (match && match[2]) {
            let value = match[2];
            // Common OCR fixes:
            // "8 . 0" -> "8.0"
            // "8 ' 0" -> "8.0"
            // "8 0" -> "8.0" (risky, but if it's < 100g usually safe for nutrients like sugar/fat?)
            // Actually, "8 0" is too risky. Let's focus on " . " or " , " or " ' "

            // Replace common OCR artifacts for decimal points
            value = value.replace(/[\s,'"]+/g, '.');

            // Remove any remaining non-numeric chars except dot
            value = value.replace(/[^0-9.]/g, '');

            // Fix double dots ".." -> "."
            value = value.replace(/\.+/g, '.');

            return value;
        }
        return null;
    };

    // Energy / Calories (usually whole numbers)
    extracted.energy_100g = findValue(/(energy|calories|kcal|kj)[^0-9]*([0-9]+)/i);

    // Nutrients (can be decimals)
    // Regex explanation:
    // [0-9]+       : Start with digits
    // [.,\s'"]*    : Optional separator (dot, comma, space, quote) - flexible
    // [0-9]+       : Followed by digits
    //
    // We capture the whole group and clean it in findValue
    const nutrientRegex = (keyword) => new RegExp(`(${keyword})[^0-9]*([0-9]+[.,\\s'"]*[0-9]*)`, 'i');

    extracted.sugars_100g = findValue(nutrientRegex('sugars?|carbohydrates?'));
    extracted.saturated_fat_100g = findValue(nutrientRegex('saturated|sat\\.? fat'));
    extracted.sodium_100g = findValue(nutrientRegex('sodium|salt'));
    extracted.proteins_100g = findValue(nutrientRegex('protein|proteins'));
    extracted.fiber_100g = findValue(nutrientRegex('fiber|fibre'));

    // Clean up: remove nulls
    Object.keys(extracted).forEach(key => {
        if (extracted[key] === null) {
            delete extracted[key];
        }
    });

    return extracted;
};
