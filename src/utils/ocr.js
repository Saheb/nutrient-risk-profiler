import Tesseract from 'tesseract.js';

export const extractNutritionFromImage = async (imageData) => {
    try {
        // 1. Preprocess the image (Grayscale + Binarization) to improve OCR accuracy
        const processedImage = await preprocessImage(imageData);

        // 2. Configure Tesseract with specific options for nutrition labels
        const result = await Tesseract.recognize(
            processedImage,
            'eng',
            {
                // logger: m => console.log(m), // Optional: log progress
                tessedit_char_whitelist: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.,gmkcal%()/', // Only allow relevant chars
                tessedit_pageseg_mode: '6', // PSM 6: Assume a single uniform block of text
            }
        );

        const text = result.data.text;
        // console.log("OCR Extracted Text:", text);

        return parseNutritionText(text);
    } catch (error) {
        console.error("OCR Error:", error);
        return null;
    }
};

// Helper: Preprocess image using Canvas API
const preprocessImage = (imageSource) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Set canvas dimensions
            canvas.width = img.width;
            canvas.height = img.height;

            // Draw original image
            ctx.drawImage(img, 0, 0);

            // Get image data
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Apply Grayscale & Binarization (Thresholding)
            // Loop through pixels (R, G, B, A)
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                // Grayscale (Luminosity formula)
                const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;

                // Binarization (Thresholding)
                // If pixel is lighter than threshold, make it white. Otherwise black.
                // Threshold of 128 is standard, but for labels 100-110 often works better to catch faint text.
                const threshold = 110;
                const value = gray >= threshold ? 255 : 0;

                data[i] = value;     // R
                data[i + 1] = value; // G
                data[i + 2] = value; // B
                // Alpha (data[i+3]) remains unchanged
            }

            // Put processed data back
            ctx.putImageData(imageData, 0, 0);

            // Return as Data URL
            resolve(canvas.toDataURL('image/jpeg'));
        };
        img.onerror = reject;
        img.src = imageSource;
    });
};

const parseNutritionText = (text) => {
    const extracted = {};

    // Helper regex to find value after key words
    // Looks for: Keyword -> (optional non-digits) -> Number -> (optional decimal/space) -> Number
    const findValue = (regex, fieldName) => {
        const match = text.match(regex);
        // console.log(`Searching for ${fieldName}:`, regex, "Match:", match ? match[2] : "null");

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

    extracted.raw_text = text; // Include raw text for debugging
    // console.log("Final Extracted Data:", extracted);
    return extracted;
};
