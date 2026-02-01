import { useState } from 'react';
import { Container, Box, Paper } from '@mui/material';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import PreferencesForm from '../components/auth/PreferencesForm';
import DOBForm from '../components/auth/DOBForm';
import { authAPI } from '../api/auth';
import { useAuth } from '../contexts/AuthContext';

const OnboardingPage = () => {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const email = router.query.email || '';

  const handlePreferencesSubmit = (prefs) => {
    setPreferences(prefs);
    setStep(1);
  };

  const handleDOBSubmit = async (userData) => {
    setLoading(true);
    try {
      const response = await authAPI.register({
        email,
        ...userData,
        preferences,
      });

      if (response.success) {
        login(response.token, response.user);
        toast.success('Registration successful!');
        router.replace('/');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
          }}
        >
          {step === 0 ? (
            <PreferencesForm
              onSubmit={handlePreferencesSubmit}
            />
          ) : (
            <DOBForm
              onSubmit={handleDOBSubmit}
              onBack={() => setStep(0)}
            />
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default OnboardingPage;
