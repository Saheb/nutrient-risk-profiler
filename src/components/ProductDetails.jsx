import React, { useState } from 'react';
import { ArrowLeft, Share2, Download, ThumbsUp, ThumbsDown, ExternalLink, Copy, Check, AlertTriangle } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import * as htmlToImage from 'html-to-image';
import { calculateScore, getScoreLabel, getNutrientLevel } from '../utils/scoring';
import ShareModal from './ShareModal';

const ProductDetails = ({ product, onBack }) => {
    if (!product) return null;

    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const score = calculateScore(product);
    const scoreLabel = getScoreLabel(score);
    const [feedback, setFeedback] = useState({ up: 0, down: 0 });
    const [userVote, setUserVote] = useState(null); // 'up', 'down', or null
    const [isCopied, setIsCopied] = useState(false);

    const handleCopyCode = () => {
        navigator.clipboard.writeText(product.code);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    // Load feedback on mount
    React.useEffect(() => {
        if (product?.code) {
            const loadFeedback = async () => {
                try {
                    const res = await fetch(`/api/feedback?id=${product.code}`);
                    if (res.ok) {
                        const data = await res.json();
                        setFeedback(data);
                    }
                } catch (e) {
                    console.error("Failed to load feedback", e);
                }
            };
            loadFeedback();

            // Check local storage for previous vote
            const vote = localStorage.getItem(`vote_${product.code}`);
            if (vote) setUserVote(vote);
        }
    }, [product?.code]);

    const handleVote = async (type) => {
        if (userVote) return; // Already voted

        // Optimistic update
        setFeedback(prev => ({ ...prev, [type]: prev[type] + 1 }));
        setUserVote(type);
        localStorage.setItem(`vote_${product.code}`, type);

        try {
            await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: product.code, type })
            });
        } catch (e) {
            console.error("Failed to submit vote", e);
        }
    };

    // Determine colors based on score
    let colorTheme = {
        border: 'border-red-500/50',
        bg: 'bg-red-500/5',
        text: 'text-red-700 dark:text-red-400',
        badge: 'bg-red-500'
    };

    if (score >= 90) {
        colorTheme = {
            border: 'border-emerald-600/50',
            bg: 'bg-emerald-600/5',
            text: 'text-emerald-700 dark:text-emerald-400',
            badge: 'bg-emerald-600'
        };
    } else if (score >= 70) {
        colorTheme = {
            border: 'border-green-500/50',
            bg: 'bg-green-500/5',
            text: 'text-green-700 dark:text-green-400',
            badge: 'bg-green-500'
        };
    } else if (score >= 40) {
        colorTheme = {
            border: 'border-yellow-500/50',
            bg: 'bg-yellow-500/5',
            text: 'text-yellow-700 dark:text-yellow-400',
            badge: 'bg-yellow-500'
        };
    }

    const handleDownload = async () => {
        const element = document.getElementById('product-analysis-card');
        const header = document.getElementById('card-header');
        const footer = document.getElementById('card-footer');

        if (element) {
            try {
                // Temporarily modify DOM for screenshot
                if (header) header.style.display = 'none';
                if (footer) {
                    footer.classList.remove('hidden');
                    footer.style.display = 'flex';
                }

                // Hide external link icon for screenshot
                const externalLinkIcon = document.getElementById('nutriscore-external-icon');
                if (externalLinkIcon) externalLinkIcon.style.display = 'none';

                const blob = await generateImageBlob(element, header, footer, externalLinkIcon);
                if (!blob) throw new Error('Failed to generate blob');

                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = `${product.product_name.replace(/\s+/g, '-').toLowerCase()}-analysis.png`;
                link.href = url;
                link.click();
                URL.revokeObjectURL(url);
            } catch (err) {

                console.error('Failed to download image:', err);
                alert('Failed to generate image. Please try again.');

                // Ensure DOM is restored even on error
                if (header) header.style.display = '';
                if (footer) {
                    footer.classList.add('hidden');
                    footer.style.display = '';
                }
            }
        }
    };

    return (
        <>
            <Helmet>
                <title>{`Nutrient Risk Profiler: ${product.product_name}`}</title>
                <meta name="description" content={`Check out ${product.product_name}! Risk Score: ${score} (${scoreLabel}).`} />

                {/* Open Graph / Facebook */}
                <meta property="og:type" content="website" />
                <meta property="og:title" content={`Nutrient Risk Profiler: ${product.product_name}`} />
                <meta property="og:description" content={`Check out ${product.product_name}! Risk Score: ${score} (${scoreLabel}).`} />
                {product.image_url && <meta property="og:image" content={product.image_url} />}

                {/* Twitter */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={`Nutrient Risk Profiler: ${product.product_name}`} />
                <meta name="twitter:description" content={`Check out ${product.product_name}! Risk Score: ${score} (${scoreLabel}).`} />
                {product.image_url && <meta name="twitter:image" content={product.image_url} />}
            </Helmet>

            <div id="product-analysis-card" className={`w-full bg-card rounded-xl border shadow-sm overflow-hidden ${colorTheme.border} ${colorTheme.bg}`}>
                {/* Header */}
                <div id="card-header" className="p-3 flex items-center justify-between border-b border-border/50">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} className="p-1.5 hover:bg-secondary rounded-full transition-colors">
                            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
                        </button>
                        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Product Analysis</h2>
                    </div>
                    <div className="flex items-center gap-1">
                        <button onClick={handleDownload} className="p-1.5 hover:bg-secondary rounded-full transition-colors" title="Download Image">
                            <Download className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <button onClick={() => setIsShareModalOpen(true)} className="p-1.5 hover:bg-secondary rounded-full transition-colors" title="Share">
                            <Share2 className="h-4 w-4 text-muted-foreground" />
                        </button>
                    </div>
                </div>

                <div className="p-4 flex flex-col gap-5">
                    {/* Data Quality Warning */}
                    {(product.states_tags?.includes('en:ingredients-to-be-completed') || !product.ingredients_text) && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-amber-800">
                                <p className="font-medium">Incomplete Product Data</p>
                                <p className="text-xs opacity-90 mt-0.5">
                                    Ingredients are missing for this product.
                                    The Nutri-Risk score may be inaccurate as it cannot account for additives or specific ingredients.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Top Section: Horizontal Layout */}
                    <div className="flex items-start gap-4">
                        {/* Product Image */}
                        <div className="h-24 w-24 flex-shrink-0 rounded-lg overflow-hidden bg-white p-2 border border-border/50 shadow-sm">
                            {product.image_url ? (
                                <img src={product.image_url} alt={product.product_name} className="h-full w-full object-contain" />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">No Image</div>
                            )}
                        </div>

                        {/* Product Info & Score */}
                        <div className="flex-1 min-w-0 flex flex-col gap-3">
                            <div>
                                <h1 className="font-bold text-lg leading-tight truncate">{product.product_name}</h1>
                                <p className="text-sm text-muted-foreground truncate">{product.brands}</p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 mt-auto">
                                <div className={`px-3 py-1 rounded-full text-white text-sm font-bold shadow-sm ${colorTheme.badge}`}>
                                    Score: {score}
                                </div>
                                <span className={`text-sm font-medium ${colorTheme.text}`}>
                                    {scoreLabel}
                                </span>
                                {product.nutriscore_grade && (
                                    <a
                                        href={`https://world.openfoodfacts.org/product/${product.code}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary/10 border border-border/50 hover:bg-secondary/20 transition-colors group"
                                        title="View on OpenFoodFacts"
                                    >
                                        <span className="text-[10px] font-semibold text-muted-foreground uppercase">Nutri-Score</span>
                                        <span className={`text-sm font-bold uppercase ${getNutriScoreColor(product.nutriscore_grade)}`}>
                                            {product.nutriscore_grade}
                                        </span>
                                        <ExternalLink id="nutriscore-external-icon" className="h-3 w-3 text-muted-foreground/50 group-hover:text-muted-foreground ml-0.5" />
                                    </a>
                                )}
                            </div>

                        </div>
                    </div>

                    {/* Nutritional Highlights */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nutritional Highlights</h3>
                            <span className="text-[10px] text-muted-foreground">(per 100g)</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <NutrientBox label="Kcal" value={product.nutriments?.['energy-kcal_100g']} unit="" />
                            <NutrientBox label="Protein" value={product.nutriments?.proteins_100g} unit="g" nutrientType="protein" />
                            <NutrientBox
                                label="Sodium"
                                value={
                                    (product.nutriments?.sodium_100g < 1 && product.nutriments?.sodium_100g > 0)
                                        ? product.nutriments?.sodium_100g * 1000
                                        : product.nutriments?.sodium_100g
                                }
                                unit={
                                    (product.nutriments?.sodium_100g < 1 && product.nutriments?.sodium_100g > 0)
                                        ? "mg"
                                        : "g"
                                }
                                nutrientType="sodium"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <NutrientBox label="Carbs" value={product.nutriments?.carbohydrates_100g} unit="g" />
                            <NutrientBox label="Fiber" value={product.nutriments?.fiber_100g} unit="g" nutrientType="fiber" />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            {/* Sugar Group */}
                            <div className="flex flex-col gap-1.5 p-2 rounded-xl bg-secondary/5 border border-border/50">
                                <NutrientBox label="Total Sugar" value={product.nutriments?.sugars_100g} unit="g" nutrientType="sugar" />
                                <div className="px-1">
                                    <NutrientBox label="Added Sugar" value={product.nutriments?.['added-sugars_100g']} unit="g" nutrientType="added-sugars" />
                                </div>
                            </div>

                            {/* Fat Group */}
                            <div className="flex flex-col gap-1.5 p-2 rounded-xl bg-secondary/5 border border-border/50">
                                <NutrientBox label="Total Fat" value={product.nutriments?.['fat_100g']} unit="g" nutrientType="fat" />
                                <div className="grid grid-cols-2 gap-1 px-1">
                                    <NutrientBox label="Sat. Fat" value={product.nutriments?.['saturated-fat_100g']} unit="g" nutrientType="saturated-fat" />
                                    <NutrientBox label="Trans Fat" value={product.nutriments?.['trans-fat_100g']} unit="g" nutrientType="trans-fat" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Ingredients */}
                    {product.ingredients_text && (
                        <div className="w-full space-y-1.5 bg-background/50 p-3 rounded-lg border border-border/50">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ingredients</h3>
                            <p className="text-xs text-foreground/90 leading-relaxed line-clamp-4">
                                {product.ingredients_text}
                            </p>
                        </div>
                    )}

                    {/* Barcode Display (Bottom) */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                        <span className="text-xs text-muted-foreground">Product Code:</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground font-mono bg-secondary/20 px-1.5 py-0.5 rounded border border-border/50 select-all">
                                {product.code}
                            </span>
                            <button
                                onClick={handleCopyCode}
                                className="p-1 hover:bg-secondary rounded-md transition-colors group"
                                title="Copy Barcode"
                            >
                                {isCopied ? (
                                    <Check className="h-3 w-3 text-green-500" />
                                ) : (
                                    <Copy className="h-3 w-3 text-muted-foreground group-hover:text-foreground" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>





                {/* Footer for Image Download */}
                <div id="card-footer" className="hidden p-6 border-t border-border/50 bg-secondary/10 flex-col items-center justify-center text-center gap-2">
                    <p className="text-lg font-bold text-foreground">Powered by OpenFoodFacts</p>
                    <p className="text-sm font-medium text-muted-foreground">View on Nutrient Risk Profiler</p>
                    <p className="text-xs text-muted-foreground/70">{window.location.href}</p>
                </div>
            </div >

            {/* Feedback Section */}
            <div className="px-4 py-6 flex flex-col items-center gap-3">
                <p className="text-xs font-medium text-muted-foreground">Was this analysis helpful?</p>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => handleVote('up')}
                        disabled={!!userVote}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all ${userVote === 'up'
                            ? 'bg-green-500/10 border-green-500 text-green-600'
                            : 'bg-background border-border hover:bg-secondary'
                            }`}
                    >
                        <ThumbsUp className={`h-4 w-4 ${userVote === 'up' ? 'fill-current' : ''}`} />
                        <span className="text-xs font-semibold">{feedback.up}</span>
                    </button>
                    <button
                        onClick={() => handleVote('down')}
                        disabled={!!userVote}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all ${userVote === 'down'
                            ? 'bg-red-500/10 border-red-500 text-red-600'
                            : 'bg-background border-border hover:bg-secondary'
                            }`}
                    >
                        <ThumbsDown className={`h-4 w-4 ${userVote === 'down' ? 'fill-current' : ''}`} />
                        <span className="text-xs font-semibold">{feedback.down}</span>
                    </button>
                </div>
            </div>

            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                product={product}
                score={score}
                scoreLabel={scoreLabel}
                onDownload={handleDownload}
                onGenerateImage={() => {
                    const element = document.getElementById('product-analysis-card');
                    const header = document.getElementById('card-header');
                    const footer = document.getElementById('card-footer');
                    const externalLinkIcon = document.getElementById('nutriscore-external-icon');
                    return generateImageBlob(element, header, footer, externalLinkIcon);
                }}
            />
        </>
    );
};

const NutrientBox = ({ label, value, unit, nutrientType, className = '' }) => {
    let level = 'neutral';
    if (nutrientType) {
        level = getNutrientLevel(nutrientType, value);
    }

    let colorClass = 'bg-secondary/10 border-border/50';
    // Use semantic colors to handle both native dark mode and browser-forced dark modes
    let textClass = 'text-foreground/70';
    let valueClass = 'text-foreground';

    if (level === 'high') {
        colorClass = 'bg-red-500/10 border-red-500/20';
        textClass = 'text-slate-900 dark:text-slate-100';
        valueClass = 'text-black dark:text-white';
    } else if (level === 'medium') {
        colorClass = 'bg-yellow-500/10 border-yellow-500/20';
        textClass = 'text-slate-900 dark:text-slate-100';
        valueClass = 'text-black dark:text-white';
    } else if (level === 'low' || level === 'good') {
        colorClass = 'bg-green-500/10 border-green-500/20';
        textClass = 'text-slate-900 dark:text-slate-100';
        valueClass = 'text-black dark:text-white';
    }

    return (
        <div className={`flex flex-col items-center justify-center p-2 rounded-lg border shadow-sm transition-colors ${colorClass} ${className}`}>
            <span className={`text-[11px] uppercase font-bold tracking-wide ${textClass}`}>{label}</span>
            <span className={`font-extrabold text-base ${valueClass}`}>
                {value !== undefined && value !== null ? Math.round(value) : '?'}
                <span className="text-[11px] font-bold opacity-70 ml-0.5">{unit}</span>
            </span>
        </div>
    );
};

export default ProductDetails;

const getNutriScoreColor = (grade) => {
    switch (grade?.toLowerCase()) {
        case 'a': return 'text-green-600';
        case 'b': return 'text-emerald-500';
        case 'c': return 'text-yellow-500';
        case 'd': return 'text-orange-500';
        case 'e': return 'text-red-500';
        default: return 'text-gray-500';
    }
};

const generateImageBlob = async (element, header, footer, externalLinkIcon) => {
    if (!element) return null;

    try {
        // Temporarily modify DOM for screenshot
        if (header) header.style.display = 'none';
        if (footer) {
            footer.classList.remove('hidden');
            footer.style.display = 'flex';
        }
        if (externalLinkIcon) externalLinkIcon.style.display = 'none';

        // Get body background color
        const bodyStyle = window.getComputedStyle(document.body);
        const bgColor = bodyStyle.backgroundColor;

        const blob = await htmlToImage.toBlob(element, {
            cacheBust: true,
            useCORS: true,
            pixelRatio: 3,
            backgroundColor: bgColor
        });

        // Restore DOM
        if (header) header.style.display = '';
        if (footer) {
            footer.classList.add('hidden');
            footer.style.display = '';
        }
        if (externalLinkIcon) externalLinkIcon.style.display = '';

        return blob;
    } catch (err) {
        console.error('Failed to generate image blob:', err);
        // Ensure DOM is restored even on error
        if (header) header.style.display = '';
        if (footer) {
            footer.classList.add('hidden');
            footer.style.display = '';
        }
        if (externalLinkIcon) externalLinkIcon.style.display = '';
        return null;
    }
};
