import { useEffect, useState } from 'react';
import { Container, Box, Typography } from '@mui/material';
import { recommendationsAPI } from '../api/recommendations';
import ProductGrid from '../components/product/ProductGrid';
import CartRecoveryBanner from '../components/cart/CartRecoveryBanner';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

const HomePage = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    fetchRecommendations();
  }, [isAuthenticated]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await recommendationsAPI.getRecommendations(8);
      if (response.success) {
        setRecommendations(response.products || []);
        setReason(response.reason || 'Recommended for you');
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {isAuthenticated && <CartRecoveryBanner />}

      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" gutterBottom>
          {isAuthenticated ? 'Recommended for You' : 'Featured Products'}
        </Typography>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <ProductGrid
            products={recommendations}
            title=""
            reason={reason}
          />
        )}
      </Box>
    </Container>
  );
};

export default HomePage;
