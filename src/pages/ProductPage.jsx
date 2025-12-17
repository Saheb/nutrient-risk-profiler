import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProductDetails from '../components/ProductDetails';
import { getProductByBarcode } from '../services/api';
import { saveRecentProduct } from '../utils/storage';

const ProductPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProduct = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const result = await getProductByBarcode(id);
                if (result.success && result.data) {
                    setProduct(result.data);
                    saveRecentProduct(result.data);
                } else {
                    setError(result.error || 'Product not found');
                }
            } catch (err) {
                setError('Failed to load product');
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id]);

    const handleBack = () => {
        navigate('/');
    };

    if (loading) {
        return <div className="text-center py-12 text-muted-foreground">Loading product details...</div>;
    }

    if (error || !product) {
        return (
            <div className="text-center py-12 flex flex-col gap-4">
                <p className="text-red-500">{error || 'Product not found'}</p>
                <button onClick={handleBack} className="text-primary hover:underline">
                    Go back home
                </button>
            </div>
        );
    }

    return <ProductDetails product={product} onBack={handleBack} />;
};

export default ProductPage;
