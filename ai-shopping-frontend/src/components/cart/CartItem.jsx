import { Box, Typography, IconButton, TextField, Paper, Divider } from '@mui/material';
import { Delete, Add, Remove } from '@mui/icons-material';
import { formatPrice, formatDaysAgo } from '../../utils/formatters';
import { useCart } from '../../contexts/CartContext';
import { toast } from 'react-toastify';

const CartItem = ({ item }) => {
  const { updateCartItem, removeFromCart } = useCart();
  const product = item.product;
  const quantity = item.quantity;

  const handleQuantityChange = async (newQuantity) => {
    if (newQuantity < 1) {
      return;
    }
    if (newQuantity > 10) {
      toast.warning('Maximum quantity is 10');
      return;
    }

    const result = await updateCartItem(product._id || product.id, newQuantity);
    if (!result.success) {
      toast.error(result.error || 'Failed to update quantity');
    }
  };

  const handleRemove = async () => {
    const result = await removeFromCart(product._id || product.id);
    if (!result.success) {
      toast.error(result.error || 'Failed to remove item');
    } else {
      toast.success('Item removed from cart');
    }
  };

  return (
    <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Box
          component="img"
          src={product.image_url || '/placeholder-image.jpg'}
          alt={product.name}
          sx={{
            width: 100,
            height: 100,
            objectFit: 'cover',
            borderRadius: 2,
          }}
        />

        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" gutterBottom>
            {product.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {product.brand || product.category}
          </Typography>
          {item.days_in_cart > 0 && (
            <Typography variant="caption" color="text.secondary">
              Added {formatDaysAgo(item.added_at)}
            </Typography>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                size="small"
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1}
              >
                <Remove />
              </IconButton>
              <TextField
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  handleQuantityChange(val);
                }}
                inputProps={{
                  min: 1,
                  max: 10,
                  style: { textAlign: 'center', width: 50 },
                }}
                type="number"
                size="small"
              />
              <IconButton
                size="small"
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={quantity >= 10}
              >
                <Add />
              </IconButton>
            </Box>

            <Typography variant="h6" color="primary" sx={{ flexGrow: 1 }}>
              {formatPrice(product.price * quantity)}
            </Typography>

            <IconButton
              color="error"
              onClick={handleRemove}
              aria-label="remove"
            >
              <Delete />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default CartItem;
