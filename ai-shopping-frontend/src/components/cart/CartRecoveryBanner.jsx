import { useEffect, useState } from 'react';
import { Box, Typography, Paper, Button, IconButton } from '@mui/material';
import { Close, ShoppingCart } from '@mui/icons-material';
import { cartAPI } from '../../api/cart';
import { useCart } from '../../contexts/CartContext';
import { toast } from 'react-toastify';
import ProductCard from '../product/ProductCard';
import LoadingSpinner from '../common/LoadingSpinner';

const CartRecoveryBanner = () => {
  const [recoveryProducts, setRecoveryProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchRecoveryItems();
  }, []);

  const fetchRecoveryItems = async () => {
    try {
      setLoading(true);
      const response = await cartAPI.getCartRecovery();
      if (response.success && response.products && response.products.length > 0) {
        setRecoveryProducts(response.products);
      }
    } catch (error) {
      console.error('Failed to fetch recovery items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (productId) => {
    const result = await addToCart(productId, 1);
    if (result.success) {
      toast.success('Added to cart!');
      // Remove from recovery list
      setRecoveryProducts((prev) => prev.filter((p) => (p._id || p.id) !== productId));
    } else {
      toast.error(result.error || 'Failed to add to cart');
    }
  };

  if (loading || dismissed || recoveryProducts.length === 0) {
    return null;
  }

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        mb: 4,
        bgcolor: 'primary.light',
        color: 'white',
        position: 'relative',
      }}
    >
      <IconButton
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          color: 'white',
        }}
        onClick={() => setDismissed(true)}
        size="small"
      >
        <Close />
      </IconButton>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <ShoppingCart />
        <Typography variant="h6" fontWeight={600}>
          You left something! ✨
        </Typography>
      </Box>

      <Typography variant="body2" sx={{ mb: 3, opacity: 0.9 }}>
        These items were in your cart 15+ days ago. Add them back to complete your purchase!
      </Typography>

      <Box
        sx={{
          display: 'flex',
          gap: 2,
          overflowX: 'auto',
          pb: 1,
          '&::-webkit-scrollbar': {
            height: 8,
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'rgba(255,255,255,0.3)',
            borderRadius: 4,
          },
        }}
      >
        {recoveryProducts.map((product) => (
          <Box
            key={product._id || product.id}
            sx={{
              minWidth: 200,
              maxWidth: 200,
              bgcolor: 'white',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <Box
              component="img"
              src={product.image_url || '/placeholder-image.jpg'}
              alt={product.name}
              sx={{
                width: '100%',
                height: 150,
                objectFit: 'cover',
              }}
            />
            <Box sx={{ p: 1.5 }}>
              <Typography
                variant="body2"
                fontWeight={600}
                noWrap
                sx={{ mb: 0.5 }}
              >
                {product.name}
              </Typography>
              <Typography variant="body2" color="primary" fontWeight={600} sx={{ mb: 1 }}>
                ${product.price}
              </Typography>
              <Button
                fullWidth
                variant="contained"
                size="small"
                onClick={() => handleAddToCart(product._id || product.id)}
                sx={{ textTransform: 'none' }}
              >
                Add to Cart
              </Button>
            </Box>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default CartRecoveryBanner;
