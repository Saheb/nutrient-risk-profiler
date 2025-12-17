
import { supabase, localCache } from './supabase';

const OFF_API_URL = 'https://world.openfoodfacts.org/cgi/search.pl';

/**
 * Validates a barcode using EAN-13/UPC-A checksum algorithm.
 * @param {string} barcode - The barcode to validate
 * @returns {boolean} Whether the barcode has a valid checksum
 */
export const validateBarcode = (barcode) => {
    // Must be 8-14 digits
    if (!/^\d{8,14}$/.test(barcode)) return false;

    // Pad to 14 digits for GTIN-14 compatibility
    const padded = barcode.padStart(14, '0');

    // Calculate checksum (last digit)
    let sum = 0;
    for (let i = 0; i < 13; i++) {
        const digit = parseInt(padded[i], 10);
        sum += (i % 2 === 0) ? digit * 3 : digit;
    }
    const checkDigit = (10 - (sum % 10)) % 10;

    return parseInt(padded[13], 10) === checkDigit;
};

/**
 * Result type for API operations
 * @typedef {Object} ApiResult
 * @property {boolean} success - Whether the operation succeeded
 * @property {Array|Object} data - The response data
 * @property {string} [error] - Error message if failed
 */

export const searchProducts = async (query, country = '') => {
    const trimmedQuery = query.trim();

    // Include country in cache key
    const cacheKey = country
        ? `search_${country}_${trimmedQuery.toLowerCase()}`
        : `search_${trimmedQuery.toLowerCase()}`;
    const cachedResult = localCache.get(cacheKey);
    if (cachedResult) {
        return { success: true, data: cachedResult };
    }

    // Check if query is a barcode (8-14 digits)
    if (/^\d{8,14}$/.test(trimmedQuery)) {
        if (!validateBarcode(trimmedQuery)) {
            console.warn('Barcode failed checksum validation:', trimmedQuery);
        }

        const result = await getProductByBarcode(trimmedQuery);
        if (result.success && result.data) {
            const products = [result.data];
            localCache.set(cacheKey, products);
            return { success: true, data: products };
        }
        return { success: false, data: [], error: result.error || 'Product not found' };
    }

    try {
        let apiUrl = `/api/search?q=${encodeURIComponent(trimmedQuery)}`;
        if (country) {
            apiUrl += `&country=${encodeURIComponent(country)}`;
        }

        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`Search failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const products = data.products || [];

        localCache.set(cacheKey, products);

        return { success: true, data: products, detectedCountry: data.detectedCountry };
    } catch (error) {
        console.error("Error fetching products:", error);
        return {
            success: false,
            data: [],
            error: error.message || 'Failed to search products. Please try again.'
        };
    }
};

export const getProductByBarcode = async (barcode) => {
    try {
        const response = await fetch(`/api/product/${barcode}`);

        if (!response.ok) {
            if (response.status === 404) {
                return { success: false, data: null, error: 'Product not found in database' };
            }
            throw new Error(`Request failed: ${response.status}`);
        }

        const data = await response.json();

        if (!data.product) {
            return { success: false, data: null, error: 'Product not found' };
        }

        return { success: true, data: data.product };
    } catch (error) {
        console.error("Error fetching product by barcode:", error);
        return {
            success: false,
            data: null,
            error: error.message || 'Failed to fetch product. Please try again.'
        };
    }
};

