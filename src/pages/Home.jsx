import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import ProductCard from '../components/ProductCard';
import { searchProducts } from '../services/api';

const Home = () => {
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const navigate = useNavigate();

    const handleSearch = async (query) => {
        setIsLoading(true);
        setHasSearched(true);
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
        navigate(`/product/${product.code}`);
    };

    return (
        <div className="w-full max-w-md flex-1 flex flex-col gap-6">
            <SearchBar onSearch={handleSearch} isLoading={isLoading} />

            <div className="flex flex-col gap-3">
                {isLoading ? (
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
        </div>
    );
};

export default Home;
