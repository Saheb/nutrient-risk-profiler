import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, AlertCircle, Loader2, ZoomIn, ZoomOut } from 'lucide-react';

const BarcodeScanner = ({ onScanSuccess, onClose }) => {
    const [error, setError] = useState(null);
    const [isScanning, setIsScanning] = useState(true);
    const [zoomCapability, setZoomCapability] = useState(null);
    const [zoomValue, setZoomValue] = useState(1);

    const scannerRef = useRef(null);
    const scannerId = "reader";

    // Manage Scanner Lifecycle
    useEffect(() => {
        let isMounted = true;

        const startScanner = async () => {
            setError(null);

            // 1. Stop existing scanner if running (cleanup safety)
            if (scannerRef.current) {
                try {
                    await scannerRef.current.stop();
                } catch (err) {
                    console.warn("Failed to stop previous scanner instance", err);
                }
            }

            if (!isMounted) return;

            // 2. Initialize new scanner with restricted formats (1D only for products)
            const formatsToSupport = [
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.EAN_8,
                Html5QrcodeSupportedFormats.UPC_A,
                Html5QrcodeSupportedFormats.UPC_E,
                Html5QrcodeSupportedFormats.CODE_128,
            ];
            const html5QrCode = new Html5Qrcode(scannerId, { formatsToSupport, verbose: false });
            scannerRef.current = html5QrCode;

            const config = {
                fps: 15, // Higher FPS for smoother feel
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
                videoConstraints: {
                    // Remove ideal resolution constraints to let browser pick optimal stream
                    // This often results in smoother performance on iOS
                    focusMode: "continuous",
                    facingMode: "environment"
                }
            };

            try {
                await html5QrCode.start(
                    { facingMode: "environment" }, // Prefer back camera
                    config,
                    (decodedText, decodedResult) => {
                        // Validate barcode before accepting
                        if (isValidBarcode(decodedText)) {
                            console.log(`Valid scan result: ${decodedText}`, decodedResult);
                            onScanSuccess(decodedText);

                            // Stop on success
                            html5QrCode.stop().then(() => {
                                scannerRef.current = null;
                                onClose();
                            }).catch(err => console.error("Failed to stop scanner after success", err));
                        } else {
                            console.warn(`Ignored invalid/partial scan: ${decodedText}`);
                        }
                    },
                    (errorMessage) => {
                        // parse error, ignore it.
                    }
                );


                if (isMounted) {
                    setIsScanning(true);

                    // 3. Check Zoom Capabilities
                    try {
                        const capabilities = html5QrCode.getRunningTrackCameraCapabilities();
                        const zoomCap = capabilities.zoomFeature();
                        if (zoomCap && zoomCap.isSupported()) {
                            setZoomCapability(zoomCap);
                            setZoomValue(zoomCap.value());
                        } else {
                            setZoomCapability(null);
                        }
                    } catch (e) {
                        console.warn("Zoom capabilities not supported", e);
                    }
                }
            } catch (err) {
                if (isMounted) {
                    console.error("Failed to start scanner", err);
                    setError("Failed to start camera. Please ensure camera permissions are granted.");
                    setIsScanning(false);
                }
            }
        };

        // Small delay to ensure DOM is ready
        const timer = setTimeout(startScanner, 300);

        return () => {
            isMounted = false;
            clearTimeout(timer);
            if (scannerRef.current) {
                scannerRef.current.stop().catch(err => console.warn("Cleanup stop failed", err));
            }
        };
    }, [onScanSuccess, onClose]);

    const handleRetry = () => {
        setError(null);
        setIsScanning(true);
        // Simple retry by forcing re-mount logic via parent or just calling startScanner again?
        // Since startScanner is in useEffect, we can't call it directly easily without extracting it.
        // But closing and reopening is the cleanest retry from user perspective if we don't want complex state.
        // For now, let's just close.
        onClose();
    };

    const handleZoomChange = (e) => {
        const newZoom = parseFloat(e.target.value);
        setZoomValue(newZoom);
        if (scannerRef.current && zoomCapability) {
            zoomCapability.apply(newZoom);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-md bg-card rounded-2xl shadow-xl overflow-hidden border border-border flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
                    <h3 className="text-lg font-semibold">Scan Barcode</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-secondary rounded-full transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-4 flex-1 flex flex-col items-center justify-center bg-black/5 overflow-y-auto">
                    {error ? (
                        <div className="text-center p-4 flex flex-col items-center gap-3">
                            <AlertCircle className="h-10 w-10 text-destructive" />
                            <p className="text-destructive font-medium">{error}</p>
                            <button
                                onClick={handleRetry}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                            >
                                Close & Retry
                            </button>
                        </div>
                    ) : (
                        <div className="w-full flex flex-col gap-4">
                            <div className="w-full relative rounded-lg overflow-hidden bg-black aspect-square">
                                <div id={scannerId} className="w-full h-full"></div>
                                {!isScanning && !error && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white z-10">
                                        <Loader2 className="h-8 w-8 animate-spin" />
                                    </div>
                                )}
                            </div>

                            {/* Zoom Control */}
                            {zoomCapability && (
                                <div className="flex items-center gap-3 px-2">
                                    <ZoomOut className="h-4 w-4 text-muted-foreground" />
                                    <input
                                        type="range"
                                        min={zoomCapability.min()}
                                        max={zoomCapability.max()}
                                        step={zoomCapability.step()}
                                        value={zoomValue}
                                        onChange={handleZoomChange}
                                        className="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                                    />
                                    <ZoomIn className="h-4 w-4 text-muted-foreground" />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-4 bg-secondary/50 text-center text-sm text-muted-foreground shrink-0">
                    Point your camera at a product barcode.
                </div>
            </div>
        </div>
    );
};

export default BarcodeScanner;

// Helper: Validate Barcode (Length + Checksum)
const isValidBarcode = (code) => {
    if (!code || !/^\d+$/.test(code)) return false;

    // Standard lengths for EAN-8, EAN-13, UPC-A (12), GTIN-14
    if (![8, 12, 13, 14].includes(code.length)) return false;

    // Checksum Validation (Modulo 10)
    // 1. Sum odd-position digits (from right) * 3
    // 2. Sum even-position digits (from right) * 1
    // 3. Total sum + check digit should be divisible by 10

    const digits = code.split('').map(Number);
    const checkDigit = digits.pop(); // Remove last digit (check digit)
    const reversedDigits = digits.reverse();

    let sum = 0;
    for (let i = 0; i < reversedDigits.length; i++) {
        const weight = (i % 2 === 0) ? 3 : 1; // Odd positions from right get weight 3
        sum += reversedDigits[i] * weight;
    }

    const calculatedCheckDigit = (10 - (sum % 10)) % 10;
    return checkDigit === calculatedCheckDigit;
};
