import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton'; // Para o botão wishlist

// --- DADOS FALSOS (Substituindo o Prisma) ---
const dummyProduct = {
  id: 3,
  title: 'Galo de Barcelos (Exemplo)',
  storytelling: 'Uma peça icónica de artesanato português.',
  description: 'Este galo de Barcelos é pintado à mão por artesãos locais, usando técnicas tradicionais. Cada peça é única e representa uma história de folclore e cultura.',
  price: 29.99,
  avg_score: 4.5, // Média de avaliações
  reviewCount: 3, // Contagem de avaliações
  mainPhoto: {
    photo_url: 'https://placehold.co/300x300/274836/FFFFFF?text=Galo',
    alt_text: 'Galo de Barcelos',
  },
  specifications: [
    { title: 'Material', description: 'Cerâmica pintada à mão' },
    { title: 'Dimensões', description: '25cm x 15cm' },
  ],
};

// --- COMPONENTE TRADUZIDO ---

export default function ProductDetail() {
  const product = dummyProduct; // Usamos o produto falso
  const { reviewCount } = product;

  // Função para renderizar estrelas (copiada e adaptada)
  const renderStars = (score: number) => {
    return Array.from({ length: 5 }, (_, i) => {
      const starNumber = i + 1;
      const isFilled = score >= starNumber;
      // Não precisamos de meia estrela para este exemplo, simplifica
      return (
        <svg
          key={i}
          className={`w-9 h-9 sm:w-10 sm:h-10 ${
            isFilled ? 'fill-[#3A5A40]' : 'fill-none'
          } stroke-[#3A5A40] stroke-2`}
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: 40, height: 40 }} // Tamanho fixo para MUI
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

  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}> {/* Padding geral */}
      {/* Main Product Card */}
      <Box
        sx={{
          bgcolor: '#DAD7CD',
          borderRadius: '24px', // rounded-3xl
          p: { xs: 2, sm: 4 }, // p-6 sm:p-8
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)', // shadow-lg
        }}
      >
        <Grid container spacing={{ xs: 3, lg: 4 }}>
          {/* Left: Product Image */}
          <Grid item xs={12} lg={4.5} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Box
              sx={{
                bgcolor: '#274836', // bg-[#274836]
                borderRadius: '16px', // rounded-2xl
                p: 2, // p-4
                width: { xs: 260, sm: 300, lg: 350 }, // w-[...]
                height: { xs: 260, sm: 300, lg: 350 }, // h-[...]
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Box
                sx={{
                  bgcolor: 'white',
                  borderRadius: '8px', // rounded-md
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
                  src={product.mainPhoto.photo_url}
                  alt={product.mainPhoto.alt_text}
                  sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </Box>
            </Box>
          </Grid>

          {/* Right: Product Info */}
          <Grid item xs={12} lg={7.5}>
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
              <Box>
                {/* Title and Wishlist */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                  <Typography
                    variant="h3" // h1
                    component="h1"
                    sx={{
                      fontSize: { xs: '1.5rem', sm: '1.875rem', lg: '2.25rem' }, // text-2xl...
                      fontWeight: 'bold',
                      color: '#344E41',
                      lineHeight: 1.2, // leading-tight
                    }}
                  >
                    {product.title}
                  </Typography>
                  <IconButton
                    aria-label="Add to wishlist"
                    sx={{
                      p: 1, // p-2
                      '&:hover': {
                        transform: 'scale(1.1)',
                        '& svg': { fill: '#344E41' },
                      },
                    }}
                  >
                    <svg
                      width="48"
                      height="48"
                      fill="none"
                      stroke="#344E41"
                      strokeWidth={2.5}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </IconButton>
                </Box>

                {/* Storytelling */}
                <Typography variant="body1" sx={{ fontSize: { xs: '1rem', sm: '1.125rem' }, fontWeight: '600', color: 'black', mb: 1.5 }}>
                  {product.storytelling}
                </Typography>

                {/* Description */}
                <Typography variant="body2" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, color: 'black', mb: 2, lineHeight: 1.6 }}>
                  {product.description}
                </Typography>

                {/* Rating with count */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {renderStars(product.avg_score)}
                  </Box>
                  <Typography variant="body1" sx={{ fontSize: { xs: '1rem', sm: '1.125rem' }, fontWeight: '500', color: '#3A5A40' }}>
                    {reviewCount === 0
                      ? 'Sem avaliações'
                      : `(${reviewCount} avaliaç${reviewCount > 1 ? 'ões' : 'ão'})`}
                  </Typography>
                </Box>
              </Box>

              {/* Price and Actions */}
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', gap: 2 }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontSize: { xs: '1.875rem', sm: '2.25rem', lg: '3rem' }, // text-3xl...
                    fontWeight: 'bold',
                    color: 'black',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {Number(product.price).toFixed(2)} €
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, flex: 1, width: '100%' }}>
                  <Button
                    variant="contained"
                    sx={{
                      flex: 1,
                      bgcolor: '#344E41',
                      color: 'white',
                      p: { xs: '12px 24px', sm: '16px 32px' }, // px-6 py-3...
                      borderRadius: '12px', // rounded-xl
                      fontWeight: 'bold',
                      fontSize: { xs: '1rem', sm: '1.125rem' },
                      '&:hover': {
                        bgcolor: '#A3B18A',
                        color: 'black',
                      },
                      gap: 1.5,
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)', // shadow-md
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
            </Box>
          </Grid>
        </Grid>
      </Box>
      
      {/* Divider */}
      <Box sx={{ height: '1px', bgcolor: 'rgba(52, 78, 65, 0.3)', my: 3 }} />

      {/* Additional Information Sections */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {product.specifications.map((spec, index) => (
          <Box key={index} sx={{ bgcolor: '#DAD7CD', borderRadius: '16px', p: { xs: 3, sm: 4 } }}>
            <Typography variant="h4" sx={{ fontSize: { xs: '1.875rem', sm: '2.25rem' }, fontWeight: 'bold', color: '#344E41', mb: 2 }}>
              {spec.title}
            </Typography>
            <Typography variant="body1" sx={{ color: 'black', fontSize: { xs: '1.125rem', sm: '1.25rem' }, whiteSpace: 'pre-line' }}>
              {spec.description}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Divider */}
      <Box sx={{ height: '1px', bgcolor: 'rgba(52, 78, 65, 0.3)', my: 3 }} />

    </Box>
  );
}