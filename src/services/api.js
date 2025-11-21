
import { supabase, localCache } from './supabase';

const OFF_API_URL = 'https://world.openfoodfacts.org/cgi/search.pl';

export const searchProducts = async (query) => {
    // 1. Check Cache (Local or Supabase) - We still keep local cache for instant navigation back/forth
    const cacheKey = `search_${query.toLowerCase().trim()} `;
    const cachedResult = localCache.get(cacheKey);
    if (cachedResult) {
        console.log("Serving from local cache:", query);
        return cachedResult;
    }

    try {
        // Use our new Proxy Endpoint
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);

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

