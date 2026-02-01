import { useState } from 'react';
import { Container, Grid, Box, Typography, TextField, Button, Paper } from '@mui/material';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { useCart } from '../contexts/CartContext';
import { PAYMENT_OPTIONS } from '../utils/constants';
import PaymentOptions from '../components/checkout/PaymentOptions';
import OrderSummary from '../components/checkout/OrderSummary';
import { gamificationAPI } from '../api/gamification';

const CheckoutPage = () => {
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_OPTIONS.ONLINE);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const { cartCount, clearCart } = useCart();
  const router = useRouter();

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    setApplyingCoupon(true);
    try {
      const response = await gamificationAPI.useCoupon(couponCode.trim());
      if (response.success) {
        setDiscount(response.discount || 0);
        toast.success(`Coupon applied! ${response.discount}% discount`);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid coupon code');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (cartCount === 0) {
      toast.error('Your cart is empty');
      return;
    }

    // Simulate order placement
    toast.success('Order placed successfully!');
    
    // Clear cart
    await clearCart();
    
    // Redirect to home
    setTimeout(() => {
      navigate('/');
    }, 2000);
  };

  if (cartCount === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Your cart is empty
        </Typography>
        <Button
          variant="contained"
          onClick={() => router.push('/products')}
          sx={{ mt: 2 }}
        >
          Browse Products
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Checkout
      </Typography>

      <Grid container spacing={4} sx={{ mt: 2 }}>
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Payment Method
            </Typography>
            <PaymentOptions
              value={paymentMethod}
              onChange={setPaymentMethod}
            />
          </Paper>

          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Coupon Code
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <TextField
                fullWidth
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                disabled={discount > 0}
              />
              <Button
                variant="outlined"
                onClick={handleApplyCoupon}
                disabled={applyingCoupon || discount > 0}
              >
                {discount > 0 ? 'Applied' : 'Apply'}
              </Button>
            </Box>
            {discount > 0 && (
              <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                {discount}% discount applied!
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <OrderSummary discount={discount} />
          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={handlePlaceOrder}
            sx={{ mt: 2 }}
          >
            Place Order
          </Button>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CheckoutPage;
