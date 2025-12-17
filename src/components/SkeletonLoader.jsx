import React from 'react';

/**
 * Skeleton loading components for polished loading states.
 */

export const SkeletonPulse = ({ className = '' }) => (
    <div className={`animate-pulse bg-secondary/30 rounded ${className}`} />
);

export const ProductCardSkeleton = () => (
    <div className="w-full p-4 border rounded-lg shadow-sm bg-card animate-pulse">
        <div className="flex items-start gap-3">
            {/* Image placeholder */}
            <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-secondary/30" />

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-2">
                {/* Title */}
                <div className="h-4 bg-secondary/30 rounded w-3/4" />
                {/* Brand */}
                <div className="h-3 bg-secondary/30 rounded w-1/2" />
                {/* Score badge */}
                <div className="h-6 bg-secondary/30 rounded-full w-16 mt-2" />
            </div>
        </div>
    </div>
);

export const ProductListSkeleton = ({ count = 3 }) => (
    <div className="flex flex-col gap-3">
        {Array.from({ length: count }).map((_, i) => (
            <ProductCardSkeleton key={i} />
        ))}
    </div>
);

export const ProductDetailsSkeleton = () => (
    <div className="w-full bg-card rounded-xl border shadow-sm overflow-hidden animate-pulse">
        {/* Header */}
        <div className="p-3 flex items-center justify-between border-b">
            <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-secondary/30 rounded-full" />
                <div className="h-4 w-24 bg-secondary/30 rounded" />
            </div>
        </div>

        <div className="p-4 space-y-5">
            {/* Top section */}
            <div className="flex items-start gap-4">
                <div className="h-24 w-24 bg-secondary/30 rounded-lg" />
                <div className="flex-1 space-y-3">
                    <div className="h-5 bg-secondary/30 rounded w-3/4" />
                    <div className="h-4 bg-secondary/30 rounded w-1/2" />
                    <div className="h-8 bg-secondary/30 rounded-full w-20" />
                </div>
            </div>

            {/* Nutrients */}
            <div className="grid grid-cols-3 gap-2">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-secondary/30 rounded-lg" />
                ))}
            </div>

            {/* More nutrients */}
            <div className="grid grid-cols-2 gap-2">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-24 bg-secondary/30 rounded-lg" />
                ))}
            </div>
        </div>
    </div>
);

export default {
    SkeletonPulse,
    ProductCardSkeleton,
    ProductListSkeleton,
    ProductDetailsSkeleton
};
