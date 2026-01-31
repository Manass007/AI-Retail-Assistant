import { useState } from 'react';
import { Box, Typography, Chip, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Button, Stepper, Step, StepLabel } from '@mui/material';
import { CATEGORIES, BUDGET_OPTIONS } from '../../utils/constants';

const PreferencesForm = ({ onSubmit, onBack }) => {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [budget, setBudget] = useState('mid');

  const handleCategoryToggle = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleSubmit = () => {
    onSubmit({
      categories: selectedCategories,
      budget,
    });
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 600 }}>
      <Stepper activeStep={0} sx={{ mb: 4 }}>
        <Step>
          <StepLabel>Set your Interests</StepLabel>
        </Step>
        <Step>
          <StepLabel>Customize your Profile</StepLabel>
        </Step>
      </Stepper>

      <Typography variant="h5" gutterBottom>
        Choose your interests
      </Typography>

      <Box sx={{ mt: 3, mb: 4 }}>
        <FormLabel sx={{ mb: 2, display: 'block' }}>Categories</FormLabel>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {CATEGORIES.map((category) => (
            <Chip
              key={category}
              label={category}
              onClick={() => handleCategoryToggle(category)}
              color={selectedCategories.includes(category) ? 'primary' : 'default'}
              variant={selectedCategories.includes(category) ? 'filled' : 'outlined'}
              sx={{ cursor: 'pointer' }}
            />
          ))}
        </Box>
      </Box>

      <Box sx={{ mt: 3, mb: 4 }}>
        <FormControl component="fieldset">
          <FormLabel component="legend">Budget Range</FormLabel>
          <RadioGroup
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            sx={{ mt: 1 }}
          >
            {BUDGET_OPTIONS.map((option) => (
              <FormControlLabel
                key={option.value}
                value={option.value}
                control={<Radio />}
                label={option.label}
              />
            ))}
          </RadioGroup>
        </FormControl>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
        {onBack && (
          <Button variant="outlined" onClick={onBack} sx={{ flex: 1 }}>
            Back
          </Button>
        )}
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={selectedCategories.length === 0}
          sx={{ flex: 1 }}
        >
          Next
        </Button>
      </Box>
    </Box>
  );
};

export default PreferencesForm;
