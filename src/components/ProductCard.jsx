import React, { useMemo } from 'react';
import { calculateScore, getScoreColor } from '../utils/scoring';

const ProductCard = React.memo(({ product, onClick }) => {
    // Memoize score calculation to avoid recalculating on every render
    const score = useMemo(() => calculateScore(product), [product]);
    const scoreColorClass = useMemo(() => getScoreColor(score), [score]);

    return (
        <div
            onClick={() => onClick(product)}
            className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
        >
            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-secondary">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.product_name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">
                        No Img
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground truncate">{product.product_name || 'Unknown Product'}</h3>
                <p className="text-sm text-muted-foreground truncate">{product.brands || 'Unknown Brand'}</p>
            </div>

            {/* Score Badge */}
            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${scoreColorClass}`}>
                {score !== null ? score : '?'}
            </div>
        </div>
    );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;

