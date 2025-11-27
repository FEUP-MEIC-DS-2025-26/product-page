import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { JumpsellerReview } from '../services/jumpsellerApi';

// Define a URL base dependendo do ambiente
const API_BASE_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:3103/api' 
  : 'https://api.madeinportugal.store/api/';

// --- TYPES ---
type ProductSpecification = {
  title: string;
  description: string;
};

type ProductPhoto = {
  photo_url: string;
  alt_text: string | null;
};

type ProductFromApi = {
  id: number;
  title: string;
  storytelling: string | null;
  description: string | null;
  price: number;
  avg_score: number;
  reviewCount: number;
  mainPhoto: ProductPhoto | null;
  photos: ProductPhoto[];
  specifications: ProductSpecification[] | null;
  brand?: string | null;
};

// --- HELPERS ---
const stripHtmlTags = (html: string): string => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
};

const calculateAverageRating = (reviews: JumpsellerReview[]): number => {
  if (reviews.length === 0) return 0;
  const validReviews = reviews.filter(review => {
    const rating = Number(review.rating);
    return !isNaN(rating) && rating >= 1 && rating <= 5;
  });
  if (validReviews.length === 0) return 0;
  const sum = validReviews.reduce((acc, review) => acc + Number(review.rating), 0);
  return Math.round((sum / validReviews.length) * 10) / 10;
};

const mapJumpsellerToProduct = (jumpsellerProduct: any, reviews: JumpsellerReview[]): ProductFromApi => {
  const product = jumpsellerProduct.product || jumpsellerProduct;
  const customFieldsSpecs = product.fields
    ? product.fields.map((field: any) => ({
        title: field.label,
        description: stripHtmlTags(field.value),
      }))
    : [];
  
  const avgRating = calculateAverageRating(reviews);
  
  return {
    id: product.id,
    title: product.name || 'Produto sem nome',
    storytelling: stripHtmlTags(product.description || 'Descrição não disponível.'),
    description: stripHtmlTags(product.description || 'Descrição não disponível.'),
    price: typeof product.price === 'number' ? product.price : parseFloat(product.price || '0'),
    avg_score: avgRating,
    reviewCount: reviews.length,
    photos: product.images && product.images.length > 0 
      ? product.images.map((img: any) => ({
          photo_url: img.url,
          alt_text: img.description || product.name,
        }))
      : [],
    mainPhoto: product.images?.[0]
      ? {
          photo_url: product.images[0].url,
          alt_text: product.images[0].description || product.name,
        }
      : null,
    specifications: customFieldsSpecs,
    brand: product.brand || null,
  };
};

const renderStars = (score: number) =>
  Array.from({ length: 5 }, (_, i) => {
    const id = `star-half-clip-${i}`;
    const full = i < Math.floor(score);
    const half = !full && score > i && score < i + 1;
    return (
      <svg key={i} viewBox="0 0 24 24" style={{ width: 32, height: 32, marginRight: 2, display: 'block' }}>
        {half && (
          <>
            <defs><clipPath id={id}><rect x="0" y="0" width="12" height="24" /></clipPath></defs>
            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" fill="#181818" stroke="none" style={{ clipPath: `url(#${id})` }} />
          </>
        )}
        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" fill={full ? '#181818' : 'none'} stroke="#181818" strokeWidth={2} />
      </svg>
    );
  });

// --- COMPONENT PRINCIPAL ---
// Alteração Importante: Aceita productId como prop!
interface ProductDetailProps {
  productId?: string | number;
}

export default function ProductDetail({ productId }: ProductDetailProps) {
  const [product, setProduct] = useState<ProductFromApi | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [source, setSource] = useState<'jumpseller' | 'database'>('jumpseller');

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

  // ID de fallback (Galo) se nada for passado
  const targetId = productId || 32614736;

  const toggleSource = () => {
    setSource(prev => prev === 'jumpseller' ? 'database' : 'jumpseller');
  };

  useEffect(() => {
    let isMounted = true;

    const fetchProduct = async () => {
      if (!isMounted) return;
      setLoading(true);
      setError(null);
      
      console.log(`🔄 Fetching product ${targetId} using source: ${source.toUpperCase()}`);

      try {
        if (source === 'jumpseller') {
          const res = await fetch(`${API_BASE_URL}/products/${targetId}`);
          
          if (!res.ok) throw new Error('Erro ao carregar do Jumpseller Proxy');
          const rawData = await res.json();

          let reviews: JumpsellerReview[] = [];
          try {
             const revRes = await fetch(`${API_BASE_URL}/products/${targetId}/reviews`);
             if (revRes.ok) reviews = await revRes.json();
          } catch (e) { console.warn('Reviews error', e); }

          if (isMounted) {
            const mapped = mapJumpsellerToProduct(rawData, reviews);
            setProduct(mapped);
          }

        } else {
          const res = await fetch(`${API_BASE_URL}/products/jumpseller/${targetId}`);
          
          if (!res.ok) throw new Error('Produto não encontrado na Base de Dados');
          const dbData = await res.json();

          if (isMounted) {
            setProduct(dbData as ProductFromApi); 
          }
        }

      } catch (err: any) {
        console.error('❌ Fetch failed:', err);
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProduct();

    return () => { isMounted = false; };
  }, [source, targetId]); // Recarrega se a Source OU o ID mudarem

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: 3 }}>
        <CircularProgress size={60} thickness={4} sx={{ color: '#344E41' }} />
        <Typography variant="h6" sx={{ color: '#344E41', fontWeight: 500 }}>
          A carregar...
        </Typography>
      </Box>
    );
  }

  if (error || !product) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h5" color="error" sx={{ fontWeight: 'bold' }}>❌ Erro ({source})</Typography>
        <Typography variant="body1" color="error">{error}</Typography>
        <Button variant="outlined" onClick={toggleSource} sx={{ mt: 2 }}>
           Tentar outra fonte
        </Button>
      </Box>
    );
  }

  const photos = product.photos || [];
  const reviewCount = product.reviewCount ?? 0;

  return (
    <Box sx={{ py: { xs: 2, sm: 3 } }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 1.5, sm: 3, md: 0 } }}>
        
        {/* TOGGLE BADGE */}
        <Box sx={{ mb: 2, textAlign: 'center' }}>
          <Box 
            onClick={toggleSource}
            sx={{ 
              display: 'inline-block',
              bgcolor: source === 'jumpseller' ? '#4caf50' : '#ff9800',
              color: 'white',
              px: 2, py: 0.5, borderRadius: 1, fontWeight: 'bold', cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              fontSize: '0.8rem'
            }}
          >
            {source === 'jumpseller' ? '⚡ Fonte: API' : '💾 Fonte: BD'} 
          </Box>
        </Box>

        {/* --- CONTEÚDO PRINCIPAL (LAYOUT ORIGINAL MANTIDO) --- */}
        <Box sx={{ bgcolor: '#E4E1D6', borderRadius: '24px', p: { xs: 2, sm: 3, md: 4 }, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.12)' }}>
          <Grid container columnSpacing={{ xs: 2, md: 2 }} rowSpacing={isSmallScreen ? 2 : 0}>
            {/* FOTOS */}
            <Grid item xs={12} md={3} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
               <Box sx={{ bgcolor: '#274836', borderRadius: '16px', p: 2, width: '100%', maxWidth: { md: 450 }, display: 'flex', flexDirection: 'column', gap: 1 }}>
                 <Box sx={{ bgcolor: 'white', borderRadius: '8px', overflow: 'hidden', aspectRatio: '3/4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Box component="img" src={photos[selectedPhotoIndex]?.photo_url || product.mainPhoto?.photo_url} sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                 </Box>
                 {photos.length > 1 && (
                   <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto' }}>
                     {photos.map((p, i) => (
                       <Box key={i} onClick={() => setSelectedPhotoIndex(i)} sx={{ width: 50, height: 50, borderRadius: 1, overflow: 'hidden', border: i === selectedPhotoIndex ? '2px solid #fff' : 'none', cursor: 'pointer' }}>
                         <Box component="img" src={p.photo_url} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                       </Box>
                     ))}
                   </Box>
                 )}
               </Box>
            </Grid>

            {/* INFO */}
            <Grid item xs={12} md={9} sx={{ pl: { md: 3 } }}>
               <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', gap: 2 }}>
                  <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#344E41' }}>{product.title}</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{Number(product.price).toFixed(2)} €</Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>{renderStars(product.avg_score)} <Typography>({reviewCount})</Typography></Box>
                  
                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                     <Button variant="contained" sx={{ bgcolor: '#344E41', color: 'white', px: 4, py: 1.5, borderRadius: '12px' }}>Comprar</Button>
                  </Box>
               </Box>
            </Grid>
          </Grid>

          {/* HISTÓRIA */}
          <Box sx={{ bgcolor: '#F5F5F5', borderRadius: '16px', mt: 4, p: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#344E41', mb: 1 }}>História do Produto</Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>{product.description}</Typography>
          </Box>
        </Box>
      </Box>

      {/* OTIMIZAÇÃO: Passamos os dados diretamente para as Specs. 
         Não fazemos fetch de novo!
      */}
      {product.specifications && product.specifications.length > 0 && (
         <ProductSpecifications data={product.specifications} />
      )}
    </Box>
  );
}

// Componente de Especificações alterado para receber DADOS, não ID.
export function ProductSpecifications({ data }: { data: ProductSpecification[] }) {
  if (!data || !data.length) return null;

  return (
    <>
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 1.5, sm: 3, md: 0 }, display: 'flex', flexDirection: 'column', gap: 1.5, pb: 4, mt: 4 }}>
        {data.map((spec, index) => (
          <React.Fragment key={index}>
            <Box sx={{ bgcolor: '#E4E1D6', borderRadius: '16px', p: { xs: 2.5, sm: 3, md: 3.5 } }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'black', mb: 1 }}>{spec.title}</Typography>
              <Typography variant="body1">{spec.description}</Typography>
            </Box>
          </React.Fragment>
        ))}
      </Box>
    </>
  );
}