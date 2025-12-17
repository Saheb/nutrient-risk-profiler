import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing product feedback (upvotes/downvotes).
 * Handles loading, submitting, and persisting vote state.
 * 
 * @param {string} productCode - The product barcode/code
 * @returns {Object} Feedback state and handlers
 */
export const useFeedback = (productCode) => {
    const [feedback, setFeedback] = useState({ up: 0, down: 0 });
    const [userVote, setUserVote] = useState(null); // 'up', 'down', or null
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Load feedback on mount
    useEffect(() => {
        if (!productCode) return;

        const loadFeedback = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/feedback?id=${productCode}`);
                if (res.ok) {
                    const data = await res.json();
                    setFeedback(data);
                }
            } catch (e) {
                console.error("Failed to load feedback", e);
                setError('Failed to load feedback');
            } finally {
                setIsLoading(false);
            }
        };

        loadFeedback();

        // Check local storage for previous vote
        const storedVote = localStorage.getItem(`vote_${productCode}`);
        if (storedVote) {
            setUserVote(storedVote);
        }
    }, [productCode]);

    const handleVote = useCallback(async (type) => {
        if (userVote || !productCode) return; // Already voted or no product

        // Optimistic update
        setFeedback(prev => ({ ...prev, [type]: prev[type] + 1 }));
        setUserVote(type);
        localStorage.setItem(`vote_${productCode}`, type);

        try {
            await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: productCode, type })
            });
        } catch (e) {
            console.error("Failed to submit vote", e);
            // Revert on error
            setFeedback(prev => ({ ...prev, [type]: prev[type] - 1 }));
            setUserVote(null);
            localStorage.removeItem(`vote_${productCode}`);
            setError('Failed to submit vote');
        }
    }, [productCode, userVote]);

    const voteUp = useCallback(() => handleVote('up'), [handleVote]);
    const voteDown = useCallback(() => handleVote('down'), [handleVote]);

    return {
        feedback,
        userVote,
        isLoading,
        error,
        voteUp,
        voteDown,
        hasVoted: !!userVote
    };
};

export default useFeedback;
