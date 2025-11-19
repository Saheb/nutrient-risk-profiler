import React, { useState } from 'react';
import { Search } from 'lucide-react';
import SearchBar from './components/SearchBar';
import ProductCard from './components/ProductCard';
import ProductDetails from './components/ProductDetails';
import { searchProducts } from './services/api';

function App() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const handleSearch = async (query) => {
    setIsLoading(true);
    setHasSearched(true);
    setSelectedProduct(null); // Reset selection on new search
    try {
      const results = await searchProducts(query);
      setProducts(results);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
  };

  const handleBack = () => {
    setSelectedProduct(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center p-4">
      <header className="w-full max-w-md py-6 flex flex-col items-center">
        <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">Nutrient Risk Profiler</h1>
        <p className="text-muted-foreground text-center">Instantly check the risk profile of food items.</p>
      </header>

      <main className="w-full max-w-md flex-1 flex flex-col gap-6">
        {!selectedProduct && (
          <SearchBar onSearch={handleSearch} isLoading={isLoading} />
        )}

        <div className="flex flex-col gap-3">
          {selectedProduct ? (
            <ProductDetails product={selectedProduct} onBack={handleBack} />
          ) : isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Searching...</div>
          ) : products.length > 0 ? (
            products.map((product) => (
              <ProductCard
                key={product.code || Math.random()}
                product={product}
                onClick={handleProductClick}
              />
            ))
          ) : hasSearched ? (
            <div className="text-center py-8 text-muted-foreground">No products found.</div>
          ) : (
            <div className="w-full p-4 border rounded-lg shadow-sm bg-card">
              <p className="text-center text-muted-foreground">Search for a product to begin...</p>
            </div>
          )}
        </div>
      </main>

      <footer className="py-6 text-sm text-muted-foreground">
        Powered by OpenFoodFacts
      </footer>
    </div>
  );
}

export default App;
