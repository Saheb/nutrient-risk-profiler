
import { supabase, localCache } from './supabase';

const OFF_API_URL = 'https://world.openfoodfacts.org/cgi/search.pl';

export const searchProducts = async (query) => {
    const trimmedQuery = query.trim();

    // 1. Check Cache (Local or Supabase) - We still keep local cache for instant navigation back/forth
    const cacheKey = `search_${trimmedQuery.toLowerCase()}`;
    const cachedResult = localCache.get(cacheKey);
    if (cachedResult) {
        console.log("Serving from local cache:", trimmedQuery);
        return cachedResult;
    }

    // 2. Check if query is a barcode (8-14 digits)
    if (/^\d{8,14}$/.test(trimmedQuery)) {
        console.log("Detected barcode, fetching product directly:", trimmedQuery);
        const product = await getProductByBarcode(trimmedQuery);
        if (product) {
            const results = [product];
            localCache.set(cacheKey, results);
            return results;
        }
        // If direct lookup fails, we can fall back to search, but it's unlikely to help.
    }

    try {
        // Use our new Proxy Endpoint
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmedQuery)}`);

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        const products = data.products || [];

        // Save to local cache
        localCache.set(cacheKey, products);

        return products;
    } catch (error) {
        console.error("Error fetching products:", error);
        return [];
    }
};

export const getProductByBarcode = async (barcode) => {
    try {
        const response = await fetch(`/api/product/${barcode}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data.product;
    } catch (error) {
        console.error("Error fetching product by barcode:", error);
        return null;
    }
};

