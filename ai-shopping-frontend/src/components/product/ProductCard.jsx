import { Card, CardMedia, CardContent, CardActions, Typography, Button, Chip, Box } from '@mui/material';
import { ShoppingCart } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { formatPrice } from '../../utils/formatters';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

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

  const handleCardClick = () => {
    navigate(`/products/${product._id || product.id}`);
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
        },
      }}
      onClick={handleCardClick}
    >
      <CardMedia
        component="img"
        height="200"
        image={product.image_url || '/placeholder-image.jpg'}
        alt={product.name}
        sx={{ objectFit: 'cover' }}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" component="h3" noWrap>
          {product.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {product.brand || product.category}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
          <Typography variant="h6" color="primary">
            {formatPrice(product.price)}
          </Typography>
          {!product.is_in_stock && (
            <Chip label="Out of Stock" size="small" color="error" />
          )}
        </Box>
      </CardContent>
      <CardActions>
        <Button
          fullWidth
          variant="contained"
          startIcon={<ShoppingCart />}
          onClick={(e) => {
            e.stopPropagation();
            handleAddToCart();
          }}
          disabled={!product.is_in_stock}
        >
          {product.is_in_stock ? 'Add to Cart' : 'Out of Stock'}
        </Button>
      </CardActions>
    </Card>
  );
};

export default ProductCard;
