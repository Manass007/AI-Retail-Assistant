import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Box,
  Typography,
  Button,
  Chip,
  Paper,
  Divider,
} from '@mui/material';
import { ShoppingCart, ArrowBack } from '@mui/icons-material';
import { productsAPI } from '../api/products';
import { recommendationsAPI } from '../api/recommendations';
import { formatPrice } from '../utils/formatters';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ProductGrid from '../components/product/ProductGrid';
import NotifyMeButton from '../components/product/NotifyMeButton';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    fetchProduct();
    fetchSimilarProducts();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getProduct(id);
      if (response.success) {
        setProduct(response.product);
        // Track view for recommendations
        if (isAuthenticated) {
          await recommendationsAPI.trackView(id);
        }
      }
    } catch (error) {
      toast.error('Failed to load product');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const fetchSimilarProducts = async () => {
    try {
      const response = await recommendationsAPI.getSimilar(id);
      if (response.success) {
        setSimilarProducts(response.products || []);
      }
    } catch (error) {
      console.error('Failed to load similar products:', error);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.info('Please login to add items to cart');
      navigate('/login');
      return;
    }

    const result = await addToCart(product._id || product.id, 1);
    if (result.success) {
      toast.success('Added to cart!');
    } else {
      toast.error(result.error || 'Failed to add to cart');
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!product) {
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(-1)}
        sx={{ mb: 3 }}
      >
        Back
      </Button>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 2,
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box
              component="img"
              src={product.image_url || '/placeholder-image.jpg'}
              alt={product.name}
              sx={{
                maxWidth: '100%',
                maxHeight: '500px',
                objectFit: 'contain',
              }}
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box>
            <Typography variant="h4" gutterBottom>
              {product.name}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              {product.brand || product.category}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 3 }}>
              <Typography variant="h4" color="primary">
                {formatPrice(product.price)}
              </Typography>
              {!product.is_in_stock && (
                <Chip label="Out of Stock" color="error" />
              )}
              {product.is_in_stock && (
                <Chip label="In Stock" color="success" />
              )}
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Description
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {product.description || 'No description available.'}
            </Typography>

            {product.tags && product.tags.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, my: 2 }}>
                {product.tags.map((tag) => (
                  <Chip key={tag} label={tag} size="small" />
                ))}
              </Box>
            )}

            <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
              {product.is_in_stock ? (
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<ShoppingCart />}
                  onClick={handleAddToCart}
                  fullWidth
                >
                  Add to Cart
                </Button>
              ) : (
                <NotifyMeButton productId={product._id || product.id} />
              )}
            </Box>
          </Box>
        </Grid>
      </Grid>

      {similarProducts.length > 0 && (
        <Box sx={{ mt: 6 }}>
          <Typography variant="h5" gutterBottom>
            Similar Products
          </Typography>
          <ProductGrid products={similarProducts} />
        </Box>
      )}
    </Container>
  );
};

export default ProductDetailPage;
