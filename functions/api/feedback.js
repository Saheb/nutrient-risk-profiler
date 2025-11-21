export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

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
        let data = await env.PRODUCT_CACHE.get(key, { type: 'json' });

        if (!data) {
            data = { up: 0, down: 0 };
        }

        // Increment
        data[type] = (data[type] || 0) + 1;

        // Save back to KV
        await env.PRODUCT_CACHE.put(key, JSON.stringify(data));

        return new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: 'Server Error' }), { status: 500 });
    }
}
