import { useState, useEffect } from 'react';
import { getJumpsellerApi, JumpsellerProduct } from '../services/jumpsellerApi';

interface UseJumpsellerProductsResult {
  products: JumpsellerProduct[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useJumpsellerProducts = (): UseJumpsellerProductsResult => {
  const [products, setProducts] = useState<JumpsellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const api = getJumpsellerApi();
      const data = await api.getProducts();
      setProducts(data);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to fetch Jumpseller products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
  };
};

interface UseJumpsellerProductResult {
  product: JumpsellerProduct | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useJumpsellerProduct = (productId: number): UseJumpsellerProductResult => {
  const [product, setProduct] = useState<JumpsellerProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const api = getJumpsellerApi();
      const data = await api.getProduct(productId);
      setProduct(data);
    } catch (err) {
      setError(err as Error);
      console.error(`Failed to fetch product ${productId}:`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  return {
    product,
    loading,
    error,
    refetch: fetchProduct,
  };
};