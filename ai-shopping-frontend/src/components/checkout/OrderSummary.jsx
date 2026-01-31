import { Paper, Box, Typography, Divider, List, ListItem, ListItemText } from '@mui/material';
import { formatPrice } from '../../utils/formatters';
import { useCart } from '../../contexts/CartContext';

const OrderSummary = ({ discount = 0 }) => {
  const { cartItems, totalAmount } = useCart();

  const subtotal = totalAmount;
  const discountAmount = (subtotal * discount) / 100;
  const finalTotal = subtotal - discountAmount;

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Order Summary
      </Typography>
      <Divider sx={{ my: 2 }} />

      <List>
        {cartItems.map((item) => (
          <ListItem key={item.product._id || item.product.id} sx={{ px: 0 }}>
            <ListItemText
              primary={item.product.name}
              secondary={`Qty: ${item.quantity}`}
            />
            <Typography variant="body2">
              {formatPrice(item.product.price * item.quantity)}
            </Typography>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body1">Subtotal</Typography>
        <Typography variant="body1">{formatPrice(subtotal)}</Typography>
      </Box>

      {discount > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="success.main">
            Discount ({discount}%)
          </Typography>
          <Typography variant="body2" color="success.main">
            -{formatPrice(discountAmount)}
          </Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Shipping
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Free
        </Typography>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h6">Total</Typography>
        <Typography variant="h6" color="primary">
          {formatPrice(finalTotal)}
        </Typography>
      </Box>
    </Paper>
  );
};

export default OrderSummary;
