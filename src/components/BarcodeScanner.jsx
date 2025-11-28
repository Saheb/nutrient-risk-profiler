import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, AlertCircle, Loader2 } from 'lucide-react';

const BarcodeScanner = ({ onScanSuccess, onClose }) => {
    const [error, setError] = useState(null);
    const [isScanning, setIsScanning] = useState(true);
    const scannerRef = useRef(null);
    const scannerId = "reader";

    useEffect(() => {
        let html5QrCode;

        const startScanning = async () => {
            try {
                html5QrCode = new Html5Qrcode(scannerId);
                scannerRef.current = html5QrCode;

                await html5QrCode.start(
                    { facingMode: "environment" }, // Prefer back camera
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0
                    },
                    (decodedText, decodedResult) => {
                        console.log(`Scan result: ${decodedText}`, decodedResult);
                        onScanSuccess(decodedText);

                        // Stop scanning after success
                        html5QrCode.stop().then(() => {
                            scannerRef.current = null;
                            onClose();
                        }).catch(err => console.error("Failed to stop scanner", err));
                    },
                    (errorMessage) => {
                        // parse error, ignore it.
                    }
                );
                setIsScanning(true);
            } catch (err) {
                console.error("Failed to start scanner", err);
                setError("Failed to start camera. Please ensure camera permissions are granted.");
                setIsScanning(false);
            }
        };

        // Small delay to ensure DOM is ready
        const timer = setTimeout(() => {
            startScanning();
        }, 100);

        return () => {
            clearTimeout(timer);
            if (scannerRef.current) {
                scannerRef.current.stop().catch(error => {
                    console.error("Failed to stop html5-qrcode scanner cleanup. ", error);
                });
            }
        };
    }, [onScanSuccess, onClose]);

    const handleRetry = () => {
        setError(null);
        setIsScanning(true);
        // Re-trigger effect by unmounting/remounting or just logic? 
        // Simplest is to just reload the component or try to restart.
        // For now, let's just close and let user try again, or we could make the effect depend on a retry counter.
        // But closing is safer state-wise.
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-md bg-card rounded-2xl shadow-xl overflow-hidden border border-border">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h3 className="text-lg font-semibold">Scan Barcode</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-secondary rounded-full transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-4 min-h-[300px] flex flex-col items-center justify-center bg-black/5">
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
                        <div className="w-full relative">
                            <div id={scannerId} className="w-full overflow-hidden rounded-lg bg-black"></div>
                            {!isScanning && !error && (
                                <div className="absolute inset-0 flex items-center justify-center text-white">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-4 bg-secondary/50 text-center text-sm text-muted-foreground">
                    Point your camera at a product barcode
                </div>
            </div>
        </div>
    );
};

export default BarcodeScanner;
