import React, { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import SafeComponent from './SafeComponent';

export const API_BASE_URL = 'https://api.madeinportugal.store/api';

const ProductReviews = React.lazy(
  () => import('mips_reviews/ProductReviews'),
);

const BundleSuggestions = React.lazy(
  () => import("mips_bundle_suggestions/BundleSuggestions")
);

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

type ReviewSummary = {
  average: number;
  count: number;
};

interface ProductDetailProps {
  productId?: string | number;
  buyerId?: number; 
}

const NOT_FOUND_IMAGE = '/product-not-found.png';

const stripHtmlTags = (html: string): string => {
  if (typeof window === 'undefined') return html || '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
};

const mapJumpsellerToProduct = (jumpsellerProduct: any): ProductFromApi => {
  const product = jumpsellerProduct.product || jumpsellerProduct;

  const customFieldsSpecs = product.fields
    ? product.fields.map((field: any) => ({
        title: field.label,
        description: stripHtmlTags(field.value),
      }))
    : [];

  return {
    id: product.id,
    title: product.name || 'Produto sem nome',
    storytelling: stripHtmlTags(
      product.description || 'Descrição não disponível.',
    ),
    description: stripHtmlTags(
      product.description || 'Descrição não disponível.',
    ),
    price:
      typeof product.price === 'number'
        ? product.price
        : parseFloat(product.price || '0'),
    avg_score: 0,
    reviewCount: 0,
    photos:
      product.images && product.images.length > 0
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

const MOCK_PRODUCT: ProductFromApi = {
  id: 0,
  title: 'Produto não encontrado',
  storytelling: null,
  description:
    'O produto que está a tentar aceder não existe, foi removido ou o link está incorreto. Verifique o endereço ou explore a nossa loja.',
  price: 0,
  avg_score: 0,
  reviewCount: 0,
  mainPhoto: null,
  photos: [],
  specifications: [],
  brand: null,
};

const renderStars = (score: number) =>
  Array.from({ length: 5 }, (_, i) => {
    const id = `star-half-clip-${i}`;
    const full = i < Math.floor(score);
    const half = !full && score > i && score < i + 1;

    return (
      <svg
        key={i}
        viewBox="0 0 24 24"
        style={{
          width: 32,
          height: 32,
          marginRight: 4,
          display: 'block',
        }}
      >
        {half && (
          <>
            <defs>
              <clipPath id={id}>
                <rect x="0" y="0" width="12" height="24" />
              </clipPath>
            </defs>
            <path
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              fill="#FFC107"
              stroke="none"
              style={{ clipPath: `url(#${id})` }}
            />
          </>
        )}
        <path
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          fill={full ? '#FFC107' : 'none'}
          stroke="black"
          strokeWidth={1.4}
        />
      </svg>
    );
  });

export default function ProductDetail({ productId, buyerId = 1 }: ProductDetailProps)  {
  const [product, setProduct] = useState<ProductFromApi | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);

  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const targetId = productId ?? null;
  const lastSyncedCountRef = useRef(0);

  useEffect(() => {
    let isMounted = true;

    const fetchProduct = async () => {
      if (!isMounted) return;

      setLoading(true);
      setError(null);
      setIsNotFound(false);
      setProduct(null);

      if (!targetId) {
        if (isMounted) {
          setIsNotFound(true);
          setProduct(MOCK_PRODUCT);
          setLoading(false);
        }
        return;
      }

      console.log(`[ProductDetail] A iniciar procura para ID: ${targetId}`);

      try {
        let found = false;

        try {
          const res = await fetch(`${API_BASE_URL}/products/${targetId}`);
          if (res.ok) {
            const rawData = await res.json();
            if (isMounted) {
              const mapped = mapJumpsellerToProduct(rawData);
              setProduct(mapped);
              found = true;
            }
          }
        } catch (jsError) {
          console.warn('[ProductDetail] Erro ao contactar Jumpseller:', jsError);
        }

        if (!found) {
          try {
            const dbRes = await fetch(`${API_BASE_URL}/products/jumpseller/${targetId}`);
            if (dbRes.ok) {
              const dbData = await dbRes.json();
              if (isMounted) {
                setProduct(dbData as ProductFromApi);
                found = true;
              }
            }
          } catch (dbError) {
            console.warn('[ProductDetail] Erro ao contactar DB:', dbError);
          }
        }

        if (!found && isMounted) {
          setIsNotFound(true);
          setProduct(MOCK_PRODUCT);
        }

      } catch (err: any) {
        console.error('[ProductDetail] Erro crítico no fetch:', err);
        if (isMounted) {
          setIsNotFound(true);
          setProduct(MOCK_PRODUCT);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProduct();

    return () => {
      isMounted = false;
    };
  }, [targetId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!product?.id) return;
    if (isNotFound || product.id === 0) return;

    const container = document.getElementById('mips-reviews-wrapper');
    if (!container) return;

    const extractFromDom = () => {
      const paragraphs = Array.from(container.querySelectorAll('p'));
      for (const p of paragraphs) {
        const text = p.textContent?.trim() || '';
        if (!text) continue;

        const match = text.match(
          /(\d+(?:\.\d+)?)\s*\((\d+)\s*(reviews?|review|avaliações?|avaliação)\)/i,
        );
        if (match) {
          const avg = Number(match[1]);
          const count = Number(match[2]);
          if (!Number.isNaN(avg) && !Number.isNaN(count)) {
            setReviewSummary({ average: avg, count });
            return;
          }
        }
      }
    };

    const observer = new MutationObserver(extractFromDom);
    observer.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    extractFromDom();

    return () => observer.disconnect();
  }, [product?.id, isNotFound]);

  useEffect(() => {
    if (!product?.id || !reviewSummary || isNotFound || product.id === 0) return;
    if (lastSyncedCountRef.current === reviewSummary.count) return;

    const syncRating = async () => {
      try {
        await fetch(
          `${API_BASE_URL}/products/${product.id}/rating`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              avg_score: reviewSummary.average,
              review_count: reviewSummary.count,
            }),
          },
        );
        lastSyncedCountRef.current = reviewSummary.count;
      } catch (err) {
        console.error('Falha ao sincronizar rating com a API', err);
      }
    };

    const timer = setTimeout(syncRating, 1000);
    return () => clearTimeout(timer);
  }, [product?.id, reviewSummary, isNotFound]);

  useEffect(() => {
    if (!product?.id || !buyerId) return;

    const checkWishlist = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/wishlist/check?buyerId=${buyerId}&productId=${product.id}`,
          {
            method: 'GET',
            mode: 'cors',
            credentials: 'omit',
          }
        );

        if (response.ok) {
          const data = await response.json();
          setIsInWishlist(data.inWishlist);
        }
      } catch (error) {
        console.error('Error checking wishlist:', error);
      }
    };

    checkWishlist();
  }, [product?.id, buyerId]);

  const handleWishlistToggle = async () => {
    if (!product?.id || !buyerId || isWishlistLoading) return;

    setIsWishlistLoading(true);

    try {
      if (isInWishlist) {
        const response = await fetch(
          `${API_BASE_URL}/wishlist/remove?buyerId=${buyerId}&productId=${product.id}`,
          {
            method: 'POST',
            mode: 'cors',
            credentials: 'omit',
          }
        );

        if (!response.ok) {
          throw new Error('Failed to remove from wishlist');
        }

        setIsInWishlist(false);
      } else {
        const response = await fetch(
          `${API_BASE_URL}/wishlist/add?buyerId=${buyerId}&productId=${product.id}`,
          {
            method: 'POST',
            mode: 'cors',
            credentials: 'omit',
          }
        );

        if (!response.ok) {
          throw new Error('Failed to add to wishlist');
        }

        setIsInWishlist(true);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      alert('Failed in toggling wishlist.');
    } finally {
      setIsWishlistLoading(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        <CircularProgress size={60} thickness={4} sx={{ color: '#344E41' }} />
        <Typography variant="h6" sx={{ color: '#344E41', fontWeight: 500 }}>
          A carregar produto...
        </Typography>
      </Box>
    );
  }

  if (error && !product) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '40vh',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Typography variant="h5" color="error" sx={{ fontWeight: 'bold' }}>
          Erro ao carregar
        </Typography>
        <Typography variant="body1" color="error">
          {error}
        </Typography>
        <Button variant="outlined" onClick={() => window.location.reload()} sx={{ mt: 2 }}>
          Tentar Novamente
        </Button>
      </Box>
    );
  }

  if (!product) return null;

  const photos = product.photos || [];
  const effectiveAvgScore = reviewSummary?.average ?? 0;
  const effectiveReviewCount = reviewSummary?.count ?? 0;
  const ratingLabel =
    effectiveReviewCount > 0
      ? `${effectiveAvgScore.toFixed(1)} (${effectiveReviewCount} review${
          effectiveReviewCount > 1 ? 's' : ''
        })`
      : null;

  const isMock = isNotFound || product.id === 0;

  const mainImageSrc = isMock
    ? NOT_FOUND_IMAGE
    : photos[selectedPhotoIndex]?.photo_url ||
      product.mainPhoto?.photo_url ||
      '/placeholder.png';

  const mainImageAlt = isMock
    ? 'Product not found'
    : photos[selectedPhotoIndex]?.alt_text || product.title;

  const displayPrice = isMock ? '0.00' : Number(product.price).toFixed(2);

  return (
    <Box sx={{ py: { xs: 2, sm: 3 } }}>
      <Box
        sx={{
          maxWidth: 1200,
          mx: 'auto',
          px: { xs: 1.5, sm: 3, md: 0 },
        }}
      >
        <Box
          sx={{
            bgcolor: '#E4E1D6',
            borderRadius: '24px',
            p: { xs: 2, sm: 3, md: 4 },
            boxShadow:
              '0 10px 15px -3px rgba(0,0,0,0.12), 0 4px 6px -2px rgba(0,0,0,0.06)',
          }}
        >
          <Grid
            container
            columnSpacing={{ xs: 2, md: 2 }}
            rowSpacing={isSmallScreen ? 2 : 0}
            sx={{
              alignItems: 'strech',
              flexWrap: { xs: 'wrap', md: 'nowrap' },
            }}
          >
            <Grid
              item
              xs={12}
              md={3}
              sx={{
                display: 'flex',
                minWidth: 0,
                height: '100%',
                justifyContent: 'flex-end',
              }}
            >
              <Box
                sx={{
                  bgcolor: '#274836',
                  borderRadius: '16px',
                  p: 2,
                  width: { md: 450 },
                  height: { md: 550 },
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    bgcolor: 'white',
                    borderRadius: '8px',
                    width: '100%',
                    height: '100%',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Box
                    component="img"
                    src={mainImageSrc}
                    alt={mainImageAlt}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                    }}
                    onError={(e: any) => {
                      e.currentTarget.src = isMock
                        ? NOT_FOUND_IMAGE
                        : '/placeholder.png';
                    }}
                  />
                </Box>

                {!isMock && photos.length > 1 && (
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 2,
                      mt: 0,
                      justifyContent: 'center',
                      overflowX: 'auto',
                    }}
                  >
                    {photos.map((p, i) => (
                      <Box
                        key={i}
                        onClick={() => setSelectedPhotoIndex(i)}
                        sx={{
                          width: { xs: 60, sm: 60 },
                          height: { xs: 60, sm: 60 },
                          flexShrink: 0,
                          borderRadius: 2,
                          overflow: 'hidden',
                          border:
                            i === selectedPhotoIndex
                              ? '2.5px solid #344E41'
                              : '2.5px solid transparent',
                          cursor: 'pointer',
                          bgcolor: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow:
                            i === selectedPhotoIndex
                              ? '0 0 0 3px white, 0 0 10px 2px rgba(255,255,255,0.6)'
                              : 'none',
                          transition: 'all 0.18s',
                        }}
                      >
                        <Box
                          component="img"
                          src={p.photo_url}
                          alt={p.alt_text || product.title}
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
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
              md={9}
              sx={{
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                pl: { md: 3 },
                flex: 1,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  justifyContent: 'space-between',
                  gap: 3,
                }}
              >
                <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 1,
                      gap: 2,
                    }}
                  >
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography
                        variant="h3"
                        component="h1"
                        sx={{
                          fontSize: {
                            xs: '2rem',
                            sm: '2.25rem',
                            lg: '2.5rem',
                          },
                          fontWeight: 'bold',
                          color: isMock ? '#8B0000' : '#344E41',
                          lineHeight: 1.1,
                          wordBreak: 'break-word',
                        }}
                      >
                        {isMock ? 'Produto não encontrado' : product.title}
                      </Typography>

                      {product.brand && !isMock && (
                        <Typography
                          variant="subtitle1"
                          sx={{
                            color: '#588157',
                            fontWeight: 600,
                            fontSize: { xs: '1.05rem', sm: '1.15rem' },
                            mt: 0.5,
                            fontStyle: 'italic',
                          }}
                        >
                          {product.brand}
                        </Typography>
                      )}

                      {isMock && (
                        <Typography
                          variant="subtitle1"
                          sx={{
                            color: '#6B7280',
                            mt: 0.6,
                            fontSize: { xs: '1.02rem', sm: '1.08rem' },
                          }}
                        >
                          Verifique se o link está correto ou explore outros
                          produtos em madeinportugal.store.
                        </Typography>
                      )}
                    </Box>

                    <IconButton
                      aria-label={isInWishlist ? "Remover da wishlist" : "Adicionar à wishlist"}
                      onClick={handleWishlistToggle}
                      disabled={isWishlistLoading}
                      sx={{
                        p: 1,
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'scale(1.08)',
                        },
                        '&:disabled': {
                          opacity: 0.6,
                        },
                        flexShrink: 0,
                      }}
                    >
                      {isWishlistLoading ? (
                        <CircularProgress size={32} sx={{ color: '#344E41' }} />
                      ) : isInWishlist ? (
                        <svg
                          width="40"
                          height="40"
                          fill="#FE7F8B"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <svg
                          width="40"
                          height="40"
                          fill="none"
                          stroke="#344E41"
                          strokeWidth={2.2}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        </svg>
                      )}
                    </IconButton>
                  </Box>

                  <Box
                    sx={{
                      maxHeight: 400,
                      overflowY: 'auto',
                      mb: 1.5,
                      pr: 1,
                      mt: 2
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: { xs: '1.05rem', sm: '1.12rem' },
                        color: 'black',
                        lineHeight: 1.7,
                      }}
                    >
                      {product.storytelling || product.description}
                    </Typography>
                  </Box>
                </Box>

                <Box>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Typography
                      variant="h3"
                      sx={{
                        fontSize: {
                          xs: '2rem',
                          sm: '2.25rem',
                          lg: '2.5rem',
                        },
                        fontWeight: 'bold',
                        color: isMock ? '#6B7280' : 'black',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      {displayPrice} €
                    </Typography>

                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        flexWrap: 'wrap',
                      }}
                    >
                      {!isMock && effectiveReviewCount > 0 ? (
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.75,
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.3,
                            }}
                          >
                            {renderStars(effectiveAvgScore)}
                          </Box>
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: { xs: '1.05rem', sm: '1.1rem' },
                              fontWeight: 700,
                              color: 'black',
                              whiteSpace: 'nowrap',
                              display: 'flex',
                              alignItems: 'center',
                              lineHeight: 1,
                              mt: '2px',
                            }}
                          >
                            {ratingLabel}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography
                          variant="body1"
                          sx={{
                            fontSize: { xs: '1rem', sm: '1.1rem' },
                            fontWeight: 500,
                            color: isMock ? '#9CA3AF' : '#999',
                          }}
                        >
                          {isMock
                            ? ''
                            : 'Sem avaliações'}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      gap: 2,
                      width: '100%',
                      alignItems: 'center',
                      justifyContent: { xs: 'center', sm: 'flex-start' },
                      mt: 2,
                    }}
                  >
                    <Button
                      variant="contained"
                      disabled={isMock}
                      sx={{
                        width: { xs: '100%', sm: 'auto' },
                        minWidth: 160,
                        bgcolor: '#344E41',
                        color: 'white',
                        p: { xs: '10px 20px', sm: '14px 28px' },
                        borderRadius: '12px',
                        fontWeight: 'bold',
                        fontSize: { xs: '0.98rem', sm: '1.05rem' },
                        '&:hover': {
                          bgcolor: isMock ? '#344E41' : '#A3B18A',
                          color: isMock ? 'white' : 'black',
                        },
                        opacity: isMock ? 0.5 : 1,
                        cursor: isMock ? 'not-allowed' : 'pointer',
                        gap: 1.5,
                        boxShadow:
                          '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
                      }}
                    >
                      <svg
                        width="24"
                        height="24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>{' '}
                      Comprar
                    </Button>
                    <Button
                      variant="contained"
                      disabled={isMock}
                      sx={{
                        width: { xs: '100%', sm: 'auto' },
                        bgcolor: '#588157',
                        color: 'white',
                        ml: { sm: 2 },
                        p: { xs: '10px 20px', sm: '14px 28px' },
                        borderRadius: '12px',
                        fontWeight: 'bold',
                        fontSize: { xs: '0.98rem', sm: '1.05rem' },
                        '&:hover': {
                          bgcolor: isMock ? '#588157' : '#A3B18A',
                          color: isMock ? 'white' : 'black',
                        },
                        opacity: isMock ? 0.5 : 1,
                        cursor: isMock ? 'not-allowed' : 'pointer',
                        gap: 1.5,
                        boxShadow:
                          '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
                      }}
                    >
                      <svg
                        width="24"
                        height="24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>{' '}
                      Falar com o Vendedor
                    </Button>
                  </Box>
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
                fontSize: { xs: '1.2rem', sm: '1.35rem' },
              }}
            >
              {isMock ? 'Produto não encontrado' : 'História do Produto'}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: '1.02rem', sm: '1.1rem' },
                fontWeight: 600,
                color: 'black',
                whiteSpace: 'pre-line',
                lineHeight: 1.7,
              }}
            >
              {isMock
                ? 'Não conseguimos encontrar este produto. Ele pode ter sido removido ou nunca ter existido. Experimente navegar pelas categorias ou utilizar a barra de pesquisa para encontrar algo semelhante.'
                : product.description}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{ height: '1px', bgcolor: 'rgba(52, 78, 65, 0.3)', my: 3 }}
        />
      </Box>

      {!isMock && product.specifications && product.specifications.length > 0 && (
        <ProductSpecifications data={product.specifications} />
      )}

      <Box
        sx={{
          maxWidth: 1200,
          mx: 'auto',
          px: { xs: 1.5, sm: 3, md: 0 },
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          pb: 4,
        }}
      >
        <Box
          sx={{ height: '1px', bgcolor: 'rgba(52, 78, 65, 0.3)', my: 3 }}
        />
        <Box
          id="mips-reviews-wrapper"
          sx={{
            bgcolor: '#E4E1D6',
            borderRadius: '16px',
            p: { xs: 2.5, sm: 3, md: 3.5 },
            position: 'relative',
          }}
        >
          {isMock ? (
            <Box
              sx={{
                textAlign: 'center',
                py: 4,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 'bold',
                  color: '#4B5563',
                  mb: 1,
                }}
              >
                Reviews indisponíveis para este produto
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: '#6B7280',
                  fontSize: { xs: '0.98rem', sm: '1.02rem' },
                }}
              >
                Não é possível avaliar ou comentar um produto que não existe.
              </Typography>
            </Box>
          ) : (
            <SafeComponent>
              <ProductReviews productId={product.id} customerId={18005446} />
            </SafeComponent>
          )}
        </Box>
        <Box sx={{ height: '1px', bgcolor: 'rgba(52, 78, 65, 0.3)', my: 3 }} />
      </Box>

      {/* Bundles suggestions */}
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 1.5, sm: 3, md: 0 }, display: 'flex', flexDirection: 'column', gap: 1.5, pb: 4 }}>
        <Box sx={{ bgcolor: '#E4E1D6', borderRadius: '16px', p: { xs: 2.5, sm: 3, md: 3.5 } }}>
          <SafeComponent>
            <BundleSuggestions productId={product.id} />
          </SafeComponent>
        </Box>
      </Box>
      
      <Box sx={{ height: '1px', bgcolor: 'rgba(52, 78, 65, 0.3)', my: 3 }} />

    </Box>
  );
}

export function ProductSpecifications({ data }: { data: ProductSpecification[] }) {
  if (!data || !data.length) return null;

  return (
    <>
      <Box
        sx={{
          maxWidth: 1200,
          mx: 'auto',
          px: { xs: 1.5, sm: 3, md: 0 },
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          pb: 4,
        }}
      >
        {data.map((spec, index) => (
          <React.Fragment key={index}>
            <Box
              sx={{
                bgcolor: '#E4E1D6',
                borderRadius: '16px',
                p: { xs: 2.5, sm: 3, md: 3.5 },
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  fontSize: { xs: '1.3rem', sm: '1.6rem' },
                  fontWeight: 'bold',
                  color: 'black',
                  mb: 1.25,
                }}
              >
                {spec.title}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: 'black',
                  fontSize: { xs: '1.05rem', sm: '1.12rem' },
                  lineHeight: 1.6,
                  whiteSpace: 'pre-line',
                  pl: { xs: 1, sm: 2 },
                }}
              >
                {spec.description}
              </Typography>
            </Box>
            {index < data.length - 1 && (
              <Box
                sx={{
                  height: '1px',
                  bgcolor: 'rgba(52, 78, 65, 0.3)',
                  my: 3,
                }}
              />
            )}
          </React.Fragment>
        ))}
      </Box>
    </>
  );
}