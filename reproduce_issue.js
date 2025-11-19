
const OFF_API_URL = 'https://world.openfoodfacts.org/cgi/search.pl';
const query = 'maggi';

const urlWithSpaces = `${OFF_API_URL}?search_terms = ${encodeURIComponent(query)}& search_simple=1 & action=process & json=1 & page_size=20`;
const urlClean = `${OFF_API_URL}?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20`;

console.log("Testing URL with spaces:", urlWithSpaces);
try {
    const res = await fetch(urlWithSpaces);
    const data = await res.json();
    console.log("Products found (with spaces):", data.products ? data.products.length : 0);
} catch (e) {
    console.error("Error with spaces:", e.message);
}

console.log("\nTesting Clean URL:", urlClean);
try {
    const res = await fetch(urlClean);
    const data = await res.json();
    console.log("Products found (clean):", data.products ? data.products.length : 0);
} catch (e) {
    console.error("Error with clean URL:", e.message);
}
