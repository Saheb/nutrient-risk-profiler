import React, { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';

const InstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showIOSPrompt, setShowIOSPrompt] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Check if already installed/standalone
        if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
            setIsStandalone(true);
        }

        // iOS Detection
        // Check for iOS user agent OR iPad requesting desktop site (maxTouchPoints > 0)
        const checkIsIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        setIsIOS(checkIsIOS);

        // Android / Desktop
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);

        if (checkIsIOS && !window.matchMedia('(display-mode: standalone)').matches) {
            // Show iOS prompt after a short delay
            const timer = setTimeout(() => setShowIOSPrompt(true), 1000);
            return () => clearTimeout(timer);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };

    if (isStandalone) return null;

    return (
        <>
            {/* Always visible Install Button (if not installed) */}
            {!isStandalone && (
                <button
                    onClick={() => isIOS ? setShowIOSPrompt(true) : handleInstallClick()}
                    className="fixed bottom-20 right-4 z-40 p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-all active:scale-95"
                    title="Install App"
                >
                    <Download className="h-5 w-5" />
                </button>
            )}

            {/* Android / Desktop Install Prompt (Bottom Sheet style) */}
            {deferredPrompt && (
                <div className="fixed bottom-4 left-4 right-4 z-50 flex justify-center animate-in slide-in-from-bottom-4 fade-in duration-500">
                    <button
                        onClick={handleInstallClick}
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-3 rounded-full shadow-lg font-semibold hover:bg-primary/90 transition-all active:scale-95"
                    >
                        <Download className="h-5 w-5" />
                        Install App
                    </button>
                </div>
            )}

            {/* iOS Instructions Banner */}
            {showIOSPrompt && (
                <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4 animate-in slide-in-from-bottom-full duration-500">
                    <div className="max-w-md mx-auto relative">
                        <button
                            onClick={() => setShowIOSPrompt(false)}
                            className="absolute -top-2 -right-2 p-1 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        <div className="flex items-start gap-4">
                            <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                                <Share className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-foreground mb-1">Install App</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Install this app on your iPhone: tap <span className="font-bold text-foreground">Share</span> and then <span className="font-bold text-foreground">Add to Home Screen</span>.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default InstallPrompt;
