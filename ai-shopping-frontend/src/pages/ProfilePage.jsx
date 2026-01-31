import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Divider,
  Grid,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../api/auth';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/common/LoadingSpinner';
import SpinWheel from '../components/gamification/SpinWheel';
import CouponCard from '../components/gamification/CouponCard';
import { gamificationAPI } from '../api/gamification';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [spinWheelOpen, setSpinWheelOpen] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    dob: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
      });
      fetchCoupons();
    }
  }, [user]);

  const fetchCoupons = async () => {
    try {
      const response = await gamificationAPI.getMyCoupons();
      if (response.success) {
        setCoupons(response.coupons || []);
      }
    } catch (error) {
      console.error('Failed to fetch coupons:', error);
    }
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const response = await authAPI.updateProfile(formData);
      if (response.success) {
        updateUser(response.user);
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Profile
      </Typography>

      <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Personal Information
        </Typography>
        <Divider sx={{ my: 2 }} />

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Email"
              value={user.email}
              disabled
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Date of Birth"
              type="date"
              value={formData.dob}
              onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
        </Grid>

        <Button
          variant="contained"
          onClick={handleUpdateProfile}
          disabled={loading}
          sx={{ mt: 3 }}
        >
          Update Profile
        </Button>
      </Paper>

      <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Spin the Wheel</Typography>
          <Button
            variant="contained"
            onClick={() => setSpinWheelOpen(true)}
          >
            Spin Now
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Spin the wheel once per month to win discount coupons!
        </Typography>
      </Paper>

      {coupons.length > 0 && (
        <Paper elevation={2} sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom>
            My Coupons
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={2}>
            {coupons.map((coupon) => (
              <Grid item xs={12} sm={6} md={4} key={coupon._id || coupon.code}>
                <CouponCard coupon={coupon} />
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      <SpinWheel
        open={spinWheelOpen}
        onClose={() => {
          setSpinWheelOpen(false);
          fetchCoupons();
        }}
      />
    </Container>
  );
};

export default ProfilePage;
