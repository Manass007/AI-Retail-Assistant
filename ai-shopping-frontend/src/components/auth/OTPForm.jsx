import { useState } from 'react';
import { TextField, Button, Box, Typography } from '@mui/material';
import { validateEmail, validateOTP } from '../../utils/validators';

const OTPForm = ({ onSendOTP, onVerifyOTP, loading }) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSendOTP = async () => {
    const emailError = !validateEmail(email) ? 'Please enter a valid email' : '';
    setErrors({ email: emailError });

    if (!emailError) {
      try {
        const response = await onSendOTP(email);
        if (response.success) {
          setOtpSent(true);
        }
      } catch (error) {
        setErrors({ email: error.response?.data?.detail || 'Failed to send OTP' });
      }
    }
  };

  const handleVerifyOTP = async () => {
    const otpError = !validateOTP(otp) ? 'Please enter a valid 6-digit OTP' : '';
    setErrors({ otp: otpError });

    if (!otpError) {
      try {
        await onVerifyOTP(email, otp);
      } catch (error) {
        setErrors({ otp: error.response?.data?.detail || 'Invalid OTP' });
      }
    }
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    if (value.length === 6) {
      // Auto-verify when 6 digits entered
      setTimeout(() => handleVerifyOTP(), 100);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 400 }}>
      {!otpSent ? (
        <>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!errors.email}
            helperText={errors.email}
            margin="normal"
            disabled={loading}
          />
          <Button
            fullWidth
            variant="contained"
            onClick={handleSendOTP}
            disabled={loading || !email}
            sx={{ mt: 2 }}
          >
            Send OTP
          </Button>
        </>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            OTP sent to {email}
          </Typography>
          <TextField
            fullWidth
            label="Enter OTP"
            value={otp}
            onChange={handleOtpChange}
            error={!!errors.otp}
            helperText={errors.otp || 'Enter the 6-digit code sent to your email'}
            margin="normal"
            inputProps={{ maxLength: 6, inputMode: 'numeric' }}
            disabled={loading}
            autoFocus
          />
          <Button
            fullWidth
            variant="contained"
            onClick={handleVerifyOTP}
            disabled={loading || otp.length !== 6}
            sx={{ mt: 2 }}
          >
            Verify OTP
          </Button>
          <Button
            fullWidth
            variant="text"
            onClick={() => {
              setOtpSent(false);
              setOtp('');
              setErrors({});
            }}
            sx={{ mt: 1 }}
          >
            Change Email
          </Button>
        </>
      )}
    </Box>
  );
};

export default OTPForm;
