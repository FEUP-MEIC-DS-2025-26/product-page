import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;
const prisma = new PrismaClient();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', "X-Requested-With"]
}));

app.use(express.json());

const jumpsellerClient = axios.create({
  baseURL: 'https://api.jumpseller.com/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  auth: {
    username: process.env.JUMPSELLER_LOGIN || '',
    password: process.env.JUMPSELLER_TOKEN || '',
  },
});

const stripHtmlTags = (html) => {
  if (!html) return '';
  return String(html).replace(/<[^>]*>/g, '');
};

async function fetchAllProducts() {
  const allProducts = [];
  let page = 1;
  let hasMore = true;

  console.log('Fetching products from Jumpseller...');

  while (hasMore) {
    try {
      const response = await jumpsellerClient.get('/products.json', {
        params: { page, limit: 50 },
      });

      const products = response.data;

      if (products && products.length > 0) {
        const unwrappedProducts = products.map((p) => p.product || p);
        allProducts.push(...unwrappedProducts);
        console.log(`Fetched page ${page}: ${unwrappedProducts.length} products`);
        page++;
      } else {
        hasMore = false;
      }
    } catch (error) {
      console.error(`Error fetching products page ${page}:`, error.message);
      hasMore = false;
    }
  }

  console.log(`Total products fetched: ${allProducts.length}\n`);
  return allProducts;
}

async function fetchProductReviews(productId) {
  try {
    const response = await jumpsellerClient.get(`/products/${productId}/reviews.json`);
    const reviewsData = response.data || [];
    
    const unwrappedReviews = reviewsData
      .map((item) => item.review || item)
      .filter((review) => {
        const rating = Number(review.rating);
        return !isNaN(rating) && rating >= 1 && rating <= 5;
      });
    
    return unwrappedReviews;
  } catch (error) {
    if (error.response?.status === 404) {
      return [];
    }
    console.error(`Error fetching reviews for product ${productId}:`, error.message);
    return [];
  }
}

function calculateAverageRating(reviews) {
  if (!reviews || reviews.length === 0) return 0;
  
  const validReviews = reviews.filter(review => {
    const rating = Number(review.rating);
    return !isNaN(rating) && rating >= 1 && rating <= 5;
  });
  
  if (validReviews.length === 0) return 0;
  
  const sum = validReviews.reduce((acc, review) => acc + Number(review.rating), 0);
  return Math.round((sum / validReviews.length) * 10) / 10;
}

async function syncToDatabase() {
  console.log('\nStarting Jumpseller → Database Sync\n');
  
  try {
    let defaultUser = await prisma.user.findUnique({
      where: { email: 'jumpseller@system.com' },
    });

    if (!defaultUser) {
      console.log('Creating default system user...');
      defaultUser = await prisma.user.create({
        data: {
          username: 'jumpseller_system',
          first_name: 'Jumpseller',
          last_name: 'System',
          email: 'jumpseller@system.com',
          password_hash: 'SYSTEM_ACCOUNT_NO_LOGIN',
        },
      });
    }

    const jumpsellerProducts = await fetchAllProducts();

    if (jumpsellerProducts.length === 0) {
      console.log('No products found in Jumpseller\n');
      return { success: true, message: "No products found" };
    }

    let productsCreated = 0;
    let productsUpdated = 0;
    let reviewsCreated = 0;

    for (const jsProduct of jumpsellerProducts) {
      console.log(`\nProcessing: ${jsProduct.name}`);

      const reviews = await fetchProductReviews(jsProduct.id);
      const avgScore = calculateAverageRating(reviews);

      const specifications = jsProduct.fields
        ? jsProduct.fields.map((field) => ({
            title: field.label,
            description: stripHtmlTags(field.value),
          }))
        : [];

      let price = parseFloat(jsProduct.price);
      if (isNaN(price)) price = 0;
      
      const MAX_DB_PRICE = 99999999.99;
      if (price > MAX_DB_PRICE) {
        console.warn(`ALERTA: Preço excessivo detectado no ID ${jsProduct.id}. Corrigido para ${MAX_DB_PRICE}.`);
        price = MAX_DB_PRICE;
      }

      let finalSku = jsProduct.sku || `JS-${jsProduct.id}`;
      
      const conflictingProduct = await prisma.product.findUnique({
        where: { sku: finalSku }
      });

      if (conflictingProduct && conflictingProduct.jumpseller_id !== jsProduct.id) {
        console.warn(`SKU Duplicado: "${finalSku}" já pertence ao produto ${conflictingProduct.jumpseller_id}.`);
        finalSku = `${finalSku}-DUP-${jsProduct.id}`;
        console.warn(`SKU renomeado para: "${finalSku}" para permitir sync.`);
      }
      // ------------------------------------------------

      const existingProduct = await prisma.product.findUnique({
        where: { jumpseller_id: jsProduct.id },
      });

      let product;

      const productData = {
        title: jsProduct.name || 'Untitled Product',
        description: stripHtmlTags(jsProduct.description || ''),
        storytelling: stripHtmlTags(jsProduct.description || ''),
        price: price,
        sku: finalSku, 
        stock: jsProduct.stock || 0,
        permalink: jsProduct.permalink || '',
        avg_score: avgScore,
        specifications: specifications,
      };

      if (existingProduct) {
        product = await prisma.product.update({
          where: { jumpseller_id: jsProduct.id },
          data: { ...productData, updated_at: new Date() },
        });
        productsUpdated++;
      } else {
        product = await prisma.product.create({
          data: {
            jumpseller_id: jsProduct.id,
            ...productData,
            created_by: { connect: { id: defaultUser.id } }
          },
        });
        productsCreated++;
      }

      if (jsProduct.images && jsProduct.images.length > 0) {
        await prisma.productPhoto.deleteMany({
          where: { product_id: product.id },
        });

        const photoData = jsProduct.images.map((img, index) => ({
          product_id: product.id,
          photo_url: img.url,
          alt_text: img.description || jsProduct.name,
          is_main: img.position === 1 || index === 0,
        }));

        await prisma.productPhoto.createMany({ data: photoData });
      }

      for (const jsReview of reviews) {
        const rating = Number(jsReview.rating);
        if (isNaN(rating) || rating < 1 || rating > 5) continue;

        const existingReview = await prisma.review.findUnique({
          where: { jumpseller_id: jsReview.id },
        });

        if (!existingReview) {
          try {
            const reviewerEmail = jsReview.customer_email || '';
            const reviewerName = reviewerEmail.split('@')[0] || 'Anonymous';
            
            await prisma.review.create({
              data: {
                jumpseller_id: jsReview.id,
                score: rating,
                comment: jsReview.review || '',
                reviewer_name: reviewerName,
                reviewer_email: reviewerEmail,
                product: { connect: { id: product.id } },
                user: { connect: { id: defaultUser.id } },
                created_at: jsReview.date ? new Date(jsReview.date) : new Date(),
                updated_at: new Date(),
              },
            });
            reviewsCreated++;
          } catch (reviewError) {
            console.error(`Failed to create review:`, reviewError.message);
          }
        }
      }
    }

    console.log(`Sync Complete! Created: ${productsCreated}, Updated: ${productsUpdated}`);
    return { success: true, productsCreated, productsUpdated };

  } catch (error) {
    console.error('\nSync failed:', error.message);
    return { success: false, error: error.message };
  }
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

app.post('/api/sync', async (req, res) => {
  console.log('\nManual sync requested via API endpoint');
  const result = await syncToDatabase();
  res.json(result);
});

app.put('/api/products/:jumpsellerId/rating', async (req, res) => {
  try {
    const jumpsellerId = parseInt(req.params.jumpsellerId);
    const { avg_score, review_count } = req.body;

    console.log(`Updating rating for product ${jumpsellerId}: ${avg_score} stars (${review_count} reviews)`);

    const updated = await prisma.product.update({
      where: { jumpseller_id: jumpsellerId },
      data: {
        avg_score: avg_score,
      },
    });

    res.json({ success: true, product: updated });
  } catch (error) {
    console.error('Failed to update rating:', error.message);
    res.status(500).json({ error: 'Failed to update rating' });
  }
});

app.get('/api/products/sku/:sku', async (req, res) => {
  try {
    const { sku } = req.params;
    const response = await jumpsellerClient.get('/products.json', { params: { sku } });
    
    if (response.data && response.data.length > 0) {
      res.json(response.data[0]);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

app.get('/api/products/jumpseller/:jumpsellerProductId', async (req, res) => {
  try {
    const jumpsellerProductId = parseInt(req.params.jumpsellerProductId);
    
    const product = await prisma.product.findUnique({
      where: { jumpseller_id: jumpsellerProductId },
      include: {
        photos: true,
        reviews: {
          include: { user: { select: { username: true, first_name: true, last_name: true, photo_url: true } } },
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found in database' });
    }

    const reviewCount = product.reviews.length;
    const avgScore = reviewCount > 0
      ? Math.round((product.reviews.reduce((sum, review) => sum + review.score, 0) / reviewCount) * 10) / 10
      : 0;

    const response = {
      id: product.jumpseller_id,
      title: product.title,
      storytelling: product.storytelling,
      description: product.description,
      price: product.price,
      avg_score: avgScore,
      reviewCount: reviewCount,
      mainPhoto: product.photos.find(p => p.is_main) || product.photos[0] || null,
      photos: product.photos.map(photo => ({
        photo_url: photo.photo_url,
        alt_text: photo.alt_text,
        is_main: photo.is_main,
      })),
      specifications: product.specifications,
      reviews: product.reviews.map(review => ({
        id: review.id,
        score: review.score,
        comment: review.comment,
        reviewer_name: review.reviewer_name,
        created_at: review.created_at,
      })),
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching from DB:', error.message);
    res.status(500).json({ error: 'Failed to fetch product from DB' });
  }
});

app.get('/api/products/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await jumpsellerClient.get(`/products/${id}/reviews.json`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const response = await jumpsellerClient.get('/products.json', { params: { page, limit } });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await jumpsellerClient.get(`/products/${id}.json`);
    res.json(response.data);
  } catch (error) {
    res.status(404).json({ error: 'Product not found' });
  }
});

app.listen(PORT, async () => {
  console.log(`🚀 Backend running on port ${PORT}`);
  await syncToDatabase();
});