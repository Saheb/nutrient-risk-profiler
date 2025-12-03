import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, X } from 'lucide-react';

const CameraCapture = ({ onCapture, onClose, label = "Take Photo" }) => {
    const videoRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [error, setError] = useState(null);
    const [facingMode, setFacingMode] = useState('environment'); // Default to back camera

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, [facingMode]);

    const startCamera = async () => {
        stopCamera();
        setError(null);
        try {
            const constraints = {
                video: {
                    facingMode: facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };
            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Camera error:", err);
            setError("Could not access camera. Please check permissions.");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const takePhoto = () => {
        if (!videoRef.current) return;

        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0);

        // Convert to base64
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        onCapture(imageData);
        stopCamera();
    };

    const switchCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-4 text-white bg-black/50 absolute top-0 left-0 right-0 z-10">
                <h3 className="font-semibold text-lg">{label}</h3>
                <button onClick={onClose} className="p-2 rounded-full bg-white/20 hover:bg-white/30">
                    <X size={24} />
                </button>
            </div>

            {/* Camera View */}
            <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
                {error ? (
                    <div className="text-white text-center p-6">
                        <p className="mb-4 text-red-400">{error}</p>
                        <button
                            onClick={startCamera}
                            className="px-4 py-2 bg-white/20 rounded-lg text-sm"
                        >
                            Retry
                        </button>
                    </div>
                ) : (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                )}
            </div>

            {/* Controls */}
            <div className="p-8 bg-black/80 flex justify-around items-center">
                <button
                    onClick={switchCamera}
                    className="p-3 rounded-full bg-white/20 text-white hover:bg-white/30"
                >
                    <RefreshCw size={24} />
                </button>

                <button
                    onClick={takePhoto}
                    className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center bg-white/20 hover:bg-white/40 transition-colors"
                >
                    <div className="w-12 h-12 bg-white rounded-full"></div>
                </button>

                <div className="w-12"></div> {/* Spacer for balance */}
            </div>
        </div>
    );
};

export default CameraCapture;
