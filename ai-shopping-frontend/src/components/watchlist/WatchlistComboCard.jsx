import { Box, Typography, Button, Paper, Chip } from "@mui/material";
import { ShoppingCart, LocalOffer } from "@mui/icons-material";
import { useRouter } from "next/router";
import { cart as cartApi } from "@/lib/api";

export default function WatchlistComboCard({ suggestion, onAddToCart }) {
  const router = useRouter();
  const { watchlist_product, current_product, combo_type, original_total, combo_total, savings, savings_percent, message, value_add } = suggestion || {};

  if (!watchlist_product || !current_product) return null;

  const handleAddCombo = async (e) => {
    e.stopPropagation();
    try {
      // Add both products to cart
      await cartApi.add(watchlist_product._id, 1);
      await cartApi.add(current_product._id, 1);
      if (onAddToCart) {
        onAddToCart();
      }
      router.push("/cart");
    } catch (error) {
      console.error("Failed to add combo to cart:", error);
    }
  };

  const placeholderSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='240' viewBox='0 0 400 240'%3E%3Crect fill='%23f0f0f0' width='400' height='240'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14'%3ENo image%3C/text%3E%3C/svg%3E";

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        bgcolor: "background.paper",
        "&:hover": {
          boxShadow: 2,
          borderColor: "primary.main",
        },
        transition: "all 0.2s",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
        <LocalOffer sx={{ color: "primary.main", fontSize: 20 }} />
        <Typography variant="subtitle2" fontWeight={600} color="primary.main">
          {message || "Complete the combo and save more"}
        </Typography>
      </Box>

      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        {/* Current Product */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Box
            component="img"
            src={current_product.image_url || placeholderSvg}
            alt={current_product.name}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = placeholderSvg;
            }}
            sx={{
              width: "100%",
              maxWidth: 80,
              height: 80,
              objectFit: "cover",
              borderRadius: 1,
              bgcolor: "grey.100",
            }}
          />
          <Typography variant="caption" textAlign="center" noWrap sx={{ maxWidth: "100%" }}>
            {current_product.name}
          </Typography>
          <Typography variant="body2" fontWeight={600}>
            ${Number(current_product.price).toFixed(2)}
          </Typography>
        </Box>

        {/* Plus Icon */}
        <Box sx={{ display: "flex", alignItems: "center", color: "text.secondary" }}>
          <Typography variant="h6">+</Typography>
        </Box>

        {/* Watchlist Product */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Box
            sx={{
              position: "relative",
              width: "100%",
              maxWidth: 80,
            }}
          >
            <Box
              component="img"
              src={watchlist_product.image_url || placeholderSvg}
              alt={watchlist_product.name}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = placeholderSvg;
              }}
              sx={{
                width: "100%",
                height: 80,
                objectFit: "cover",
                borderRadius: 1,
                bgcolor: "grey.100",
              }}
            />
            <Chip
              label="From Watchlist"
              size="small"
              sx={{
                position: "absolute",
                top: 4,
                right: 4,
                fontSize: "0.65rem",
                height: 18,
                bgcolor: "primary.main",
                color: "white",
              }}
            />
          </Box>
          <Typography variant="caption" textAlign="center" noWrap sx={{ maxWidth: "100%" }}>
            {watchlist_product.name}
          </Typography>
          <Typography variant="body2" fontWeight={600}>
            ${Number(watchlist_product.price).toFixed(2)}
          </Typography>
        </Box>
      </Box>

      {/* Pricing Info */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: 1.5,
          bgcolor: "success.light",
          borderRadius: 1,
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="caption" color="text.secondary">
            Original Total
          </Typography>
          <Typography
            variant="body2"
            sx={{
              textDecoration: "line-through",
              color: "text.secondary",
            }}
          >
            ${Number(original_total).toFixed(2)}
          </Typography>
        </Box>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="caption" color="text.secondary">
            Combo Price
          </Typography>
          <Typography variant="h6" color="success.main" fontWeight={700}>
            ${Number(combo_total).toFixed(2)}
          </Typography>
        </Box>
        <Box sx={{ textAlign: "right" }}>
          <Typography variant="caption" color="text.secondary">
            You Save
          </Typography>
          <Typography variant="body1" color="success.main" fontWeight={700}>
            ${Number(savings).toFixed(2)}
            {combo_type === "percentage" && ` (${savings_percent}%)`}
          </Typography>
        </Box>
      </Box>

      {value_add && (
        <Box sx={{ mb: 2 }}>
          <Chip
            label={value_add}
            size="small"
            sx={{
              bgcolor: "info.light",
              color: "info.contrastText",
            }}
          />
        </Box>
      )}

      <Button
        fullWidth
        variant="contained"
        startIcon={<ShoppingCart />}
        onClick={handleAddCombo}
        sx={{
          borderRadius: 2,
          py: 1,
          textTransform: "none",
          fontWeight: 600,
        }}
      >
        Add Combo to Cart
      </Button>
    </Paper>
  );
}
