import { FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Box, Typography, Paper } from '@mui/material';
import { Payment, Store } from '@mui/icons-material';
import { PAYMENT_OPTIONS } from '../../utils/constants';

const PaymentOptions = ({ value, onChange }) => {
  return (
    <FormControl component="fieldset" fullWidth>
      <FormLabel component="legend" sx={{ mb: 2 }}>
        Payment Method
      </FormLabel>
      <RadioGroup value={value} onChange={(e) => onChange(e.target.value)}>
        <Paper
          elevation={value === PAYMENT_OPTIONS.ONLINE ? 3 : 1}
          sx={{
            p: 2,
            mb: 2,
            border: value === PAYMENT_OPTIONS.ONLINE ? 2 : 1,
            borderColor: value === PAYMENT_OPTIONS.ONLINE ? 'primary.main' : 'divider',
            cursor: 'pointer',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
          onClick={() => onChange(PAYMENT_OPTIONS.ONLINE)}
        >
          <FormControlLabel
            value={PAYMENT_OPTIONS.ONLINE}
            control={<Radio />}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Payment />
                <Box>
                  <Typography variant="body1" fontWeight={600}>
                    Pay Online
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Secure payment via credit/debit card
                  </Typography>
                </Box>
              </Box>
            }
            sx={{ m: 0 }}
          />
        </Paper>

        <Paper
          elevation={value === PAYMENT_OPTIONS.COUNTER ? 3 : 1}
          sx={{
            p: 2,
            border: value === PAYMENT_OPTIONS.COUNTER ? 2 : 1,
            borderColor: value === PAYMENT_OPTIONS.COUNTER ? 'primary.main' : 'divider',
            cursor: 'pointer',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
          onClick={() => onChange(PAYMENT_OPTIONS.COUNTER)}
        >
          <FormControlLabel
            value={PAYMENT_OPTIONS.COUNTER}
            control={<Radio />}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Store />
                <Box>
                  <Typography variant="body1" fontWeight={600}>
                    Pay at Counter
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pay when you pick up from our outlet
                  </Typography>
                </Box>
              </Box>
            }
            sx={{ m: 0 }}
          />
        </Paper>
      </RadioGroup>

      {value === PAYMENT_OPTIONS.COUNTER && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 2 }}>
          <Typography variant="body2">
            <strong>Pickup Location:</strong> 123 Main Street, City, State 12345
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            You can pay at the counter when collecting your order. This saves time and allows you to inspect your items before payment.
          </Typography>
        </Box>
      )}

      {value === PAYMENT_OPTIONS.ONLINE && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 2 }}>
          <Typography variant="body2">
            You will be redirected to a secure payment gateway to complete your purchase.
          </Typography>
        </Box>
      )}
    </FormControl>
  );
};

export default PaymentOptions;
