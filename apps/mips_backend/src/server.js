import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Jumpseller API client with correct authentication
const jumpsellerClient = axios.create({
  baseURL: 'https://api.jumpseller.com/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  auth: {
    username: process.env.JUMPSELLER_LOGIN,
    password: process.env.JUMPSELLER_TOKEN,
  },
});

// Add request interceptor for debugging
jumpsellerClient.interceptors.request.use(
  (config) => {
    console.log('Making request to:', config.url);
    console.log('Auth:', config.auth);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
jumpsellerClient.interceptors.response.use(
  (response) => {
    console.log('Response received:', response.status);
    return response;
  },
  (error) => {
    console.error('Response error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Routes
app.get('/api/products', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    console.log(`Fetching products: page=${page}, limit=${limit}`);
    
    const response = await jumpsellerClient.get('/products.json', {
      params: { page, limit },
    });
    
    console.log('Products fetched successfully');
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching products:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch products',
      details: error.response?.data || error.message,
    });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Fetching product: ${id}`);
    
    const response = await jumpsellerClient.get(`/products/${id}.json`);
    
    console.log('Product fetched successfully');
    res.json(response.data);
  } catch (error) {
    console.error(`Error fetching product ${req.params.id}:`, error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch product',
      details: error.response?.data || error.message,
    });
  }
});

app.get('/api/products/sku/:sku', async (req, res) => {
  try {
    const { sku } = req.params;
    console.log(`Fetching product by SKU: ${sku}`);
    
    // Get all products and filter by SKU
    const response = await jumpsellerClient.get('/products.json', {
      params: { limit: 100 }
    });
    
    const product = response.data.find((p) => p.product.sku === sku);
    
    if (product) {
      console.log('Product found:', product.product.name);
      res.json(product);
    } else {
      res.status(404).json({
        error: 'Product not found',
        details: `No product found with SKU: ${sku}`,
      });
    }
  } catch (error) {
    console.error(`Error fetching product by SKU ${req.params.sku}:`, error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch product',
      details: error.response?.data || error.message,
    });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    console.log(`Fetching orders: page=${page}, limit=${limit}`);
    
    const response = await jumpsellerClient.get('/orders.json', {
      params: { page, limit },
    });
    
    console.log('Orders fetched successfully');
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching orders:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch orders',
      details: error.response?.data || error.message,
    });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    console.log('Fetching categories');
    
    const response = await jumpsellerClient.get('/categories.json');
    
    console.log('Categories fetched successfully');
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching categories:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch categories',
      details: error.response?.data || error.message,
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Backend is running',
    jumpseller: {
      login: process.env.JUMPSELLER_LOGIN ? 'configured' : 'missing',
      token: process.env.JUMPSELLER_TOKEN ? 'configured' : 'missing',
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`✅ Jumpseller Login: ${process.env.JUMPSELLER_LOGIN ? 'Configured' : 'NOT CONFIGURED'}`);
  console.log(`✅ Jumpseller Token: ${process.env.JUMPSELLER_TOKEN ? 'Configured' : 'NOT CONFIGURED'}`);
});