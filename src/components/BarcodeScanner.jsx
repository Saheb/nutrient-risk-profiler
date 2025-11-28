import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { X } from 'lucide-react';

const BarcodeScanner = ({ onScanSuccess, onClose }) => {
    const scannerRef = useRef(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Use Html5QrcodeScanner for a pre-built UI, or Html5Qrcode for custom UI.
        // Using Html5QrcodeScanner for simplicity and speed as per plan.
        // However, the plan mentioned "modal or overlay", so we need to wrap it.

        const scannerId = "reader";
        let scanner = null;

        try {
            scanner = new Html5QrcodeScanner(
                scannerId,
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                },
                /* verbose= */ false
            );

            scanner.render(
                (decodedText, decodedResult) => {
                    // Handle success
                    console.log(`Scan result: ${decodedText}`, decodedResult);
                    onScanSuccess(decodedText);
                    // Optional: Close scanner automatically on success? 
                    // Let's leave it to the parent or user to close, or maybe close it.
                    // Usually better to close it to avoid multiple scans.
                    scanner.clear();
                    onClose();
                },
                (errorMessage) => {
                    // parse error, ignore it.
                    // console.warn(`Code scan error = ${errorMessage}`);
                }
            );
        } catch (err) {
            console.error("Failed to initialize scanner", err);
            setError("Failed to initialize camera. Please ensure camera permissions are granted.");
        }

        return () => {
            if (scanner) {
                scanner.clear().catch(error => {
                    console.error("Failed to clear html5-qrcode scanner. ", error);
                });
            }
        };
    }, [onScanSuccess, onClose]);

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

                <div className="p-4">
                    {error ? (
                        <div className="text-destructive text-center p-4">
                            {error}
                        </div>
                    ) : (
                        <div id="reader" className="w-full overflow-hidden rounded-lg"></div>
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
