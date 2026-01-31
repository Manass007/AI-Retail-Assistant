import { Container, Grid, Box, Typography, Button } from '@mui/material';
import { ShoppingCart } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import CartItem from '../components/cart/CartItem';
import CartSummary from '../components/cart/CartSummary';
import LoadingSpinner from '../components/common/LoadingSpinner';

const CartPage = () => {
  const { cartItems, cartCount, totalAmount, loading } = useCart();
  const navigate = useNavigate();

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (cartCount === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <ShoppingCart sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Your cart is empty
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Start shopping to add items to your cart
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/products')}
        >
          Browse Products
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Shopping Cart
      </Typography>

      <Grid container spacing={4} sx={{ mt: 2 }}>
        <Grid item xs={12} md={8}>
          {cartItems.map((item) => (
            <CartItem key={item.product._id || item.product.id} item={item} />
          ))}
        </Grid>

        <Grid item xs={12} md={4}>
          <CartSummary totalAmount={totalAmount} cartCount={cartCount} />
        </Grid>
      </Grid>
    </Container>
  );
};

export default CartPage;
