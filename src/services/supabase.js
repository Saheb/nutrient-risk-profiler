import { createClient } from '@supabase/supabase-js';

// These would normally be in .env
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.warn("Supabase credentials not found. Falling back to local cache.");
}

export { supabase };

// Simple local cache implementation as fallback
export const localCache = {
    get: (key) => {
        const item = localStorage.getItem(key);
        if (!item) return null;
        try {
            const { value, timestamp } = JSON.parse(item);
            // Cache for 24 hours
            if (Date.now() - timestamp > 24 * 60 * 60 * 1000) {
                localStorage.removeItem(key);
                return null;
            }
            return value;
        } catch (e) {
            return null;
        }
    },
    set: (key, value) => {
        try {
            const item = {
                value,
                timestamp: Date.now()
            };
            localStorage.setItem(key, JSON.stringify(item));
        } catch (e) {
            // Quota exceeded - clear old search cache entries and retry
            if (e.name === 'QuotaExceededError') {
                console.warn('LocalStorage quota exceeded, clearing old search cache...');
                // Remove all search_* entries
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const k = localStorage.key(i);
                    if (k && k.startsWith('search_')) {
                        keysToRemove.push(k);
                    }
                }
                keysToRemove.forEach(k => localStorage.removeItem(k));

                // Retry once after clearing
                try {
                    const item = { value, timestamp: Date.now() };
                    localStorage.setItem(key, JSON.stringify(item));
                } catch (retryError) {
                    console.warn('LocalStorage still full after clearing search cache');
                }
            } else {
                console.error("Local cache set failed", e);
            }
        }
    }
};
