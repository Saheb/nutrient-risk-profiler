
/**
 * OCR API endpoint using Gemini 2.5 Flash and Sarvam AI
 * Extracts nutrition information from food label images
 */

export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const body = await request.json();
        const { image } = body;

        if (!image) {
            return new Response(JSON.stringify({ error: 'Missing image data' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Extract base64 data and mime type from data URL
        const matches = image.match(/^data:(.+);base64,(.+)$/);
        if (!matches) {
            return new Response(JSON.stringify({ error: 'Invalid image format. Expected base64 data URL.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const mimeType = matches[1];
        const base64Data = matches[2];

        // Default to Gemini
        const nutritionData = await extractWithGemini(env, mimeType, base64Data);

        // Return the extracted nutrition data
        return new Response(JSON.stringify({
            success: true,
            data: nutritionData,
            source: 'gemini-2.5-flash',
            debug: {
                // Return debug info if needed
            }
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error('OCR API error:', err);
        return new Response(JSON.stringify({
            error: 'Server error',
            message: err.message,
            fallback: true
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

async function extractWithGemini(env, mimeType, base64Data) {
    if (!env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY not configured');
    }

    // Structured prompt for nutrition extraction
    const extractionPrompt = `You are a nutrition label OCR expert. Extract nutrition information from this food label image.

IMPORTANT: 
- Values should be per 100g serving (if the label shows per serving, try to calculate per 100g if possible)
- For sodium: return the value in milligrams (mg). If shown in grams, convert to mg (multiply by 1000)
- Return ONLY a valid JSON object, no markdown, no explanation

Return this exact JSON structure (use null for any value not found):
{
  "energy_100g": <number in kcal or null>,
  "carbohydrates_100g": <number in grams or null>,
  "sugars_100g": <number in grams or null>,
  "fat_100g": <number in grams or null>,
  "saturated_fat_100g": <number in grams or null>,
  "sodium_100g": <number in milligrams or null>,
  "proteins_100g": <number in grams or null>,
  "fiber_100g": <number in grams or null>
}`;

    // Call Gemini 2.5 Flash API (stable version)
    const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: extractionPrompt },
                        {
                            inline_data: {
                                mime_type: mimeType,
                                data: base64Data
                            }
                        }
                    ]
                }],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 1024,
                }
            })
        }
    );

    if (!geminiResponse.ok) {
        throw new Error(await geminiResponse.text());
    }

    const geminiData = await geminiResponse.json();
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
        throw new Error('No response from Gemini');
    }

    // Parse the JSON response
    let cleanedResponse = responseText.trim();
    if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.slice(7);
    } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.slice(3);
    }
    if (cleanedResponse.endsWith('```')) {
        cleanedResponse = cleanedResponse.slice(0, -3);
    }

    return JSON.parse(cleanedResponse.trim());
}



// Health check endpoint
export async function onRequestGet(context) {
    const { env } = context;

    return new Response(JSON.stringify({
        status: 'ok',
        model: 'gemini-2.5-flash',
        configured: !!env.GEMINI_API_KEY
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}
