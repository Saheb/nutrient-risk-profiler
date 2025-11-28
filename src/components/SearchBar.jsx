import React, { useState } from 'react';
import { Search, Loader2, ScanBarcode } from 'lucide-react';
import BarcodeScanner from './BarcodeScanner';

const SearchBar = ({ onSearch, isLoading }) => {
    const [query, setQuery] = useState('');
    const [showScanner, setShowScanner] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query);
        }
    };

    const handleScanSuccess = (decodedText) => {
        setQuery(decodedText);
        onSearch(decodedText);
        setShowScanner(false);
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="relative w-full">
                <div className="relative flex items-center">
                    <Search className="absolute left-4 h-5 w-5 text-muted-foreground" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search for a product (e.g., Maggi, Lays)..."
                        className="w-full pl-12 pr-20 py-4 rounded-2xl border border-border bg-card text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200 placeholder:text-muted-foreground/70"
                        disabled={isLoading}
                    />
                    <div className="absolute right-4 flex items-center gap-2">
                        {!isLoading && (
                            <button
                                type="button"
                                onClick={() => setShowScanner(true)}
                                className="p-1 hover:bg-secondary rounded-full transition-colors text-muted-foreground hover:text-foreground"
                                title="Scan Barcode"
                            >
                                <ScanBarcode className="h-5 w-5" />
                            </button>
                        )}
                        {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        ) : (
                            <button
                                type="submit"
                                className="p-1 hover:bg-secondary rounded-full transition-colors"
                                disabled={isLoading}
                            >
                                <span className="sr-only">Search</span>
                                <div className="h-2 w-2 rounded-full bg-primary/50" />
                            </button>
                        )}
                    </div>
                </div>
            </form>

            {showScanner && (
                <BarcodeScanner
                    onScanSuccess={handleScanSuccess}
                    onClose={() => setShowScanner(false)}
                />
            )}
        </>
    );
};

export default SearchBar;
