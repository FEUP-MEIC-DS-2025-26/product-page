import React, { useState, useEffect, useRef, Suspense } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme, alpha } from '@mui/material/styles';
import SafeComponent from './SafeComponent';

export const API_BASE_URL = 'https://api.madeinportugal.store/api';

const IN_PRODUCTION = !(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// --- COR DA MARCA (Verde) ---
const BRAND_GREEN = '#417F45'; 
// --- COR DAS ESTRELAS (Amarelo) ---
const STAR_COLOR = '#FFC107';

const ProductReviews = React.lazy(
  () => import('mips_reviews/ProductReviews'),
);

const BundleSuggestions = React.lazy(
  () => import("mips_bundle_suggestions/BundleSuggestions")
);

const ReportModal = React.lazy(
  () => import("mips_product_report/ReportModal")
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
    ? product.fields
        .filter((field: any) => 
          field.label !== "História" && field.label !== "Historia"
        )
        .map((field: any) => ({
          title: field.label,
          description: stripHtmlTags(field.value),
        }))
    : [];

  return {
    id: product.id,
    title: product.name || 'Produto sem nome',
    storytelling: stripHtmlTags(
      product.fields?.find((field: any) => field.label === "História" || field.label === "Historia")?.value ||  'História não disponível.',
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

const renderStars = (score: number, fillColor: string, strokeColor: string) =>
  Array.from({ length: 5 }, (_, i) => {
    const id = `star-half-clip-${i}`;
    const full = i < Math.floor(score);
    const half = !full && score > i && score < i + 1;

    return (
      <svg
        key={i}
        viewBox="0 0 24 24"
        style={{
          width: 20, 
          height: 20,
          marginRight: 1,
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
              fill={fillColor}
              stroke="none"
              style={{ clipPath: `url(#${id})` }}
            />
          </>
        )}
        <path
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          fill={full ? fillColor : 'none'}
          stroke={strokeColor}
          strokeWidth={1.4}
        />
      </svg>
    );
  });

export default function ProductDetail({ productId, buyerId }: ProductDetailProps)  {
  const [product, setProduct] = useState<ProductFromApi | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);

  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);

  const [showReportModal, setShowReportModal] = useState(false);

  const [sessionUserId, setSessionUserId] = useState<number | null>(IN_PRODUCTION ? null : (buyerId ?? null));

  const getUserIdFromSession = async (): Promise<number | null> => {
    try {
      const authenticationURL = 'https://api.madeinportugal.store/api/auth/verify';

      const response = await fetch(authenticationURL, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) return null;
      const data = await response.json();
      return data.userID ?? null;
    } catch (err) {
      console.error('Error verifying session:', err);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;
    if (!IN_PRODUCTION) {
      setSessionUserId(buyerId);
      return;
    }

    const init = async () => {
      const id = await getUserIdFromSession();
      if (mounted) setSessionUserId(id);
    };

    init();
    return () => {
      mounted = false;
    };
  }, []);

  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const targetId = productId ?? null;
  const lastSyncedCountRef = useRef(0);

  // --- CONFIGURAÇÃO DA PALETA ESTRITA ---
  const bgColor = isDark ? '#000000' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const borderColor = isDark ? '#333333' : '#e0e0e0';
  const secondaryTextColor = isDark ? '#aaaaaa' : '#555555';

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
    const effectiveBuyerId = IN_PRODUCTION ? sessionUserId : buyerId;
    if (!product?.id || !effectiveBuyerId) return;

    const checkWishlist = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/wishlist/check?buyerId=${effectiveBuyerId}&productId=${product.id}`,
          {
            method: 'GET',
            mode: 'cors',
            credentials: 'include',
          }
        );

        if (response.status === 401) {
          setSessionUserId(null);
          setIsInWishlist(false);
          return;
        }

        if (response.ok) {
          const data = await response.json();
          setIsInWishlist(data.inWishlist);
        }
      } catch (error) {
        console.error('Error checking wishlist:', error);
      }
    };

    checkWishlist();
  }, [product?.id, sessionUserId, buyerId]);

  const handleWishlistToggle = async () => {
    if (!product?.id || isWishlistLoading) return;

    if (!sessionUserId) {
      window.location.href = '/auth';
      return;
    }
    const userIdForRequest = sessionUserId;

    setIsWishlistLoading(true);

    try {
      if (isInWishlist) {
        const response = await fetch(
          `${API_BASE_URL}/wishlist/remove?buyerId=${userIdForRequest}&productId=${product.id}`,
          {
            method: 'POST',
            mode: 'cors',
            credentials: 'include',
          }
        );

        if (response.status === 401) {
          window.location.href = '/auth';
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to remove from wishlist');
        }

        setIsInWishlist(false);
      } else {
        const response = await fetch(
          `${API_BASE_URL}/wishlist/add?buyerId=${userIdForRequest}&productId=${product.id}`,
          {
            method: 'POST',
            mode: 'cors',
            credentials: 'include',
          }
        );

        if (response.status === 401) {
          window.location.href = '/auth';
          return;
        }

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
        <CircularProgress size={60} thickness={4} sx={{ color: BRAND_GREEN }} />
        <Typography variant="h6" sx={{ color: BRAND_GREEN, fontWeight: 500 }}>
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
      ? `${effectiveAvgScore.toFixed(1)} (${effectiveReviewCount} ${effectiveReviewCount === 1 ? 'avaliação' : 'avaliações'})`
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

  // ...existing code...

  return (
    <Box sx={{ py: { xs: 1, sm: 3 } }}> 
      {/* INJECTED STYLES FOR REVIEWS IN DARK MODE */}
      {isDark && (
        <style>
          {`
            #mips-reviews-wrapper,
            #mips-reviews-wrapper p,
            #mips-reviews-wrapper span,
            #mips-reviews-wrapper h1,
            #mips-reviews-wrapper h2,
            #mips-reviews-wrapper h3,
            #mips-reviews-wrapper h4,
            #mips-reviews-wrapper h5,
            #mips-reviews-wrapper h6,
            #mips-reviews-wrapper div {
              color: #ffffff !important;
            }
            #mips-reviews-wrapper svg {
              fill: #FFC107; /* Opcional: garantir que estrelas continuam amarelas */
            }
          `}
        </style>
      )}

      <Box
        sx={{
          maxWidth: 1200,
          mx: 'auto',
          px: { xs: 1, sm: 3, md: 0 },
        }}
      >
        {/* CARTÃO PRINCIPAL */}
        <Box
          sx={{
            bgcolor: bgColor, 
            color: textColor,
            borderRadius: '24px',
            p: { xs: 1.5, sm: 2.5, md: 4 }, // Padding interno muito reduzido em XS
            border: `1px solid ${borderColor}`,
            boxShadow: isDark 
              ? '0 10px 15px -3px rgba(0,0,0,0.5)' 
              : '0 10px 15px -3px rgba(0,0,0,0.12)',
            transition: 'all 0.3s ease'
          }}
        >
          <Grid
            container
            columnSpacing={{ xs: 2, md: 2 }}
            rowSpacing={isSmallScreen ? 1.5 : 0} // Row spacing reduzido
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
                  bgcolor: BRAND_GREEN,
                  borderRadius: '16px',
                  p: { xs: 1.5, md: 2 },
                  width: { xs: '100%', md: 450 },
                  height: 'auto',
                  minHeight: { xs: 'auto', md: 550 },
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
                    height: { xs: 'auto', md: 450 },
                    maxHeight: { xs: 300, sm: 360, md: 450 }, // MaxHeight mais agressivo em XS
                    aspectRatio: { xs: '1/1', md: 'auto' },
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

                {/* MINIATURAS MAIS PEQUENAS EM MOBILE */}
                {!isMock && photos.length > 1 && (
                  <Box
                    sx={{
                      display: 'flex',
                      gap: { xs: 1, md: 2 },
                      mt: 1,
                      justifyContent: 'center',
                      flexWrap: 'wrap',
                    }}
                  >
                    {photos.map((p, i) => (
                      <Box
                        key={i}
                        onClick={() => setSelectedPhotoIndex(i)}
                        sx={{
                          width: { xs: 40, sm: 50, md: 60 }, // Miniaturas 40px em XS
                          height: { xs: 40, sm: 50, md: 60 },
                          flexShrink: 0,
                          borderRadius: 2,
                          overflow: 'hidden',
                          border:
                            i === selectedPhotoIndex
                              ? '2px solid white'
                              : '2px solid transparent',
                          cursor: 'pointer',
                          bgcolor: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow:
                            i === selectedPhotoIndex
                              ? '0 0 0 2px rgba(255,255,255,0.5)'
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
                  gap: { xs: 1.5, md: 3 }, 
                }}
              >
                <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 0.5,
                      gap: 1.5,
                    }}
                  >
                    <Box sx={{ flexGrow: 1 }}>
                      {/* TÍTULO RESPONSIVO: MUITO PEQUENO EM XS PARA CABER "BARCELOS" */}
                      <Typography
                        variant="h3"
                        component="h1"
                        sx={{
                          fontSize: {
                            xs: '1.25rem',  // REDUZIDO DRASTICAMENTE EM MOBILE
                            sm: '1.5rem',
                            md: '2.25rem',  // Desktop mantém-se
                            lg: '2.5rem',
                          },
                          fontWeight: 'bold',
                          color: isMock ? '#8B0000' : BRAND_GREEN,
                          lineHeight: 1.2,
                          wordBreak: 'break-word',
                        }}
                      >
                        {isMock ? 'Produto não encontrado' : product.title}
                      </Typography>

                      {product.brand && !isMock && (
                        <Typography
                          variant="subtitle1"
                          sx={{
                            color: textColor,
                            fontWeight: 600,
                            fontSize: { xs: '0.85rem', sm: '1rem', md: '1.15rem' }, 
                            mt: 0.5,
                            fontStyle: 'italic',
                          }}
                        >
                          {product.brand}
                        </Typography>
                      )}
                    </Box>

                    {/* ACTIONS TOP */}
                    <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                      <IconButton
                        aria-label={isInWishlist ? "Remover da wishlist" : "Adicionar à wishlist"}
                        onClick={handleWishlistToggle}
                        disabled={isWishlistLoading}
                        sx={{
                          p: 0.5, 
                          '& svg': { width: { xs: 28, md: 40 }, height: { xs: 28, md: 40 } }, 
                        }}
                      >
                        {isWishlistLoading ? (
                          <CircularProgress size={24} sx={{ color: BRAND_GREEN }} />
                        ) : isInWishlist ? (
                          <svg
                            width="40"
                            height="40"
                            fill="#EF4444" 
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
                            stroke="#EF4444" // <--- CORAÇÃO VERMELHO
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

                      {!isMock && (
                        <IconButton
                          aria-label="Reportar produto"
                          onClick={() => {
                            if (!sessionUserId) {
                              window.location.href = '/auth';
                              return;
                            }
                            setShowReportModal(true);
                          }}
                          sx={{
                            p: 0.5,
                            '& svg': { width: { xs: 28, md: 40 }, height: { xs: 28, md: 40 } },
                          }}
                        >
                          <svg
                            width="40"
                            height="40"
                            fill="none"
                            stroke="#EF4444"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5"
                            />
                          </svg>
                        </IconButton>
                      )}
                    </Box>
                  </Box>

                  {/* DESCRIÇÃO - Fonte pequena */}
                  <Box
                    sx={{
                      maxHeight: { xs: 180, sm: 250, md: 400 }, 
                      overflowY: 'auto',
                      mb: 1,
                      pr: 1,
                      mt: { xs: 0.5, md: 2 }
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: { xs: '0.85rem', sm: '1rem', md: '1.12rem' }, // Fonte reduzida em mobile
                        color: textColor,
                        lineHeight: 1.5,
                      }}
                    >
                      {product.description}
                    </Typography>
                  </Box>
                </Box>

                {/* PREÇO E BOTÕES */}
                <Box>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      flexWrap: 'wrap',
                      mb: 1.5, // Margem abaixo do preço
                    }}
                  >
                    <Typography
                      variant="h3"
                      sx={{
                        fontSize: {
                          xs: '1.5rem', // Preço menor mobile
                          sm: '1.8rem',
                          lg: '2.5rem',
                        },
                        fontWeight: 'bold',
                        color: isMock ? secondaryTextColor : textColor,
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
                        gap: 0.5,
                        flexWrap: 'wrap',
                      }}
                    >
                      {!isMock && effectiveReviewCount > 0 ? (
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.5,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                            {renderStars(effectiveAvgScore, STAR_COLOR, textColor)}
                          </Box>
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: { xs: '0.85rem', sm: '1rem', md: '1.1rem' },
                              fontWeight: 700,
                              color: textColor,
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
                            fontSize: { xs: '0.85rem', sm: '1rem', md: '1.1rem' },
                            fontWeight: 500,
                            color: secondaryTextColor,
                          }}
                        >
                          {isMock ? '' : 'Sem avaliações'}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      // AQUI: Column em Mobile/Tablet (para não saltar fora), Row em Desktop
                      flexDirection: { xs: 'column', md: 'row' }, 
                      gap: { xs: 1, sm: 1.5 },
                      width: '100%',
                      alignItems: 'stretch', // Esticar botões em coluna
                      justifyContent: { xs: 'center', sm: 'flex-start' },
                      mt: 1,
                    }}
                  >
                    <Button
                      variant="contained"
                      disabled={isMock}
                      sx={{
                        width: { xs: '100%', md: 'auto' }, // 100% largura em mobile
                        minWidth: { xs: 'auto', md: 160 },
                        bgcolor: BRAND_GREEN,
                        color: 'white',
                        p: { xs: '8px 16px', sm: '12px 24px' }, // Padding menor
                        borderRadius: '10px',
                        fontWeight: 'bold',
                        fontSize: { xs: '0.85rem', sm: '1rem' }, // Letra menor
                        '&:hover': {
                          bgcolor: isMock ? BRAND_GREEN : alpha(BRAND_GREEN, 0.8),
                          color: isMock ? 'white' : 'white',
                        },
                        opacity: isMock ? 0.5 : 1,
                        cursor: isMock ? 'not-allowed' : 'pointer',
                        gap: 1,
                        boxShadow:
                          '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
                      }}
                    >
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Comprar
                    </Button>
                    <Button
                      variant="contained"
                      disabled={isMock}
                      sx={{
                        width: { xs: '100%', md: 'auto' }, // 100% largura em mobile
                        bgcolor: isDark ? 'white' : 'black',
                        color: isDark ? 'black' : 'white',
                        ml: { md: 2 }, // Só margem à esquerda em desktop
                        p: { xs: '8px 16px', sm: '12px 24px' },
                        borderRadius: '10px',
                        fontWeight: 'bold',
                        fontSize: { xs: '0.85rem', sm: '1rem' },
                        '&:hover': {
                          bgcolor: isDark ? alpha('#fff', 0.9) : alpha('#000', 0.8),
                        },
                        opacity: isMock ? 0.5 : 1,
                        cursor: isMock ? 'not-allowed' : 'pointer',
                        gap: 1,
                        boxShadow:
                          '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
                      }}
                    >
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Falar com Vendedor
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>

          {/* Story Section */}
          <Box
            sx={{
              bgcolor: 'transparent',
              borderRadius: '16px',
              mt: { xs: 2.5, md: 4 },
              p: { xs: 1.5, sm: 2.5 },
              border: `1px solid ${BRAND_GREEN}`,
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontWeight: 'bold',
                color: BRAND_GREEN,
                mb: 0.5,
                fontSize: { xs: '1rem', sm: '1.35rem' },
              }}
            >
              {isMock ? 'Produto não encontrado' : 'História do Produto'}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: '0.85rem', sm: '1.05rem' },
                fontWeight: 600,
                color: textColor,
                whiteSpace: 'pre-line',
                lineHeight: 1.5,
              }}
            >
              {isMock
                ? 'Não conseguimos encontrar este produto. Ele pode ter sido removido ou nunca ter existido. Experimente navegar pelas categorias ou utilizar a barra de pesquisa para encontrar algo semelhante.'
                : product.storytelling}
            </Typography>
          </Box>
        </Box>

        {/* Separador */}
        <Box
          sx={{ height: '1px', bgcolor: alpha(BRAND_GREEN, 0.3), my: 2 }}
        />
      </Box>

      {/* Specifications */}
      {!isMock && product.specifications && product.specifications.length > 0 && (
        <ProductSpecifications data={product.specifications} />
      )}

      {/* Reviews, Bundles, etc */}
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
          sx={{ height: '1px', bgcolor: alpha(BRAND_GREEN, 0.3), my: 2 }}
        />
        <Box
          id="mips-reviews-wrapper"
          sx={{
            bgcolor: bgColor,
            borderRadius: '16px',
            border: `1px solid ${borderColor}`,
            p: { xs: 2, sm: 3, md: 3.5 },
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
                  color: secondaryTextColor,
                  mb: 1,
                  fontSize: { xs: '0.9rem', md: '1.25rem' }
                }}
              >
                Reviews indisponíveis para este produto
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: secondaryTextColor,
                  fontSize: { xs: '0.85rem', sm: '1.02rem' },
                }}
              >
                Não é possível avaliar ou comentar um produto que não existe.
              </Typography>
            </Box>
          ) : (
            <SafeComponent>
              <Suspense fallback={<CircularProgress size={30} sx={{ color: BRAND_GREEN, display: 'block', mx: 'auto' }} />}>
                <ProductReviews productId={product.id} customerId={18005446} />
              </Suspense>
            </SafeComponent>
          )}
        </Box>
        <Box sx={{ height: '1px', bgcolor: alpha(BRAND_GREEN, 0.3), my: 2 }} />
      </Box>

      {/* Bundles suggestions */}
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 1.5, sm: 3, md: 0 }, display: 'flex', flexDirection: 'column', gap: 1.5, pb: 4 }}>
        <Box sx={{ bgcolor: bgColor, borderRadius: '16px', border: `1px solid ${borderColor}`, p: { xs: 2, sm: 3, md: 3.5 } }}>
          <SafeComponent>
            <Suspense fallback={<CircularProgress size={30} sx={{ color: BRAND_GREEN, display: 'block', mx: 'auto' }} />}>
              <BundleSuggestions productId={product.id} />
            </Suspense>
          </SafeComponent>
        </Box>
      </Box>
      
      <Box sx={{ height: '1px', bgcolor: alpha(BRAND_GREEN, 0.3), my: 2 }} />

      {!isMock && (
        <SafeComponent>
          <Suspense fallback={null}>
            <ReportModal
              externalId={String(product.id)}
              productTitle={product.title}
              userId={1}
              visible={showReportModal}
              onClose={() => setShowReportModal(false)}
              mode={theme.palette.mode === 'dark' ? 'dark' : 'light'}
            />
          </Suspense>
        </SafeComponent>
      )}

    </Box>
  );
}

export function ProductSpecifications({ data }: { data: ProductSpecification[] }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const bgColor = isDark ? '#000000' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const borderColor = isDark ? '#333333' : '#e0e0e0';

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
                bgcolor: bgColor,
                borderRadius: '16px',
                border: `1px solid ${borderColor}`,
                p: { xs: 2, sm: 3, md: 3.5 },
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  fontSize: { xs: '1.1rem', sm: '1.6rem' },
                  fontWeight: 'bold',
                  color: textColor,
                  mb: 1,
                }}
              >
                {spec.title}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: textColor,
                  fontSize: { xs: '0.9rem', sm: '1.12rem' },
                  lineHeight: 1.5,
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
                  bgcolor: alpha(BRAND_GREEN, 0.3), // Separador Verde
                  my: 2,
                }}
              />
            )}
          </React.Fragment>
        ))}
      </Box>
    </>
  );
}