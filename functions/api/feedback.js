export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const mode = url.searchParams.get('mode');

    if (mode === 'global') {
        const globalData = await env.PRODUCT_CACHE.get('global_stats', { type: 'json' });
        return new Response(JSON.stringify(globalData || { up: 0, down: 0 }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    if (!id) {
        return new Response(JSON.stringify({ error: 'Missing product ID' }), { status: 400 });
    }

    const key = `feedback_${id}`;
    let data = await env.PRODUCT_CACHE.get(key, { type: 'json' });

    if (!data) {
        data = { up: 0, down: 0 };
    }

    return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' }
    });
}

export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const body = await request.json();
        const { id, type } = body;

        if (!id || !['up', 'down'].includes(type)) {
            return new Response(JSON.stringify({ error: 'Invalid input' }), { status: 400 });
        }

        const key = `feedback_${id}`;
        const globalKey = 'global_stats';

        // Fetch both current product stats and global stats
        const [productDataStr, globalDataStr] = await Promise.all([
            env.PRODUCT_CACHE.get(key),
            env.PRODUCT_CACHE.get(globalKey)
        ]);

        let data = productDataStr ? JSON.parse(productDataStr) : { up: 0, down: 0 };
        let globalData = globalDataStr ? JSON.parse(globalDataStr) : { up: 0, down: 0 };

        // Increment
        data[type] = (data[type] || 0) + 1;
        globalData[type] = (globalData[type] || 0) + 1;

        // Save back to KV (parallel)
        await Promise.all([
            env.PRODUCT_CACHE.put(key, JSON.stringify(data)),
            env.PRODUCT_CACHE.put(globalKey, JSON.stringify(globalData))
        ]);

        return new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: 'Server Error' }), { status: 500 });
    }
}
