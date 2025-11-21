export async function onRequestGet(context) {
    const { params, env } = context;
    const id = params.id;

    if (!id) {
        return new Response(JSON.stringify({ error: 'Missing product ID' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const cacheKey = `product_${id}`;

    // 1. Try to get from KV
    try {
        const cachedData = await env.PRODUCT_CACHE.get(cacheKey, { type: 'json' });
        if (cachedData) {
            return new Response(JSON.stringify({ product: cachedData, source: 'cache' }), {
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'public, max-age=86400' // Cache for 1 day
                },
            });
        }
    } catch (err) {
        console.warn('KV Cache Error:', err);
    }

    // 2. Fetch from OpenFoodFacts
    try {
        const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${id}.json`);

        if (!response.ok) {
            throw new Error('Upstream API error');
        }

        const data = await response.json();
        const product = data.product;

        if (!product) {
            return new Response(JSON.stringify({ error: 'Product not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // 3. Store in KV (TTL: 24 hours) - Non-blocking
        try {
            context.waitUntil(
                env.PRODUCT_CACHE.put(cacheKey, JSON.stringify(product), {
                    expirationTtl: 86400, // 1 day
                })
            );
        } catch (err) {
            console.warn('KV Put Error:', err);
        }

        return new Response(JSON.stringify({ product, source: 'api' }), {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=86400' // Cache for 1 day
            },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to fetch product', details: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
