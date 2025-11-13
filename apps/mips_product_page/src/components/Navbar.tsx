import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link'; // Usamos o Link do MUI
import Typography from '@mui/material/Typography';

// O Ícone SVG (copiado diretamente, está perfeito)
const HamburgerIcon = () => (
  <svg
    className="w-8 h-8 text-[#344E41]" // O className aqui funciona porque o SVG o trata
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: 32, height: 32, color: '#344E41' }} // Adicionado style para garantir
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6h16M4 12h16M4 18h16"
    />
  </svg>
);

// 1. Dados "dummy" para o utilizador (substituindo o Prisma)
const dummyUser = {
  first_name: 'Diddy',
  photo_url: '/default-avatar.png', // Assumindo que tem um avatar default
};

export default function Navbar() {
  const user = dummyUser; // Usamos o utilizador dummy

  return (
    <Box
      component="nav"
      // 2. Estilos Tailwind "traduzidos" para 'sx' do MUI
      sx={{
        bgcolor: '#DAD7CD',
        borderTop: '1px solid rgba(52, 78, 65, 0.3)',
        borderBottom: '1px solid rgba(52, 78, 65, 0.3)',
        px: { xs: 2, sm: 3 }, // px-4 sm:px-6
        py: 2,
      }}
    >
      <Box
        sx={{
          display: 'grid',
          // 3. Usamos '1fr auto 1fr' para centrar o logo perfeitamente
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          width: '100%',
        }}
      >
        {/* 1. Esquerda: Ícone Hamburger */}
        <Box sx={{ justifySelf: 'start' }}>
          <Button
            sx={{
              p: 0.5, // p-1
              minWidth: 0,
              borderRadius: '6px', // rounded-md
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.1)', // hover:bg-black/10
              },
            }}
            aria-label="Toggle menu"
          >
            <HamburgerIcon />
          </Button>
        </Box>

        {/* 2. Centro: Logo (usando MUI Link e Typography) */}
        <Box sx={{ justifySelf: 'center' }}>
          <Link
            href="/"
            underline="none" // Remover sublinhado
            sx={{
              fontSize: { xs: '1.5rem', sm: '1.875rem' }, // text-2xl sm:text-3xl
              fontWeight: 'bold',
              fontStyle: 'italic',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'baseline',
            }}
          >
            {/* 4. Spans traduzidos para Typography com 'sx' para cor */}
            <Typography component="span" sx={{ color: '#DC2626' }}>{/* text-red-600 */}
              made
            </Typography>
            <Typography component="span" sx={{ color: '#D97706' }}>{/* text-yellow-500 */}
              in
            </Typography>
            <Typography component="span" sx={{ color: '#65A30D' }}>{/* text-lime-600 */}
              portugal
            </Typography>
            <Typography
              component="span"
              sx={{
                color: '#4B5563', // text-gray-600
                fontSize: { xs: '1.25rem', sm: '1.5rem' }, // text-xl sm:text-2xl
                fontWeight: 'normal',
                fontStyle: 'normal', // Resetar o itálico
              }}
            >
              .store
            </Typography>
          </Link>
        </Box>

        {/* 3. Direita: Ícone de Perfil (usando MUI Link e Box como <img>) */}
        <Box sx={{ justifySelf: 'end' }}>
          <Link href="/profile">
            {/* 5. Next/Image traduzido para um Box com 'img' e 'sx' */}
            <Box
              component="img"
              src={user?.photo_url || '/default-avatar.png'}
              alt={user?.first_name || 'User profile picture'}
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%', // rounded-full
                border: '1px solid #344E41', // border border-[#344E41]
                objectFit: 'cover', // object-cover
                aspectRatio: '1 / 1', // aspect-square
              }}
            />
          </Link>
        </Box>
      </Box>
    </Box>
  );
}