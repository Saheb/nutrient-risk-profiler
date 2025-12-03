import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Save, AlertCircle, ScanLine, Loader2 } from 'lucide-react';
import CameraCapture from '../components/CameraCapture';
import { saveCustomProduct } from '../utils/storage';
import { calculateScore } from '../utils/scoring';
import { extractNutritionFromImage } from '../utils/ocr';

const AddProduct = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Photos, 2: Details
    const [showCamera, setShowCamera] = useState(false);
    const [activeCaptureField, setActiveCaptureField] = useState(null); // 'front' or 'nutrition'
    const [isScanning, setIsScanning] = useState(false);

    const [images, setImages] = useState({
        front: null,
        nutrition: null
    });

    const [formData, setFormData] = useState({
        product_name: '',
        brands: '',
        energy_100g: '',
        sugars_100g: '',
        saturated_fat_100g: '',
        sodium_100g: '',
        proteins_100g: '',
        fiber_100g: ''
    });

    const handleCapture = async (imageData) => {
        setImages(prev => ({
            ...prev,
            [activeCaptureField]: imageData
        }));
        setShowCamera(false);

        // Auto-scan if nutrition label
        if (activeCaptureField === 'nutrition') {
            await scanImage(imageData);
        }
    };

    const scanImage = async (imageData) => {
        setIsScanning(true);
        const extracted = await extractNutritionFromImage(imageData);
        setIsScanning(false);

        if (extracted) {
            setFormData(prev => ({
                ...prev,
                ...extracted
            }));
            // Optional: Show a toast or message
        }
    };

    const openCamera = (field) => {
        setActiveCaptureField(field);
        setShowCamera(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = () => {
        // Construct product object compatible with OpenFoodFacts structure
        const product = {
            product_name: formData.product_name,
            brands: formData.brands,
            image_url: images.front,
            image_nutrition_url: images.nutrition,
            nutriments: {
                'energy-kcal_100g': parseFloat(formData.energy_100g) || 0,
                sugars_100g: parseFloat(formData.sugars_100g) || 0,
                'saturated-fat_100g': parseFloat(formData.saturated_fat_100g) || 0,
                sodium_100g: parseFloat(formData.sodium_100g) || 0,
                proteins_100g: parseFloat(formData.proteins_100g) || 0,
                fiber_100g: parseFloat(formData.fiber_100g) || 0
            }
        };

        // Calculate score immediately
        const score = calculateScore(product);

        // Save
        const savedProduct = saveCustomProduct(product);

        if (savedProduct) {
            navigate(`/product/${savedProduct.id}`);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {showCamera && (
                <CameraCapture
                    onCapture={handleCapture}
                    onClose={() => setShowCamera(false)}
                    label={activeCaptureField === 'front' ? "Take Photo of Product Front" : "Take Photo of Nutrition Label"}
                />
            )}

            {/* Header */}
            <div className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="font-bold text-lg">Add New Product</h1>
                    <div className="w-8"></div>
                </div>
            </div>

            <div className="max-w-md mx-auto p-4 space-y-6">

                {/* Step 1: Photos */}
                <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
                    <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                        <Camera size={20} className="text-blue-600" />
                        Step 1: Product Photos
                    </h2>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Front Image */}
                        <div
                            onClick={() => openCamera('front')}
                            className={`aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${images.front ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
                        >
                            {images.front ? (
                                <img src={images.front} alt="Front" className="w-full h-full object-cover rounded-lg" />
                            ) : (
                                <>
                                    <Camera className="text-gray-400 mb-2" />
                                    <span className="text-xs text-gray-500 font-medium">Front</span>
                                </>
                            )}
                        </div>

                        {/* Nutrition Label */}
                        <div
                            onClick={() => openCamera('nutrition')}
                            className={`aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${images.nutrition ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
                        >
                            {images.nutrition ? (
                                <img src={images.nutrition} alt="Nutrition" className="w-full h-full object-cover rounded-lg" />
                            ) : (
                                <>
                                    <Camera className="text-gray-400 mb-2" />
                                    <span className="text-xs text-gray-500 font-medium">Nutrition Label</span>
                                </>
                            )}
                        </div>
                    </div>
                    <p className="text-xs text-gray-500">
                        Take a clear photo of the nutrition label. We'll try to auto-fill the details!
                    </p>
                </div>

                {/* Step 2: Details */}
                <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
                    <h2 className="font-semibold text-gray-800">Step 2: Product Details</h2>

                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Product Name</label>
                            <input
                                type="text"
                                name="product_name"
                                value={formData.product_name}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="e.g. Chocolate Cookies"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Brand</label>
                            <input
                                type="text"
                                name="brands"
                                value={formData.brands}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="e.g. TastyTreats"
                            />
                        </div>
                    </div>
                </div>

                {/* Step 3: Nutrition */}
                <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-gray-800">Step 3: Nutrition (per 100g)</h2>
                        {images.nutrition && (
                            <button
                                onClick={() => scanImage(images.nutrition)}
                                disabled={isScanning}
                                className="text-xs flex items-center gap-1 text-blue-600 font-medium hover:underline disabled:opacity-50"
                            >
                                {isScanning ? <Loader2 size={14} className="animate-spin" /> : <ScanLine size={14} />}
                                {isScanning ? "Scanning..." : "Re-scan Image"}
                            </button>
                        )}
                    </div>

                    {images.nutrition && (
                        <div className="mb-4 p-2 bg-gray-100 rounded-lg">
                            <p className="text-xs text-gray-500 mb-2">Reference Image:</p>
                            <img src={images.nutrition} alt="Ref" className="w-full rounded border" />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Energy (kcal)</label>
                            <input
                                type="number"
                                name="energy_100g"
                                value={formData.energy_100g}
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
                                value={formData.sugars_100g}
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
                                value={formData.saturated_fat_100g}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Sodium (g)</label>
                            <input
                                type="number"
                                name="sodium_100g"
                                value={formData.sodium_100g}
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
                                value={formData.proteins_100g}
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
                                value={formData.fiber_100g}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="0"
                            />
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={!formData.product_name}
                    className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold shadow-lg hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    <Save size={20} />
                    Save & Calculate Score
                </button>

            </div>
        </div>
    );
};

export default AddProduct;
