import React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

// Um componente de Link reutilizável para o footer
const FooterLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link
    href={href}
    underline="none"
    sx={{
      color: '#344E41',
      '&:hover': {
        color: '#3A5A40',
      },
    }}
  >
    {children}
  </Link>
);

// Um componente de Título de Coluna reutilizável
const ColumnTitle = ({ children }: { children: React.ReactNode }) => (
  <Typography
    variant="h6"
    component="strong"
    sx={{
      fontWeight: 'bold',
      color: '#3A5A40',
      textTransform: 'uppercase',
      letterSpacing: '0.05em', // tracking-wide
      fontSize: '0.875rem',
      mb: 1,
    }}
  >
    {children}
  </Typography>
);

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto', // mt-auto
        width: '100%',
        bgcolor: '#DAD7CD', // bg-[#DAD7CD]
        borderTop: '1px solid rgba(52, 78, 65, 0.3)', // border-t border-[#344E41]/30
        px: { xs: 3, sm: 6, md: 12 }, // px-6 md:px-12
        py: { xs: 6, md: 8 }, // py-12
      }}
    >
      <Box sx={{ maxWidth: '1280px', mx: 'auto' }}> {/* max-w-7xl mx-auto */}
        <Grid container spacing={4} sx={{ mb: 6 }}> {/* grid ... gap-8 mb-12 */}
          
          {/* Coluna 1: Sobre */}
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <ColumnTitle>Sobre Nós</ColumnTitle>
              <FooterLink href="/about">A nossa história</FooterLink>
              <FooterLink href="/contact">Contactos</FooterLink>
              <FooterLink href="/careers">Carreiras</FooterLink>
            </Box>
          </Grid>

          {/* Coluna 2: Apoio */}
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <ColumnTitle>Apoio ao Cliente</ColumnTitle>
              <FooterLink href="/faq">FAQ</FooterLink>
              <FooterLink href="/shipping">Envios e Devoluções</FooterLink>
              <FooterLink href="/policy">Política de Privacidade</FooterLink>
            </Box>
          </Grid>

          {/* Coluna 3: Vender */}
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <ColumnTitle>Vender</ColumnTitle>
              <FooterLink href="/sell">Como Vender</FooterLink>
              <FooterLink href="/seller-portal">Portal do Vendedor</FooterLink>
            </Box>
          </Grid>

          {/* Coluna 4: Redes Sociais */}
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <ColumnTitle>Siga-nos</ColumnTitle>
              <FooterLink href="#">Instagram</FooterLink>
              <FooterLink href="#">Facebook</FooterLink>
              <FooterLink href="#">Pinterest</FooterLink>
            </Box>
          </Grid>
        </Grid>

        {/* Linha de Copyright */}
        <Box
          sx={{
            textAlign: 'center',
            color: '#3A5A40',
            fontSize: '0.875rem', // text-sm
            borderTop: '1px solid rgba(52, 78, 65, 0.3)', // border-t
            pt: 4, // pt-8
            mt: 4, // mt-8
          }}
        >
          © {new Date().getFullYear()} madeinportugal.store. Todos os direitos reservados.
        </Box>
      </Box>
    </Box>
  );
}