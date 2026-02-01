import { useState } from 'react';
import { Button } from '@mui/material';
import { Notifications } from '@mui/icons-material';
import { productsAPI } from '../../api/products';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';

const NotifyMeButton = ({ productId }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const { isAuthenticated } = useAuth();

  const handleNotifyMe = async () => {
    if (!isAuthenticated) {
      toast.info('Please login to get notified');
      router.push('/login');
      return;
    }

    setLoading(true);
    try {
      const response = await productsAPI.notifyMe(productId);
      if (response.success) {
        setSubscribed(true);
        toast.success('You will be notified when this product is back in stock!');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to subscribe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outlined"
      startIcon={<Notifications />}
      onClick={handleNotifyMe}
      disabled={loading || subscribed}
      fullWidth
    >
      {subscribed ? 'Notification Requested' : 'Notify Me When In Stock'}
    </Button>
  );
};

export default NotifyMeButton;
