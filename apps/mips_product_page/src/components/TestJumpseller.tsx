import { useJumpsellerProducts } from '../hooks/useJumpsellerProducts';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

export default function TestJumpseller() {
  const { products, loading, error } = useJumpsellerProducts();

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">Error: {error.message}</Typography>;

  return (
    <Box>
      <Typography variant="h4">Products from Jumpseller:</Typography>
      {products.map(product => (
        <Box key={product.id} sx={{ p: 2, border: '1px solid #ccc', mb: 2 }}>
          <Typography variant="h6">{product.name}</Typography>
          <Typography>Price: {product.price}€</Typography>
          <Typography>Stock: {product.stock}</Typography>
        </Box>
      ))}
    </Box>
  );
}