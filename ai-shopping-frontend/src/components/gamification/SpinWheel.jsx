import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import { gamificationAPI } from '../../api/gamification';
import { toast } from 'react-toastify';

const SPIN_WHEEL_DISCOUNTS = [5, 10, 15, 20, 25, 50];
const COLORS = ['#FF6B35', '#4A90E2', '#27AE60', '#F39C12', '#9B59B6', '#E74C3C'];

const SpinWheel = ({ open, onClose }) => {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [canSpin, setCanSpin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkCanSpin();
  }, [open]);

  const checkCanSpin = async () => {
    try {
      setChecking(true);
      const response = await gamificationAPI.canSpin();
      setCanSpin(response.can_spin || false);
    } catch (error) {
      console.error('Failed to check spin eligibility:', error);
      setCanSpin(false);
    } finally {
      setChecking(false);
    }
  };

  const handleSpin = async () => {
    if (!canSpin || spinning) return;

    setSpinning(true);
    setResult(null);

    try {
      const response = await gamificationAPI.spinWheel();
      if (response.success) {
        // Simulate spinning animation
        setTimeout(() => {
          setResult(response.coupon);
          setSpinning(false);
          setCanSpin(false);
          toast.success(response.message);
        }, 2000);
      }
    } catch (error) {
      setSpinning(false);
      toast.error(error.response?.data?.detail || 'Failed to spin wheel');
    }
  };

  const handleClose = () => {
    if (!spinning) {
      setResult(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Spin the Wheel</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
          {checking ? (
            <CircularProgress />
          ) : !canSpin ? (
            <Typography variant="body1" color="text.secondary" textAlign="center">
              You've already spun this month. Come back next month for another chance!
            </Typography>
          ) : result ? (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary" gutterBottom>
                Congratulations! 🎉
              </Typography>
              <Typography variant="h5" gutterBottom>
                You won {result.discount}% OFF!
              </Typography>
              <Box
                sx={{
                  mt: 3,
                  p: 2,
                  bgcolor: 'primary.light',
                  borderRadius: 2,
                  color: 'white',
                }}
              >
                <Typography variant="body2" gutterBottom>
                  Your Coupon Code:
                </Typography>
                <Typography variant="h6" fontWeight={700}>
                  {result.code}
                </Typography>
                <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                  Valid until {new Date(result.expires_at).toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box sx={{ position: 'relative', width: 300, height: 300 }}>
              {/* Simple wheel visualization */}
              <Box
                sx={{
                  width: 300,
                  height: 300,
                  borderRadius: '50%',
                  border: '4px solid',
                  borderColor: 'primary.main',
                  position: 'relative',
                  overflow: 'hidden',
                  animation: spinning ? 'spin 2s linear' : 'none',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                  },
                }}
              >
                {SPIN_WHEEL_DISCOUNTS.map((discount, index) => {
                  const angle = (360 / SPIN_WHEEL_DISCOUNTS.length) * index;
                  return (
                    <Box
                      key={discount}
                      sx={{
                        position: 'absolute',
                        width: '50%',
                        height: '50%',
                        transformOrigin: '100% 100%',
                        transform: `rotate(${angle}deg)`,
                        clipPath: 'polygon(0 0, 100% 0, 100% 100%)',
                        bgcolor: COLORS[index % COLORS.length],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 600,
                      }}
                    >
                      {discount}%
                    </Box>
                  );
                })}
              </Box>
              <Box
                sx={{
                  position: 'absolute',
                  top: -10,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 0,
                  height: 0,
                  borderLeft: '15px solid transparent',
                  borderRight: '15px solid transparent',
                  borderTop: '20px solid',
                  borderTopColor: 'primary.main',
                }}
              />
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        {result ? (
          <Button onClick={handleClose} variant="contained">
            Close
          </Button>
        ) : (
          <>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              onClick={handleSpin}
              variant="contained"
              disabled={!canSpin || spinning}
            >
              {spinning ? 'Spinning...' : 'Spin Now!'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default SpinWheel;
