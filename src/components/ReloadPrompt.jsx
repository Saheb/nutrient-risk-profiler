import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

function ReloadPrompt() {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            // eslint-disable-next-line prefer-template
            console.log('SW Registered: ' + r);
        },
        onRegisterError(error) {
            console.log('SW registration error', error);
        },
    });

    const close = () => {
        setOfflineReady(false);
        setNeedRefresh(false);
    };

    if (!offlineReady && !needRefresh) {
        return null;
    }

    return (
        <div className="fixed top-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-top-2">
            <div className="bg-primary text-primary-foreground rounded-lg shadow-lg p-3 flex items-center justify-between gap-4 max-w-md mx-auto">
                <div className="flex-1 text-sm font-medium">
                    {offlineReady ? (
                        <span>App ready to work offline.</span>
                    ) : (
                        <span>New version available!</span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {needRefresh && (
                        <button
                            className="px-3 py-1.5 bg-background text-foreground text-xs font-semibold rounded-md hover:bg-secondary transition-colors flex items-center gap-1.5"
                            onClick={() => updateServiceWorker(true)}
                        >
                            <RefreshCw size={14} />
                            Reload
                        </button>
                    )}
                    <button
                        className="p-1.5 hover:bg-primary-foreground/20 rounded-md transition-colors"
                        onClick={close}
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ReloadPrompt;
