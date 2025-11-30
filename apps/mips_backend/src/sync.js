import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { PubSub } from '@google-cloud/pubsub'; // <--- NOVA IMPORTAÇÃO
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Configuração do Pub/Sub
// O nome da subscrição deve ser IGUAL ao que puseste no Terraform
const SUBSCRIPTION_NAME = 'product-page-sync-sub'; 
const pubSubClient = new PubSub({
  projectId: process.env.GOOGLE_CLOUD_PROJECT // Certifica-te que tens isto no .env
});

// Jumpseller API client
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

// Helper to strip HTML tags
const stripHtmlTags = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '');
};

// Fetch all products from Jumpseller
async function fetchAllProducts() {
  const allProducts = [];
  let page = 1;
  let hasMore = true;

  console.log('📦 Fetching products from Jumpseller...');

  while (hasMore) {
    try {
      const response = await jumpsellerClient.get('/products.json', {
        params: { page, limit: 50 },
      });

      const products = response.data;

      if (products && products.length > 0) {
        const unwrappedProducts = products.map((p) => p.product || p);
        allProducts.push(...unwrappedProducts);
        console.log(`   ✅ Fetched page ${page}: ${unwrappedProducts.length} products`);
        page++;
      } else {
        hasMore = false;
      }
    } catch (error) {
      console.error(`   ❌ Error fetching products page ${page}:`, error.response?.data || error.message);
      hasMore = false;
    }
  }

  console.log(`✅ Total products fetched: ${allProducts.length}\n`);
  return allProducts;
}

// Fetch reviews for a specific product
async function fetchProductReviews(productId) {
  try {
    const response = await jumpsellerClient.get(`/products/${productId}/reviews.json`);
    const reviewsData = response.data || [];
    
    // Unwrap the review from the nested structure and filter valid ratings
    const unwrappedReviews = reviewsData
      .map(item => item.review || item) // Unwrap nested review object
      .filter(review => {
        const rating = Number(review.rating);
        const isValid = !isNaN(rating) && rating >= 1 && rating <= 5;
        return isValid;
      });
    
    return unwrappedReviews;
    
  } catch (error) {
    if (error.response?.status === 404) {
      return [];
    }
    console.error(`   ⚠️ Error fetching reviews for product ${productId}:`, error.response?.data || error.message);
    return [];
  }
}

// Calculate average rating from reviews
function calculateAverageRating(reviews) {
  if (!reviews || reviews.length === 0) return 0;
  
  const validReviews = reviews.filter(review => {
    const rating = Number(review.rating);
    return !isNaN(rating) && rating >= 1 && rating <= 5;
  });
  
  if (validReviews.length === 0) return 0;
  
  const sum = validReviews.reduce((acc, review) => acc + Number(review.rating), 0);
  return Math.round((sum / validReviews.length) * 10) / 10; // Round to 1 decimal
}

// Sync products and reviews to database
async function syncToDatabase() {
  console.log('🔄 Starting Jumpseller → Database Sync (Triggered by Pub/Sub)\n');
  console.log('='.repeat(60));

  try {
    // 1. Ensure we have a default user for created_by_user_id
    let defaultUser = await prisma.user.findUnique({
      where: { email: 'jumpseller@system.com' },
    });

    if (!defaultUser) {
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

    // 2. Fetch all products from Jumpseller
    const jumpsellerProducts = await fetchAllProducts();

    if (jumpsellerProducts.length === 0) {
      console.log('⚠️ No products found in Jumpseller');
      return;
    }

    // 3. Process each product
    for (const jsProduct of jumpsellerProducts) {
      // Fetch reviews for this product
      const reviews = await fetchProductReviews(jsProduct.id);
      const avgScore = calculateAverageRating(reviews);

      // Convert custom fields to specifications
      const specifications = jsProduct.fields
        ? jsProduct.fields.map(field => ({
            title: field.label,
            description: stripHtmlTags(field.value),
          }))
        : [];

      // Parse price safely
      const price = parseFloat(jsProduct.price);
      
      // Check if product already exists
      const existingProduct = await prisma.product.findUnique({
        where: { jumpseller_id: jsProduct.id },
      });

      let product;
      const productData = {
        title: jsProduct.name || 'Untitled Product',
        description: stripHtmlTags(jsProduct.description || ''),
        storytelling: stripHtmlTags(jsProduct.description || ''),
        price: isNaN(price) ? 0 : price,
        sku: jsProduct.sku || `JS-${jsProduct.id}`,
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
      } else {
        product = await prisma.product.create({
          data: {
            jumpseller_id: jsProduct.id,
            ...productData,
            created_by: { connect: { id: defaultUser.id } }
          },
        });
      }

      // Sync photos (simplificado para poupar espaço no log)
      if (jsProduct.images && jsProduct.images.length > 0) {
        await prisma.productPhoto.deleteMany({ where: { product_id: product.id } });
        const photoData = jsProduct.images.map((img, index) => ({
          product_id: product.id,
          photo_url: img.url,
          alt_text: img.description || jsProduct.name,
          is_main: img.position === 1 || index === 0,
        }));
        await prisma.productPhoto.createMany({ data: photoData });
      }

      // Sync reviews (simplificado)
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
                    },
                });
            } catch (e) {
                console.error(`Error syncing review ${jsReview.id}`);
            }
        }
      }
    }

    console.log('✅ Sync Cycle Complete!');

  } catch (error) {
    console.error('\n❌ Sync failed:', error.message);
    throw error; // Lança erro para o catch do PubSub apanhar
  }
}


// ========================================================
// PUB/SUB LISTENER (O Código Novo)
// ========================================================

function listenForMessages() {
  console.log(`🎧 Listening for messages on ${SUBSCRIPTION_NAME}...`);
  
  const subscription = pubSubClient.subscription(SUBSCRIPTION_NAME);

  // Evento: Recebeu mensagem
  subscription.on('message', async (message) => {
    console.log(`\n🔔 Received message ID: ${message.id}`);
    console.log(`Data: ${message.data.toString()}`);

    try {
      // Executa a lógica de sincronização
      await syncToDatabase();
      
      // CRÍTICO: Avisar o Pub/Sub que o trabalho foi feito com sucesso
      message.ack(); 
      console.log('👍 Message acknowledged.');
    } catch (error) {
      console.error('👎 Failed to process message:', error);
      // Opcional: message.nack() se quiseres que ele tente de novo imediatamente
      // Se não fizeres nada, ele tenta de novo passado um tempo (ack deadline)
      message.nack();
    }
  });

  // Evento: Erro na conexão
  subscription.on('error', (error) => {
    console.error('❌ Received error:', error);
    process.exit(1);
  });
}

// Inicia o Listener
listenForMessages();

// Mantém o script a correr e fecha a conexão com o Prisma se o processo morrer
process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
});