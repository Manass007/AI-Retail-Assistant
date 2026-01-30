import { useState } from 'react';
import { Container, Box, Paper, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import OTPForm from '../components/auth/OTPForm';
import { authAPI } from '../api/auth';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSendOTP = async (email) => {
    setLoading(true);
    try {
      const response = await authAPI.sendOTP(email);
      toast.success('OTP sent to your email!');
      return response;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send OTP');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (email, otp) => {
    setLoading(true);
    try {
      const response = await authAPI.verifyOTP(email, otp);
      
      if (response.isNewUser) {
        // New user - redirect to onboarding
        navigate('/onboarding', { state: { email } });
      } else {
        // Existing user - login
        login(response.token, response.user);
        toast.success('Login successful!');
        navigate('/');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid OTP');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography variant="h4" gutterBottom>
            Welcome Back
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Please login to your account
          </Typography>
          <OTPForm
            onSendOTP={handleSendOTP}
            onVerifyOTP={handleVerifyOTP}
            loading={loading}
          />
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage;
