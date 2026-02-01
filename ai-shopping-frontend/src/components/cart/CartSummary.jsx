import { Paper, Box, Typography, Divider, Button } from '@mui/material';
import { formatPrice } from '../../utils/formatters';
import { useRouter } from 'next/router';

const CartSummary = ({ totalAmount, cartCount }) => {
  const router = useRouter();

  return (
    <Paper elevation={2} sx={{ p: 3, position: 'sticky', top: 20 }}>
      <Typography variant="h6" gutterBottom>
        Order Summary
      </Typography>
      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body1">Items ({cartCount})</Typography>
        <Typography variant="body1">{formatPrice(totalAmount)}</Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Shipping
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Free
        </Typography>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6">Total</Typography>
        <Typography variant="h6" color="primary">
          {formatPrice(totalAmount)}
        </Typography>
      </Box>

      <Button
        variant="contained"
        fullWidth
        size="large"
        onClick={() => router.push('/checkout')}
        disabled={cartCount === 0}
      >
        Proceed to Checkout
      </Button>
    </Paper>
  );
};

export default CartSummary;
