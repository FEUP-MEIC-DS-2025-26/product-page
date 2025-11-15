import axios, { AxiosInstance } from 'axios';

interface JumpsellerConfig {
  apiUrl: string; // Changed to use backend URL
}

interface JumpsellerImage {
  id: number;
  url: string;
  position: number;
  description?: string;
}

interface JumpsellerProduct {
  id: number;
  name: string;
  price: string;
  description: string;
  permalink: string;
  images: JumpsellerImage[];
  stock: number;
  sku: string;
  status: string;
  brand?: string;
  categories?: Array<{
    id: number;
    name: string;
  }>;
}

interface JumpsellerOrder {
  id: number;
  status: string;
  total: string;
  customer: {
    name: string;
    email: string;
  };
  created_at: string;
}

class JumpsellerApiClient {
  private client: AxiosInstance;

  constructor(config: JumpsellerConfig) {
    this.client = axios.create({
      baseURL: config.apiUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async getProducts(page = 1, limit = 50): Promise<JumpsellerProduct[]> {
    try {
      const response = await this.client.get('/products', {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching products from backend:', error);
      throw error;
    }
  }

  async getProduct(productId: number): Promise<JumpsellerProduct> {
    try {
      const response = await this.client.get(`/products/${productId}`);
      return response.data.product;
    } catch (error) {
      console.error(`Error fetching product ${productId}:`, error);
      throw error;
    }
  }

  async getOrders(page = 1, limit = 50): Promise<JumpsellerOrder[]> {
    try {
      const response = await this.client.get('/orders', {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  async getCategories() {
    try {
      const response = await this.client.get('/categories');
      return response.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }
}

// Singleton instance
let apiClient: JumpsellerApiClient | null = null;

export const initJumpsellerApi = (config: JumpsellerConfig): JumpsellerApiClient => {
  apiClient = new JumpsellerApiClient(config);
  return apiClient;
};

export const getJumpsellerApi = (): JumpsellerApiClient => {
  if (!apiClient) {
    throw new Error('Jumpseller API not initialized. Call initJumpsellerApi first.');
  }
  return apiClient;
};

export type { JumpsellerProduct, JumpsellerConfig, JumpsellerImage, JumpsellerOrder };