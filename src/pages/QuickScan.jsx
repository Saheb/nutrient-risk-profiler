import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, ScanLine, Loader2, Calculator, Minus, Plus, ChevronDown, ChevronUp, Info } from 'lucide-react';
import CameraCapture from '../components/CameraCapture';
import { calculateDetailedScore, getScoreColor, getScoreLabel } from '../utils/scoring';
import { extractNutritionFromImage } from '../utils/ocr';

const QuickScan = () => {
    const navigate = useNavigate();
    const [showCamera, setShowCamera] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [nutritionImage, setNutritionImage] = useState(null);
    const [scoreData, setScoreData] = useState(null);
    const [showBreakdown, setShowBreakdown] = useState(true);

    const [nutrients, setNutrients] = useState({
        energy_100g: '',
        carbohydrates_100g: '',
        sugars_100g: '',
        fat_100g: '',
        saturated_fat_100g: '',
        sodium_100g: '', // stored in mg for user input
        proteins_100g: '',
        fiber_100g: ''
    });

    // Calculate score whenever nutrients change
    useEffect(() => {
        const product = {
            nutriments: {
                'energy-kcal_100g': parseFloat(nutrients.energy_100g) || 0,
                carbohydrates_100g: parseFloat(nutrients.carbohydrates_100g) || 0,
                sugars_100g: parseFloat(nutrients.sugars_100g) || 0,
                fat_100g: parseFloat(nutrients.fat_100g) || 0,
                'saturated-fat_100g': parseFloat(nutrients.saturated_fat_100g) || 0,
                // Convert mg to g for scoring (user inputs mg, scoring expects g)
                sodium_100g: (parseFloat(nutrients.sodium_100g) || 0) / 1000,
                proteins_100g: parseFloat(nutrients.proteins_100g) || 0,
                fiber_100g: parseFloat(nutrients.fiber_100g) || 0
            }
        };

        // Only calculate if at least one value is present
        const hasValues = Object.values(nutrients).some(val => val !== '' && val !== null);
        if (hasValues) {
            const detailed = calculateDetailedScore(product);
            setScoreData(detailed);
        } else {
            setScoreData(null);
        }
    }, [nutrients]);

    const handleCapture = async (imageData) => {
        setNutritionImage(imageData);
        setShowCamera(false);
        await scanImage(imageData);
    };

    const scanImage = async (imageData) => {
        setIsScanning(true);
        const extracted = await extractNutritionFromImage(imageData);
        setIsScanning(false);

        if (extracted) {
            setNutrients(prev => ({
                ...prev,
                ...extracted
            }));
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNutrients(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const score = scoreData?.score ?? null;
    const scoreColor = score !== null ? getScoreColor(score) : 'bg-gray-200';
    const scoreLabel = score !== null ? getScoreLabel(score) : 'Unknown';

    const penalties = scoreData?.adjustments.filter(a => a.type === 'penalty') || [];
    const bonuses = scoreData?.adjustments.filter(a => a.type === 'bonus') || [];

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {showCamera && (
                <CameraCapture
                    onCapture={handleCapture}
                    onClose={() => setShowCamera(false)}
                    label="Take Photo of Nutrition Label"
                />
            )}

            {/* Header */}
            <div className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="font-bold text-lg flex items-center gap-2">
                        <Calculator size={20} className="text-blue-600" />
                        Live Score Calculator
                    </h1>
                    <div className="w-8"></div>
                </div>
            </div>

            <div className="max-w-md mx-auto p-4 space-y-6">

                {/* Score Display */}
                <div className={`p-6 rounded-2xl shadow-sm text-center transition-colors duration-500 ${score !== null ? scoreColor.replace('bg-', 'bg-opacity-10 bg-') : 'bg-white'}`}>
                    <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center text-3xl font-bold mb-2 shadow-inner transition-colors duration-500 ${scoreColor} text-white`}>
                        {score !== null ? score : '?'}
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">{scoreLabel}</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {score !== null ? "Real-time risk score based on values below." : "Enter nutrition values to see the score."}
                    </p>
                </div>

                {/* Score Breakdown */}
                {scoreData && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <button
                            onClick={() => setShowBreakdown(!showBreakdown)}
                            className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <Info className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-semibold text-gray-600">
                                    Score Breakdown
                                </span>
                            </div>
                            {showBreakdown ? (
                                <ChevronUp className="h-4 w-4 text-gray-500" />
                            ) : (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                            )}
                        </button>

                        {showBreakdown && (
                            <div className="px-4 pb-4 space-y-3">
                                {/* Base score */}
                                <div className="flex items-center justify-between text-sm py-1 border-b border-gray-100">
                                    <span className="text-gray-500">Base Score</span>
                                    <span className="font-semibold">{scoreData.baseScore}</span>
                                </div>

                                {/* Penalties */}
                                {penalties.length > 0 && (
                                    <div className="space-y-1.5">
                                        <span className="text-xs font-medium text-red-500 uppercase">Penalties</span>
                                        {penalties.map((adj, i) => (
                                            <div key={i} className="flex items-center justify-between text-sm pl-2">
                                                <span className="text-gray-700">
                                                    {adj.label} <span className="text-gray-400 text-xs">({adj.value})</span>
                                                </span>
                                                <span className="flex items-center gap-1 text-red-500 font-medium">
                                                    <Minus className="h-3 w-3" />
                                                    {Math.abs(adj.points)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Bonuses */}
                                {bonuses.length > 0 && (
                                    <div className="space-y-1.5">
                                        <span className="text-xs font-medium text-green-500 uppercase">Bonuses</span>
                                        {bonuses.map((adj, i) => (
                                            <div key={i} className="flex items-center justify-between text-sm pl-2">
                                                <span className="text-gray-700">
                                                    {adj.label} <span className="text-gray-400 text-xs">({adj.value})</span>
                                                </span>
                                                <span className="flex items-center gap-1 text-green-500 font-medium">
                                                    <Plus className="h-3 w-3" />
                                                    {adj.points}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Final score */}
                                <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
                                    <span className="font-semibold">Final Score</span>
                                    <span className="font-bold text-lg">{scoreData.score}</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Camera Action */}
                <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800">Nutrition Values (per 100g)</h3>
                        <button
                            onClick={() => setShowCamera(true)}
                            className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-blue-700 transition-colors"
                        >
                            <Camera size={16} />
                            Scan Label
                        </button>
                    </div>

                    {nutritionImage && (
                        <div className="relative rounded-lg overflow-hidden border bg-gray-100">
                            <img src={nutritionImage} alt="Label" className="w-full opacity-80" />
                            {isScanning && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                                    <div className="bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium">
                                        <Loader2 size={16} className="animate-spin text-blue-600" />
                                        Reading values...
                                    </div>
                                </div>
                            )}
                            {!isScanning && (
                                <button
                                    onClick={() => scanImage(nutritionImage)}
                                    className="absolute bottom-2 right-2 bg-white/90 p-1.5 rounded-md shadow text-xs font-medium flex items-center gap-1 hover:bg-white"
                                >
                                    <ScanLine size={14} /> Re-scan
                                </button>
                            )}
                        </div>
                    )}

                    {/* Row 1: Energy, Carbs, Sugars */}
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Energy (kcal)</label>
                            <input
                                type="number"
                                name="energy_100g"
                                value={nutrients.energy_100g}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Carbs (g)</label>
                            <input
                                type="number"
                                name="carbohydrates_100g"
                                value={nutrients.carbohydrates_100g}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Sugars (g)</label>
                            <input
                                type="number"
                                name="sugars_100g"
                                value={nutrients.sugars_100g}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="0"
                            />
                        </div>
                    </div>

                    {/* Row 2: Total Fat, Sat. Fat */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Total Fat (g)</label>
                            <input
                                type="number"
                                name="fat_100g"
                                value={nutrients.fat_100g}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Sat. Fat (g)</label>
                            <input
                                type="number"
                                name="saturated_fat_100g"
                                value={nutrients.saturated_fat_100g}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="0"
                            />
                        </div>
                    </div>

                    {/* Row 3: Sodium, Protein, Fiber */}
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Sodium (mg)</label>
                            <input
                                type="number"
                                name="sodium_100g"
                                value={nutrients.sodium_100g}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Protein (g)</label>
                            <input
                                type="number"
                                name="proteins_100g"
                                value={nutrients.proteins_100g}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Fiber (g)</label>
                            <input
                                type="number"
                                name="fiber_100g"
                                value={nutrients.fiber_100g}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="0"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <h4 className="text-sm font-semibold text-blue-800 mb-1">How it works</h4>
                    <p className="text-xs text-blue-600">
                        This calculator uses the same scoring logic as the main app. Enter values manually or scan a nutrition label to see the real-time health score breakdown.
                    </p>
                </div>

                {/* Debug View */}
                {nutrients.raw_text && (
                    <div className="bg-gray-100 p-4 rounded-xl border border-gray-200">
                        <details>
                            <summary className="text-xs font-semibold text-gray-600 cursor-pointer select-none">
                                Debug: Raw OCR Text
                            </summary>
                            <pre className="mt-2 text-[10px] text-gray-500 whitespace-pre-wrap font-mono bg-white p-2 rounded border">
                                {nutrients.raw_text}
                            </pre>
                        </details>
                    </div>
                )}

            </div>
        </div>
    );
};

export default QuickScan;
