
const RECENT_PRODUCTS_KEY = 'recent_products';
const MAX_RECENT_PRODUCTS = 5;

export const getRecentProducts = () => {
    try {
        const stored = localStorage.getItem(RECENT_PRODUCTS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Failed to get recent products", e);
        return [];
    }
};

export const saveRecentProduct = (product) => {
    if (!product) return;
    const code = product.code || product._id || product.id;
    if (!code) {
        console.warn("Cannot save recent product: missing code", product);
        return;
    }

    try {
        const current = getRecentProducts();

        // Remove duplicate if exists (so we can move it to the top)
        const filtered = current.filter(p => (p.code || p._id || p.id) !== code);

        // Create a minimal version of the product to save space and avoid issues
        const minimalProduct = {
            code: code,
            product_name: product.product_name,
            brands: product.brands,
            image_url: product.image_url,
            nutriments: product.nutriments, // Needed for score
            additives_n: product.additives_n, // Needed for score
            labels_tags: product.labels_tags // Needed for score
        };

        // Add new product to the beginning
        const updated = [minimalProduct, ...filtered].slice(0, MAX_RECENT_PRODUCTS);

        localStorage.setItem(RECENT_PRODUCTS_KEY, JSON.stringify(updated));
        console.log("Saved recent product:", minimalProduct.product_name);
    } catch (e) {
        console.error("Failed to save recent product", e);
    }
};
