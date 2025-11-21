import React from 'react';
import { X, MessageCircle, Twitter, Facebook, Mail, Link, Download } from 'lucide-react';

const ShareModal = ({ isOpen, onClose, product, score, scoreLabel, onDownload, onGenerateImage }) => {
    if (!isOpen) return null;

    const shareUrl = window.location.href;
    const shareText = `Check out ${product.product_name} on Nutrient Risk Profiler! Risk Score: ${score} (${scoreLabel}).`;

    const handleShare = async (platform) => {
        // Try Web Share API for mobile/supported browsers first
        if (navigator.share && onGenerateImage) {
            try {
                const blob = await onGenerateImage();
                if (blob) {
                    const file = new File([blob], 'analysis.png', { type: 'image/png' });
                    const shareData = {
                        title: `Nutrient Risk Profiler: ${product.product_name}`,
                        text: shareText,
                        url: shareUrl,
                        files: [file]
                    };

                    if (navigator.canShare && navigator.canShare(shareData)) {
                        await navigator.share(shareData);
                        return; // Success, exit
                    }
                }
            } catch (err) {
                console.warn('Web Share API failed, falling back to URL share:', err);
                // Fallback to URL sharing below
            }
        }

        // Fallback or specific platform URL sharing
        let url = '';
        switch (platform) {
            case 'whatsapp':
                url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
                break;
            case 'twitter':
                url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
                break;
            case 'facebook':
                url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
                break;
            case 'email':
                url = `mailto:?subject=${encodeURIComponent(`Nutrient Risk Profiler: ${product.product_name}`)}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`;
                break;
            default:
                break;
        }
        if (url) window.open(url, '_blank');
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-sm rounded-xl border shadow-lg overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Share Analysis</h3>
                    <button onClick={onClose} className="p-1 hover:bg-secondary rounded-full transition-colors">
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>

                <div className="p-4 grid grid-cols-4 gap-4">
                    <ShareButton icon={MessageCircle} label="WhatsApp" color="text-green-500 bg-green-500/10 hover:bg-green-500/20" onClick={() => handleShare('whatsapp')} />
                    <ShareButton icon={Twitter} label="X / Twitter" color="text-black dark:text-white bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20" onClick={() => handleShare('twitter')} />
                    <ShareButton icon={Facebook} label="Facebook" color="text-blue-600 bg-blue-600/10 hover:bg-blue-600/20" onClick={() => handleShare('facebook')} />
                    <ShareButton icon={Mail} label="Email" color="text-gray-500 bg-gray-500/10 hover:bg-gray-500/20" onClick={() => handleShare('email')} />
                </div>

                <div className="p-4 border-t bg-secondary/5 flex flex-col gap-3">
                    <button onClick={handleCopyLink} className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg border bg-background hover:bg-secondary/50 transition-colors text-sm font-medium">
                        <Link className="h-4 w-4" />
                        Copy Link
                    </button>
                    <button onClick={onDownload} className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg border bg-background hover:bg-secondary/50 transition-colors text-sm font-medium">
                        <Download className="h-4 w-4" />
                        Download Image
                    </button>
                </div>
            </div>
        </div>
    );
};

const ShareButton = ({ icon: Icon, label, color, onClick }) => (
    <button onClick={onClick} className="flex flex-col items-center gap-2 group">
        <div className={`p-3 rounded-full transition-colors ${color}`}>
            <Icon className="h-6 w-6" />
        </div>
        <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
    </button>
);

export default ShareModal;
