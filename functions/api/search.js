// Country codes for OpenFoodFacts filtering
const COUNTRY_TAGS = {
    'IN': 'india',
    'GB': 'united-kingdom',
    'US': 'united-states',
    'CA': 'canada',
    'AU': 'australia',
    'DE': 'germany',
    'FR': 'france',
    'ES': 'spain',
    'IT': 'italy',
    'NL': 'netherlands',
    'BE': 'belgium',
    'CH': 'switzerland',
    'AT': 'austria',
    'PL': 'poland',
    'SE': 'sweden',
    'NO': 'norway',
    'DK': 'denmark',
    'FI': 'finland',
    'IE': 'ireland',
    'NZ': 'new-zealand',
    'SG': 'singapore',
    'MY': 'malaysia',
    'AE': 'united-arab-emirates',
    'SA': 'saudi-arabia',
    'ZA': 'south-africa',
    'BR': 'brazil',
    'MX': 'mexico',
    'JP': 'japan',
    'KR': 'south-korea',
    'CN': 'china',
};

export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const query = url.searchParams.get('q');

    // Get country: prefer query param, then CF header, then default to 'world'
    const countryParam = url.searchParams.get('country');
    const cfCountry = request.headers.get('CF-IPCountry');
    const countryCode = countryParam || cfCountry || null;
    const countryTag = countryCode ? COUNTRY_TAGS[countryCode.toUpperCase()] : null;

    if (!query) {
        return new Response(JSON.stringify({ error: 'Missing query parameter' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // Include country in cache key if filtering
    const cacheKey = countryTag
        ? `search_${countryTag}_${query.toLowerCase().trim()}`
        : `search_${query.toLowerCase().trim()}`;

    // 1. Try to get from KV cache
    try {
        const cachedData = await env.PRODUCT_CACHE.get(cacheKey, { type: 'json' });
        if (cachedData) {
            return new Response(JSON.stringify({
                products: cachedData,
                source: 'cache',
                country: countryTag || 'world',
                detectedCountry: cfCountry || null
            }), {
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'public, max-age=3600'
                },
            });
        }
    } catch (err) {
        console.warn('KV Cache Error:', err);
    }

    // Use staging for local development, production for deployed
    const isLocalDev = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    const OFF_BASE = isLocalDev
        ? 'https://world.openfoodfacts.net'  // Staging
        : 'https://world.openfoodfacts.org'; // Production
    const OFF_API_URL = `${OFF_BASE}/cgi/search.pl`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    // Build search URL with optional country filter
    let searchUrl = `${OFF_API_URL}?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20&sort_by=unique_scans_n`;
    if (countryTag) {
        searchUrl += `&countries_tags_contains=${countryTag}`;
    }

    try {
        const response = await fetch(searchUrl, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'NutriRiskProfiler/1.0 (https://nutrient-risk-profiler.pages.dev)'
            }
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error('OpenFoodFacts API error');
        }

        const data = await response.json();
        const products = data.products || [];

        // Cache results if we got any
        if (products.length > 0) {
            try {
                context.waitUntil(
                    context.env.PRODUCT_CACHE.put(cacheKey, JSON.stringify(products))
                );
            } catch (err) {
                console.warn('KV Put Error:', err);
            }
        }

        return new Response(JSON.stringify({
            products,
            source: 'openfoodfacts',
            country: countryTag || 'world',
            detectedCountry: cfCountry || null
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=3600'
            },
        });

    } catch (error) {
        clearTimeout(timeoutId);
        const isTimeout = error.name === 'AbortError';

        return new Response(JSON.stringify({
            error: isTimeout
                ? 'Search timed out. OpenFoodFacts may be slow. Please try again.'
                : 'Failed to fetch products. Please try again.',
            products: [],
            country: countryTag || 'world'
        }), {
            status: isTimeout ? 504 : 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
