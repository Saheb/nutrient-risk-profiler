import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, AlertCircle, Loader2, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';

const BarcodeScanner = ({ onScanSuccess, onClose }) => {
    const [error, setError] = useState(null);
    const [isScanning, setIsScanning] = useState(true);
    const [cameras, setCameras] = useState([]);
    const [selectedCameraId, setSelectedCameraId] = useState(null);
    const [zoomCapability, setZoomCapability] = useState(null);
    const [zoomValue, setZoomValue] = useState(1);

    const scannerRef = useRef(null);
    const scannerId = "reader";

    // Fetch cameras on mount
    useEffect(() => {
        Html5Qrcode.getCameras().then(devices => {
            if (devices && devices.length) {
                setCameras(devices);
                // Default to the last camera (usually back camera on mobile) or the one labeled "back"
                const backCamera = devices.find(d => d.label.toLowerCase().includes('back')) || devices[devices.length - 1];
                setSelectedCameraId(backCamera.id);
            }
        }).catch(err => {
            console.error("Error getting cameras", err);
            // Fallback to facingMode if enumeration fails
            setSelectedCameraId("environment");
        });
    }, []);

    useEffect(() => {
        if (!selectedCameraId) return;

        let html5QrCode;

        const startScanning = async () => {
            try {
                // If instance exists, stop it first
                if (scannerRef.current) {
                    await scannerRef.current.stop().catch(err => console.warn("Stop failed", err));
                }

                html5QrCode = new Html5Qrcode(scannerId);
                scannerRef.current = html5QrCode;

                const config = {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                    videoConstraints: {
                        width: { min: 640, ideal: 1280, max: 1920 },
                        height: { min: 480, ideal: 720, max: 1080 },
                        focusMode: "continuous"
                    }
                };

                // Use ID if available, otherwise facingMode
                const cameraIdOrConfig = cameras.length > 0 ? selectedCameraId : { facingMode: "environment" };

                await html5QrCode.start(
                    cameraIdOrConfig,
                    config,
                    (decodedText, decodedResult) => {
                        console.log(`Scan result: ${decodedText}`, decodedResult);
                        onScanSuccess(decodedText);
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
                setError(null);

                // Check for zoom capabilities
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

            } catch (err) {
                console.error("Failed to start scanner", err);
                setError("Failed to start camera. Please ensure camera permissions are granted.");
                setIsScanning(false);
            }
        };

        // Small delay to ensure DOM is ready and previous cleanup is done
        const timer = setTimeout(() => {
            startScanning();
        }, 300);

        return () => {
            clearTimeout(timer);
            if (scannerRef.current) {
                scannerRef.current.stop().catch(error => {
                    console.warn("Failed to stop html5-qrcode scanner cleanup. ", error);
                });
            }
        };
    }, [selectedCameraId, onScanSuccess, onClose]); // Re-run when camera changes

    const handleRetry = () => {
        setError(null);
        setIsScanning(true);
        // Force re-selection to trigger effect
        const currentId = selectedCameraId;
        setSelectedCameraId(null);
        setTimeout(() => setSelectedCameraId(currentId), 100);
    };

    const handleCameraChange = (e) => {
        setSelectedCameraId(e.target.value);
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
                                Retry
                            </button>
                        </div>
                    ) : (
                        <div className="w-full flex flex-col gap-4">
                            {/* Camera Selector */}
                            {cameras.length > 1 && (
                                <div className="flex items-center gap-2 bg-background/80 p-2 rounded-lg border border-border">
                                    <Camera className="h-4 w-4 text-muted-foreground" />
                                    <select
                                        value={selectedCameraId || ''}
                                        onChange={handleCameraChange}
                                        className="flex-1 bg-transparent text-sm outline-none"
                                    >
                                        {cameras.map(cam => (
                                            <option key={cam.id} value={cam.id}>
                                                {cam.label || `Camera ${cam.id.slice(0, 5)}...`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="w-full relative rounded-lg overflow-hidden bg-black aspect-square">
                                <div id={scannerId} className="w-full h-full"></div>
                                {!isScanning && !error && (
                                    <div className="absolute inset-0 flex items-center justify-center text-white">
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
                    Point your camera at a product barcode. <br />
                    Try switching cameras if image is blurry.
                </div>
            </div>
        </div>
    );
};

export default BarcodeScanner;
