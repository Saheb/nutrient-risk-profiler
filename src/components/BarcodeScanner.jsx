import React, { useEffect, useRef, useState } from 'react';
import Quagga from '@ericblade/quagga2';
import { X, AlertCircle, Loader2 } from 'lucide-react';

const BarcodeScanner = ({ onScanSuccess, onClose }) => {
    const [error, setError] = useState(null);
    const [isInitializing, setIsInitializing] = useState(true);
    const scannerRef = useRef(null);
    // Track if component is mounted to prevent state updates after unmount
    const mountedRef = useRef(true);
    // Track if Quagga is running to prevent double start/stop
    const runningRef = useRef(false);

    useEffect(() => {
        mountedRef.current = true;
        let ignoreSync = false;

        const initScanner = async () => {
            setError(null);
            setIsInitializing(true);

            // Safety delay
            await new Promise(r => setTimeout(r, 100));
            if (!mountedRef.current) return;

            const constraints = {
                width: 1280,
                height: 720,
                facingMode: "environment",
                aspectRatio: { min: 1, max: 2 }
            };

            const config = {
                inputStream: {
                    type: "LiveStream",
                    constraints: constraints,
                    target: scannerRef.current,
                    area: { // defines rectangle of the detection/localization area
                        top: "10%",    // top offset
                        right: "10%",  // right offset
                        left: "10%",   // left offset
                        bottom: "10%"  // bottom offset
                    },
                },
                locator: {
                    patchSize: "medium",
                    halfSample: true,
                },
                numOfWorkers: 2,
                decoder: {
                    readers: [
                        "ean_reader",
                        "ean_8_reader",
                        "upc_reader",
                        "upc_e_reader"
                    ],
                    debug: {
                        showCanvas: false,
                        showPatches: false,
                        showFoundPatches: false,
                        showSkeleton: false,
                        showLabels: false,
                        showPatchLabels: false,
                        showRemainingPatchLabels: false,
                        boxFromPatches: {
                            showTransformed: false,
                            showTransformedBox: false,
                            showBB: false
                        }
                    }
                },
                locate: true
            };

            try {
                await Quagga.init(config);
                if (!mountedRef.current || ignoreSync) return;

                await Quagga.start();
                runningRef.current = true;
                setIsInitializing(false);

                Quagga.onDetected((result) => {
                    if (result && result.codeResult && result.codeResult.code) {
                        const code = result.codeResult.code;
                        // Basic validation
                        if (isValidBarcode(code)) {
                            // Debounce/Throttling is handled by stop() usually being called immediately
                            onScanSuccess(code);
                            // Stop immediately to prevent duplicate scans
                            Quagga.stop();
                            runningRef.current = false;
                            onClose();
                        }
                    }
                });

            } catch (err) {
                console.error("Quagga Init Failed", err);
                if (mountedRef.current) {
                    let msg = "Failed to access camera.";
                    if (err?.name === 'NotAllowedError') msg = "Camera permission denied.";
                    setError(msg);
                    setIsInitializing(false);
                }
            }
        };

        initScanner();

        return () => {
            mountedRef.current = false;
            ignoreSync = true;
            // Cleanup matches
            Quagga.offDetected();
            if (runningRef.current) {
                Quagga.stop().catch(e => console.warn("Failed to stop Quagga", e));
                runningRef.current = false;
            }
        };
    }, [onScanSuccess, onClose]);


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-md bg-black rounded-2xl shadow-xl overflow-hidden border border-gray-800 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-4 bg-gray-900 border-b border-gray-800 shrink-0 z-20">
                    <h3 className="text-lg font-semibold text-white">Scan Barcode</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Viewport */}
                <div className="flex-1 relative bg-black overflow-hidden flex items-center justify-center">

                    {error ? (
                        <div className="text-center p-6 flex flex-col items-center gap-4">
                            <AlertCircle className="h-12 w-12 text-red-500" />
                            <p className="text-red-400 font-medium">{error}</p>
                            <button
                                onClick={onClose}
                                className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Camera Container */}
                            {/* Quagga needs a direct DOM element to attach video/canvas to. 
                                By default it appends to the target. 
                                We'll give it a clean container.
                                viewport is crucial for Quagga.
                             */}
                            <div
                                ref={scannerRef}
                                className="w-full h-full [&>video]:w-full [&>video]:h-full [&>video]:object-cover"
                            />

                            {/* Loading State */}
                            {isInitializing && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black z-30">
                                    <div className="flex flex-col items-center gap-2 text-blue-400">
                                        <Loader2 className="h-10 w-10 animate-spin" />
                                        <span className="text-sm font-medium">Starting Camera...</span>
                                    </div>
                                </div>
                            )}

                            {/* Overlay Guides */}
                            {!isInitializing && !error && (
                                <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
                                    {/* Darken outer area */}
                                    <div className="absolute inset-0 border-[60px] border-black/50 transition-all duration-300"></div>

                                    {/* Red Line */}
                                    <div className="w-64 h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse"></div>

                                    {/* Corners */}
                                    <div className="absolute w-64 h-40 border-2 border-white/30 rounded-lg"></div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="p-4 bg-gray-900 text-center text-sm text-gray-400 shrink-0 z-20">
                    Align barcode within the frame.
                </div>
            </div>
        </div>
    );
};

export default BarcodeScanner;

// Helper: Validate Barcode (Length + Checksum)
const isValidBarcode = (code) => {
    if (!code || !/^\d+$/.test(code)) return false;
    if (![8, 12, 13, 14].includes(code.length)) return false;
    // Basic Checksum (same as before)
    const digits = code.split('').map(Number);
    const checkDigit = digits.pop();
    const reversedDigits = digits.reverse();
    let sum = 0;
    for (let i = 0; i < reversedDigits.length; i++) {
        sum += reversedDigits[i] * ((i % 2 === 0) ? 3 : 1);
    }
    const calculatedCheckDigit = (10 - (sum % 10)) % 10;
    return checkDigit === calculatedCheckDigit;
};
