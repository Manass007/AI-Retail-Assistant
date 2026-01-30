import { useState } from 'react';
import { TextField, Button, Box, Typography, Stepper, Step, StepLabel } from '@mui/material';

const DOBForm = ({ onSubmit, onBack }) => {
  const [dob, setDob] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState({});

  const handleSubmit = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!dob) newErrors.dob = 'Date of birth is required';

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSubmit({
        name: name.trim(),
        phone: phone.trim() || '',
        dob,
      });
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 600 }}>
      <Stepper activeStep={1} sx={{ mb: 4 }}>
        <Step>
          <StepLabel>Set your Interests</StepLabel>
        </Step>
        <Step>
          <StepLabel>Customize your Profile</StepLabel>
        </Step>
      </Stepper>

      <Typography variant="h5" gutterBottom>
        Complete your profile
      </Typography>

      <TextField
        fullWidth
        label="Full Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={!!errors.name}
        helperText={errors.name}
        margin="normal"
        required
      />

      <TextField
        fullWidth
        label="Phone Number (Optional)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        margin="normal"
      />

      <TextField
        fullWidth
        label="Date of Birth"
        type="date"
        value={dob}
        onChange={(e) => setDob(e.target.value)}
        error={!!errors.dob}
        helperText={errors.dob}
        margin="normal"
        required
        InputLabelProps={{
          shrink: true,
        }}
        inputProps={{
          max: new Date().toISOString().split('T')[0],
        }}
      />

      <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
        {onBack && (
          <Button variant="outlined" onClick={onBack} sx={{ flex: 1 }}>
            Back
          </Button>
        )}
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!name || !dob}
          sx={{ flex: 1 }}
        >
          Complete Registration
        </Button>
      </Box>
    </Box>
  );
};

export default DOBForm;
