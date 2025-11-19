import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';

const SearchBar = ({ onSearch, isLoading }) => {
    const [query, setQuery] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="relative w-full">
            <div className="relative flex items-center">
                <Search className="absolute left-4 h-5 w-5 text-muted-foreground" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for a product (e.g., Maggi, Lays)..."
                    className="w-full pl-12 pr-12 py-4 rounded-2xl border border-border bg-card text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200 placeholder:text-muted-foreground/70"
                    disabled={isLoading}
                />
                <div className="absolute right-4">
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
    );
};

export default SearchBar;
