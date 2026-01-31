import { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, IconButton, Badge, Box } from '@mui/material';
import { ShoppingCart, AccountCircle, Logout, Casino } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import SpinWheel from '../gamification/SpinWheel';

const Header = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const { cartCount } = useCart();
  const [spinWheelOpen, setSpinWheelOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppBar position="static" elevation={0} sx={{ bgcolor: 'background.paper', color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider' }}>
      <Toolbar>
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, cursor: 'pointer', fontWeight: 700 }}
          onClick={() => navigate('/')}
        >
          AI Retail Assistant
        </Typography>

        {isAuthenticated ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              color="inherit"
              onClick={() => navigate('/products')}
              sx={{ textTransform: 'none' }}
            >
              Products
            </Button>
            <IconButton
              color="inherit"
              onClick={() => setSpinWheelOpen(true)}
              title="Spin the Wheel"
            >
              <Casino />
            </IconButton>
            <IconButton
              color="inherit"
              onClick={() => navigate('/cart')}
            >
              <Badge badgeContent={cartCount} color="primary">
                <ShoppingCart />
              </Badge>
            </IconButton>
            <IconButton
              color="inherit"
              onClick={() => navigate('/profile')}
            >
              <AccountCircle />
            </IconButton>
            <Button
              color="inherit"
              startIcon={<Logout />}
              onClick={handleLogout}
              sx={{ textTransform: 'none' }}
            >
              Logout
            </Button>
          </Box>
        ) : (
          <Button
            color="inherit"
            onClick={() => navigate('/login')}
            sx={{ textTransform: 'none' }}
          >
            Login
          </Button>
        )}
      </Toolbar>
      {isAuthenticated && (
        <SpinWheel
          open={spinWheelOpen}
          onClose={() => setSpinWheelOpen(false)}
        />
      )}
    </AppBar>
  );
};

export default Header;
