export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const query = url.searchParams.get('q');

    if (!query) {
        return new Response(JSON.stringify({ error: 'Missing query parameter' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const cacheKey = `search_${query.toLowerCase().trim()}`;

    // 1. Try to get from KV
    try {
        const cachedData = await env.PRODUCT_CACHE.get(cacheKey, { type: 'json' });
        if (cachedData) {
            return new Response(JSON.stringify({ products: cachedData, source: 'cache' }), {
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
                },
            });
        }
    } catch (err) {
        // Ignore KV errors (e.g. if binding is missing locally) and proceed to fetch
        console.warn('KV Cache Error:', err);
    }

    // 2. Fetch from OpenFoodFacts
    const OFF_API_URL = 'https://world.openfoodfacts.org/cgi/search.pl';
    try {
        const offResponse = await fetch(
            `${OFF_API_URL}?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20&sort_by=unique_scans_n`
        );

        if (!offResponse.ok) {
            throw new Error('Upstream API error');
        }

        const data = await offResponse.json();
        const products = data.products || [];

        // 3. Store in KV (TTL: 24 hours) - Non-blocking
        try {
            // Only cache if we got results
            if (products.length > 0) {
                context.waitUntil(
                    context.env.PRODUCT_CACHE.put(cacheKey, JSON.stringify(products))
                );
            }
        } catch (err) {
            console.warn('KV Put Error:', err);
        }

        return new Response(JSON.stringify({ products, source: 'api' }), {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
            },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to fetch products', details: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
