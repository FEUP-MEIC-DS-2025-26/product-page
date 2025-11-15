import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import { useState, useEffect } from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { getJumpsellerApi } from '../services/jumpsellerApi';

// Helper function to strip HTML tags
const stripHtmlTags = (html: string): string => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
};

// Map Jumpseller product to your format
const mapJumpsellerProduct = (jumpsellerProduct: any) => {
  console.log('Mapping Jumpseller product:', jumpsellerProduct);
  
  const product = jumpsellerProduct.product || jumpsellerProduct;
  
  // Find "Historia" field for storytelling (using label instead of name)
  const historiaField = product.fields?.find((f: any) => f.label === 'Historia');
  const storytelling = historiaField?.value 
    ? stripHtmlTags(historiaField.value) 
    : 'História do produto não disponível.';
  
  // Convert custom fields to specifications, excluding "Historia"
  const customFieldsSpecs = product.fields
    ? product.fields
        .filter((field: any) => field.label !== 'Historia')
        .map((field: any) => ({
          title: field.label,  // This uses the label (e.g., "Certificação")
          description: stripHtmlTags(field.value),  // This uses the value (e.g., "Produto artesanal...")
        }))
    : [];
  
  return {
    id: product.id,
    title: product.name || 'Produto sem nome',
    storytelling: storytelling,
    description: stripHtmlTags(product.description || 'Descrição não disponível.'),
    price: typeof product.price === 'number' ? product.price : parseFloat(product.price || '0'),
    avg_score: 4.5,
    reviewCount: 0,
    photos: product.images && product.images.length > 0 
      ? product.images.map((img: any) => ({
          photo_url: img.url,
          alt_text: img.description || product.name,
        }))
      : [{ photo_url: '/galo.png', alt_text: product.name }],
    mainPhoto: {
      photo_url: product.images?.[0]?.url || '/galo.png',
      alt_text: product.name,
    },
    specifications: customFieldsSpecs,
  };
};

interface ProductDetailProps {
  productId?: number;
  sku?: string;
}

export default function ProductDetail({ productId, sku }: ProductDetailProps) {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching product...');
        const api = getJumpsellerApi();
        
        if (sku) {
          // Fetch by SKU
          console.log(`Fetching product with SKU: ${sku}`);
          const jumpsellerProduct = await api.getProductBySKU(sku);
          const mappedProduct = mapJumpsellerProduct({ product: jumpsellerProduct });
          setProduct(mappedProduct);
          console.log('Product loaded successfully by SKU:', mappedProduct.title);
        } else if (productId) {
          // Fetch by ID
          console.log(`Fetching product with ID: ${productId}`);
          const jumpsellerProduct = await api.getProduct(productId);
          const mappedProduct = mapJumpsellerProduct({ product: jumpsellerProduct });
          setProduct(mappedProduct);
          console.log('Product loaded successfully by ID:', mappedProduct.title);
        } else {
          // Fetch first product
          console.log('Fetching first product from list...');
          const products = await api.getProducts(1, 1);
          console.log('Products received:', products);
          
          if (products && products.length > 0) {
            const mappedProduct = mapJumpsellerProduct(products[0]);
            setProduct(mappedProduct);
            console.log('First product loaded successfully:', mappedProduct.title);
          } else {
            throw new Error('Nenhum produto encontrado');
          }
        }
      } catch (err) {
        console.error('Error in fetchProduct:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, sku]);

  const renderStars = (score: number) => {
    return Array.from({ length: 5 }, (_, i) => {
      const starNumber = i + 1;
      const isFilled = score >= starNumber;
      return (
        <svg
          key={i}
          className={`w-9 h-9 sm:w-10 sm:h-10 ${
            isFilled ? 'fill-[#3A5A40]' : 'fill-none'
          } stroke-[#3A5A40] stroke-2`}
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: 40, height: 40 }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      );
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', flexDirection: 'column', gap: 2 }}>
        <CircularProgress sx={{ color: '#344E41' }} />
        <Typography sx={{ color: '#344E41' }}>A carregar produto...</Typography>
      </Box>
    );
  }

  if (error || !product) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', flexDirection: 'column', gap: 2 }}>
        <Typography color="error" sx={{ fontWeight: 'bold' }}>
          Erro ao carregar o produto
        </Typography>
        <Typography variant="body2" color="error">
          {error?.message || 'Produto não encontrado'}
        </Typography>
      </Box>
    );
  }

  const photos = product.photos || [];

  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      <Box
        sx={{
          bgcolor: '#DAD7CD',
          borderRadius: '24px',
          p: { xs: 2, sm: 4 },
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
        }}
      >
        <Grid
          container
          spacing={{ xs: 3, lg: 4 }}
          direction={isSmallScreen ? 'column' : 'row'}
          sx={{
            flexWrap: isSmallScreen ? 'wrap' : 'nowrap',
            alignItems: 'stretch',
          }}
        >
          <Grid
            item
            xs={12}
            md={4}
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minWidth: 0,
              flexBasis: { md: '33.3333%' },
              maxWidth: { md: '33.3333%' },
              height: '100%',
            }}
          >
            <Box
              sx={{
                bgcolor: '#274836',
                borderRadius: '16px',
                p: 2,
                width: { xs: 340, sm: 400, lg: 480 },
                height: { xs: 420, sm: 480, lg: 580 },
                minHeight: { xs: 420, sm: 480, lg: 580 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 1,
              }}
            >
              <Box
                sx={{
                  bgcolor: 'white',
                  borderRadius: '8px',
                  width: '100%',
                  flex: 1,
                  minHeight: 0,
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Box
                  component="img"
                  src={photos[selectedPhotoIndex]?.photo_url || product.mainPhoto.photo_url}
                  alt={photos[selectedPhotoIndex]?.alt_text || product.title}
                  sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  onError={(e) => {
                    console.error('Image failed to load:', e.currentTarget.src);
                    e.currentTarget.src = '/galo.png';
                  }}
                />
              </Box>

              {photos.length > 1 && (
                <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
                  {photos.map((p, i) => (
                    <Box
                      key={i}
                      onClick={() => setSelectedPhotoIndex(i)}
                      sx={{
                        width: { xs: 56, sm: 72 },
                        height: { xs: 56, sm: 72 },
                        borderRadius: 1,
                        overflow: 'hidden',
                        border: i === selectedPhotoIndex ? '2px solid #344E41' : '2px solid transparent',
                        cursor: 'pointer',
                        bgcolor: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: i === selectedPhotoIndex
                          ? '0 0 0 4px white, 0 0 12px 2px rgba(255,255,255,0.7)'
                          : 'none',
                      }}
                    >
                      <Box 
                        component="img" 
                        src={p.photo_url} 
                        alt={p.alt_text} 
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        onError={(e) => {
                          e.currentTarget.src = '/galo.png';
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Grid>

          <Grid
            item
            xs={12}
            md={8}
            sx={{
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              flexBasis: { md: '66.6667%' },
              maxWidth: { md: '66.6667%' },
              height: '100%',
            }}
          >
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              justifyContent: 'flex-end',
              gap: 3,
              flex: 1,
            }}>
              <Box sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                  <Typography
                    variant="h3"
                    component="h1"
                    sx={{
                      fontSize: { xs: '2rem', sm: '2.25rem', lg: '2.75rem' },
                      fontWeight: 'bold',
                      color: '#344E41',
                      lineHeight: 1.1,
                    }}
                  >
                    {product.title}
                  </Typography>
                  <IconButton
                    aria-label="Add to wishlist"
                    sx={{
                      p: 1,
                      '&:hover': {
                        transform: 'scale(1.1)',
                        '& svg': { fill: '#344E41' },
                      },
                    }}
                  >
                    <svg width="32" height="32" fill="none" stroke="#344E41" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </IconButton>
                </Box>
                <Box
                  sx={{
                    height: 360,
                    overflowY: 'auto',
                    mb: 1.5,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: { xs: '1.1rem', sm: '1.18rem' },
                      color: 'black',
                      lineHeight: 1.65,
                      pr: 1,
                    }}
                  >
                    {product.description}
                  </Typography>
                </Box>
              </Box>

              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0 }}>
                  <Typography
                    variant="h3"
                    sx={{
                      fontSize: { xs: '2rem', sm: '2.25rem', lg: '2.75rem' },
                      fontWeight: 'bold',
                      color: 'black',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {product.price.toFixed(2)} €
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {renderStars(product.avg_score)}
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      ({product.reviewCount})
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', gap: 2 }}>
                <Button
                  variant="contained"
                  sx={{
                    flex: 1,
                    bgcolor: '#344E41',
                    color: 'white',
                    p: { xs: '12px 24px', sm: '16px 32px' },
                    borderRadius: '12px',
                    fontWeight: 'bold',
                    fontSize: { xs: '1rem', sm: '1.125rem' },
                    '&:hover': {
                      bgcolor: '#A3B18A',
                      color: 'black',
                    },
                    gap: 1.5,
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
                  }}
                >
                  <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Comprar
                </Button>
                <Button
                  variant="contained"
                  sx={{
                    flex: 1,
                    bgcolor: '#588157',
                    color: 'white',
                    p: { xs: '12px 24px', sm: '16px 32px' },
                    borderRadius: '12px',
                    fontWeight: 'bold',
                    fontSize: { xs: '1rem', sm: '1.125rem' },
                    '&:hover': {
                      bgcolor: '#A3B18A',
                      color: 'black',
                    },
                    gap: 1.5,
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
                  }}
                >
                  <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Falar com o Vendedor
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Box
          sx={{
            bgcolor: '#F5F5F5',
            borderRadius: '16px',
            mt: 4,
            p: { xs: 2, sm: 3 },
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 'bold',
              color: '#344E41',
              mb: 1,
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
            }}
          >
            História do Produto
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontSize: { xs: '1.1rem', sm: '1.18rem' },
              fontWeight: '600',
              color: 'black',
              whiteSpace: 'pre-line',
            }}
          >
            {product.storytelling}
          </Typography>
        </Box>
      </Box>
      
      <Box sx={{ height: '1px', bgcolor: 'rgba(52, 78, 65, 0.3)', my: 3 }} />
    </Box>
  );
}

export function ProductSpecifications({ specifications }: { specifications?: Array<{ title: string; description: string }> }) {
  if (!specifications || specifications.length === 0) {
    return null;
  }

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, px: { xs: 2, sm: 3 }, mx: { xs: 1, sm: 2 } }}>
        {specifications.map((spec, index) => (
          <Box key={index} sx={{ bgcolor: '#DAD7CD', borderRadius: '16px', p: { xs: 3, sm: 4 } }}>
            <Typography 
              variant="h4" 
              sx={{ 
                fontSize: { xs: '1.5rem', sm: '2rem' }, 
                fontWeight: 'bold', 
                color: 'black', 
                mb: 1.5
              }}
            >
              {spec.title}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'black',
                fontSize: { xs: '1.18rem', sm: '1.25rem' },
                lineHeight: 1.6,
                whiteSpace: 'pre-line',
                pl: 2,
              }}
            >
              {spec.description}
            </Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ height: '1px', bgcolor: 'rgba(52, 78, 65, 0.3)', my: 3 }} />
    </>
  );
}