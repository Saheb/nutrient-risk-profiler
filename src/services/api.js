
import { supabase, localCache } from './supabase';

const OFF_API_URL = 'https://world.openfoodfacts.org/cgi/search.pl';

export const searchProducts = async (query) => {
    // 1. Check Cache (Local or Supabase)
    const cacheKey = `search_${query.toLowerCase().trim()} `;
    const cachedResult = localCache.get(cacheKey);
    if (cachedResult) {
        console.log("Serving from cache:", query);
        return cachedResult;
    }

    try {
        const response = await fetch(
            `${OFF_API_URL}?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20`
        );

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        const products = data.products || [];

        // Save to cache
        localCache.set(cacheKey, products);

        return products;
    } catch (error) {
        console.error("Error fetching products:", error);
        return [];
    }
};

export const getProductByBarcode = async (barcode) => {
    try {
        const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
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

