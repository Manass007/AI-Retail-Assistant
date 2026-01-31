import { Grid, Box, Typography } from '@mui/material';
import ProductCard from './ProductCard';
import LoadingSpinner from '../common/LoadingSpinner';

const ProductGrid = ({ products, loading, title, reason }) => {
  if (loading) {
    return <LoadingSpinner />;
  }

  if (!products || products.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          No products found
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {title && (
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          {title}
        </Typography>
      )}
      {reason && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {reason}
        </Typography>
      )}
      <Grid container spacing={3}>
        {products.map((product) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={product._id || product.id}>
            <ProductCard product={product} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ProductGrid;
