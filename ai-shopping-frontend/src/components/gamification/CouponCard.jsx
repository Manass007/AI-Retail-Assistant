import { Card, CardContent, Typography, Chip, Box } from '@mui/material';
import { LocalOffer } from '@mui/icons-material';
import { formatDate } from '../../utils/formatters';

const CouponCard = ({ coupon }) => {
  const isExpired = new Date(coupon.expires_at) < new Date();
  const isUsed = coupon.used;

  return (
    <Card
      sx={{
        bgcolor: isExpired || isUsed ? 'grey.200' : 'primary.light',
        color: isExpired || isUsed ? 'text.secondary' : 'white',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <LocalOffer />
          <Typography variant="h6" fontWeight={700}>
            {coupon.discount_percent}% OFF
          </Typography>
        </Box>

        <Typography variant="body2" sx={{ mb: 1, opacity: 0.9 }}>
          Code: <strong>{coupon.code}</strong>
        </Typography>

        <Typography variant="caption" sx={{ display: 'block', mb: 2 }}>
          Valid until {formatDate(coupon.expires_at)}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {isUsed && <Chip label="Used" size="small" color="default" />}
          {isExpired && <Chip label="Expired" size="small" color="error" />}
          {!isUsed && !isExpired && (
            <Chip label="Active" size="small" color="success" />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default CouponCard;
