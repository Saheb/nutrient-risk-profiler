import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThumbsUp, ThumbsDown, Calculator, ScanBarcode } from 'lucide-react';
import { searchProducts } from '../services/api';
import ProductCard from '../components/ProductCard';
import SearchBar from '../components/SearchBar';
import InstallPrompt from '../components/InstallPrompt';
import { getRecentProducts } from '../utils/storage';

const Home = () => {
    const [products, setProducts] = useState([]);
    const [recentProducts, setRecentProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [globalStats, setGlobalStats] = useState({ up: 0, down: 0 });
    const [showScanner, setShowScanner] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/feedback?mode=global');
                if (res.ok) {
                    const data = await res.json();
                    setGlobalStats(data);
                }
            } catch (e) {
                console.error("Failed to fetch global stats", e);
            }
        };
        fetchStats();
        setRecentProducts(getRecentProducts());
    }, []);

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
        const code = product.code || product._id || product.id;
        if (code) {
            navigate(`/product/${code}`);
        }
    };

    return (
        <div className="w-full max-w-md flex-1 flex flex-col gap-6">
            <div className="flex gap-2">
                <SearchBar
                    onSearch={handleSearch}
                    isLoading={isLoading}
                    showScanner={showScanner}
                    setShowScanner={setShowScanner}
                />
            </div>

            {/* Prominent Scan Button */}
            <button
                onClick={() => setShowScanner(true)}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-md hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
                <ScanBarcode size={20} />
                Scan Barcode
            </button>

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
                    <div className="text-center py-12">
                        <p className="text-gray-500 mb-4">No products found.</p>
                        <button
                            onClick={() => navigate('/add-product')}
                            className="text-blue-600 font-medium hover:underline"
                        >
                            + Add this product manually
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="w-full p-4 border rounded-lg shadow-sm bg-card mb-4">
                            <p className="text-center text-muted-foreground">Search for a product to begin...</p>
                        </div>
                        {recentProducts.length > 0 && (
                            <div className="flex flex-col gap-3">
                                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
                                    Recently Viewed ({recentProducts.length})
                                </h2>
                                {recentProducts.map((product) => (
                                    <ProductCard
                                        key={product.code || product._id || product.id}
                                        product={product}
                                        onClick={handleProductClick}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}

            </div>

            {/* Bottom Actions */}
            <div className="mt-auto pt-6 pb-2">
                <button
                    onClick={() => navigate('/quick-scan')}
                    className="w-full py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium shadow-sm hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    <Calculator size={20} className="text-blue-600" />
                    Open Score Calculator
                </button>
            </div>

            {/* Global Stats Footer */}
            <div className="mt-8 flex items-center justify-center gap-6 text-muted-foreground/60">
                <div className="flex items-center gap-2">
                    <ThumbsUp className="h-4 w-4" />
                    <span className="text-xs font-medium">{globalStats.up} helpful votes</span>
                </div>
                <div className="flex items-center gap-2">
                    <ThumbsDown className="h-4 w-4" />
                    <span className="text-xs font-medium">{globalStats.down} unhelpful votes</span>
                </div>
            </div>

            <InstallPrompt />
        </div>
    );
};

export default Home;
