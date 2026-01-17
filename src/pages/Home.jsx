import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThumbsUp, ThumbsDown, Calculator, ScanBarcode, AlertCircle } from 'lucide-react';
import { searchProducts } from '../services/api';
import ProductCard from '../components/ProductCard';
import SearchBar from '../components/SearchBar';
import InstallPrompt from '../components/InstallPrompt';
import { ProductListSkeleton } from '../components/SkeletonLoader';
import { getRecentProducts } from '../utils/storage';
import CountrySelector, { getStoredCountry } from '../components/CountrySelector';

const Home = () => {
    const [products, setProducts] = useState([]);
    const [recentProducts, setRecentProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [error, setError] = useState(null);
    const [globalStats, setGlobalStats] = useState({ up: 0, down: 0 });
    const [showScanner, setShowScanner] = useState(false);
    const [country, setCountry] = useState(getStoredCountry());
    const [detectedCountry, setDetectedCountry] = useState(null);
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

        const fetchDetectedCountry = async () => {
            try {
                const res = await fetch('/api/country');
                if (res.ok) {
                    const data = await res.json();
                    if (data.country) {
                        setDetectedCountry(data.country);
                        // If no stored preference, use detected country as default
                        if (!getStoredCountry()) {
                            setCountry(data.country);
                        }
                    }
                }
            } catch (e) {
                console.error("Failed to fetch detected country", e);
            }
        };

        fetchStats();
        fetchDetectedCountry();
        setRecentProducts(getRecentProducts());
    }, []);

    const handleSearch = useCallback(async (query) => {
        setIsLoading(true);
        setHasSearched(true);
        setError(null);
        try {
            const result = await searchProducts(query, country);
            if (result.success) {
                setProducts(result.data);
                if (result.detectedCountry) {
                    setDetectedCountry(result.detectedCountry);
                }
            } else {
                setProducts([]);
                setError(result.error || 'Search failed');
            }
        } catch (error) {
            console.error("Search failed:", error);
            setProducts([]);
            setError('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    }, [country]);

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

            {/* Country Filter */}
            <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Filter by country:</span>
                <CountrySelector
                    value={country}
                    onChange={setCountry}
                    detectedCountry={detectedCountry}
                />
            </div>

            <div className="flex flex-col gap-3">
                {products.length === 0 && !hasSearched && (
                    <div className="w-full p-4 border rounded-lg shadow-sm bg-card mb-4">
                        <p className="text-center text-muted-foreground">
                            <span className="block font-medium mb-1">Scanning a barcode is faster!</span>
                            <span className="text-xs opacity-80">Text search is slower and less accurate.</span>
                        </p>
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="w-full p-4 border border-red-200 rounded-lg shadow-sm bg-red-50 mb-4 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-red-700 font-medium">Search failed</p>
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    </div>
                )}

                {isLoading ? (
                    <ProductListSkeleton count={3} />
                ) : products.length > 0 ? (
                    products.map((product) => (
                        <ProductCard
                            key={product.code || Math.random()}
                            product={product}
                            onClick={handleProductClick}
                        />
                    ))
                ) : hasSearched && !error ? (
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
                    Live Score Calculator
                </button>
            </div>

            {/* Global Stats Footer */}
            <div className="mt-8 flex flex-col items-center justify-center gap-4 text-muted-foreground/60">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <ThumbsUp className="h-4 w-4" />
                        <span className="text-xs font-medium">{globalStats.up} helpful votes</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <ThumbsDown className="h-4 w-4" />
                        <span className="text-xs font-medium">{globalStats.down} unhelpful votes</span>
                    </div>
                </div>
                <a
                    href="mailto:saheb37@duck.com?subject=Nutrient Profiler Feedback"
                    className="text-xs hover:underline hover:text-blue-500 transition-colors"
                >
                    Report a Bug / Feedback
                </a>
            </div>

            <InstallPrompt />
        </div>
    );
};

export default Home;
