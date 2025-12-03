const RECENT_PRODUCTS_KEY = 'recent_products';
const CUSTOM_PRODUCTS_KEY = 'custom_products';
const MAX_RECENT_ITEMS = 5;

export const saveRecentProduct = (product) => {
    try {
        if (!product) return;

        // Create a minimal version of the product to save space and avoid circular refs
        const minimalProduct = {
            id: product.id || product._id || product.code, // Ensure we have an ID
            code: product.code || product.id || product._id, // Ensure we have a code
            product_name: product.product_name || 'Unknown Product',
            brands: product.brands || '',
            image_url: product.image_url || product.image_front_url || '',
            nutriments: product.nutriments || {},
            nutriscore_grade: product.nutriscore_grade || 'unknown',
            // Custom flag
            is_custom: product.is_custom || false
        };

        if (!minimalProduct.id) {
            console.warn("Cannot save product without an ID:", product);
            return;
        }

        const recent = getRecentProducts();

        // Remove if already exists (to move to top)
        const filtered = recent.filter(p => {
            const pId = p.id || p.code;
            return pId !== minimalProduct.id;
        });

        // Add to beginning
        filtered.unshift(minimalProduct);

        // Limit to MAX items
        const trimmed = filtered.slice(0, MAX_RECENT_ITEMS);

        localStorage.setItem(RECENT_PRODUCTS_KEY, JSON.stringify(trimmed));
    } catch (error) {
        console.error("Failed to save recent product:", error);
    }
};

export const getRecentProducts = () => {
    try {
        const stored = localStorage.getItem(RECENT_PRODUCTS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error("Failed to get recent products:", error);
        return [];
    }
};

// --- Custom Products Logic ---

export const saveCustomProduct = (product) => {
    try {
        if (!product) return;

        const customProducts = getCustomProducts();

        // Generate a unique ID if not present (e.g., timestamp based)
        if (!product.id) {
            product.id = `custom_${Date.now()}`;
            product.code = product.id; // Use ID as code for consistency
        }
        product.is_custom = true;

        // Add to list
        customProducts.push(product);
        localStorage.setItem(CUSTOM_PRODUCTS_KEY, JSON.stringify(customProducts));

        // Also add to recent history for convenience
        saveRecentProduct(product);

        return product;
    } catch (error) {
        console.error("Failed to save custom product:", error);
        return null;
    }
};

export const getCustomProducts = () => {
    try {
        const stored = localStorage.getItem(CUSTOM_PRODUCTS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error("Failed to get custom products:", error);
        return [];
    }
};

export const getCustomProductById = (id) => {
    const products = getCustomProducts();
    return products.find(p => p.id === id || p.code === id);
};
