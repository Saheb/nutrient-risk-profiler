// Returns the user's detected country from Cloudflare headers
export async function onRequestGet(context) {
    const { request } = context;

    // Get country from Cloudflare header
    const cfCountry = request.headers.get('CF-IPCountry') || null;

    return new Response(JSON.stringify({
        country: cfCountry,
        // In local dev, CF-IPCountry won't be set
        isLocal: !cfCountry
    }), {
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
        },
    });
}
