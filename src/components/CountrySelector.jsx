import React from 'react';
import { Globe } from 'lucide-react';

// Popular countries for the app
const COUNTRIES = [
    { code: '', name: 'All Countries', flag: '🌍' },
    { code: 'IN', name: 'India', flag: '🇮🇳' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦' },
    { code: 'AU', name: 'Australia', flag: '🇦🇺' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪' },
    { code: 'FR', name: 'France', flag: '🇫🇷' },
    { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
    { code: 'AE', name: 'UAE', flag: '🇦🇪' },
    { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
];

const STORAGE_KEY = 'preferred_country';

export const getStoredCountry = () => {
    try {
        return localStorage.getItem(STORAGE_KEY) || '';
    } catch {
        return '';
    }
};

export const setStoredCountry = (code) => {
    try {
        if (code) {
            localStorage.setItem(STORAGE_KEY, code);
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    } catch {
        // Ignore storage errors
    }
};

const CountrySelector = ({ value, onChange, detectedCountry }) => {
    const selectedCountry = COUNTRIES.find(c => c.code === value) || COUNTRIES[0];

    return (
        <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <select
                value={value}
                onChange={(e) => {
                    const newValue = e.target.value;
                    setStoredCountry(newValue);
                    onChange(newValue);
                }}
                className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
            >
                {COUNTRIES.map((country) => (
                    <option key={country.code} value={country.code}>
                        {country.flag} {country.name}
                        {detectedCountry && country.code === detectedCountry && ' (detected)'}
                    </option>
                ))}
            </select>
            {detectedCountry && !value && (
                <span className="text-xs text-muted-foreground">
                    Auto: {COUNTRIES.find(c => c.code === detectedCountry)?.flag || '🌍'}
                </span>
            )}
        </div>
    );
};

export default CountrySelector;
