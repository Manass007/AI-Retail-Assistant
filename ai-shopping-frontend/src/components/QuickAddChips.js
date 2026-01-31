import { Box, Chip, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ProductCard from "./ProductCard";

export function QuickAddChips({ products, onAdd }) {
  if (!products?.length) return null;
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
        Quick add
      </Typography>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        {products.map((p) => (
          <Chip
            key={p._id}
            label={`${p.name} · $${Number(p.price).toFixed(2)}`}
            size="small"
            onClick={() => onAdd?.(p._id)}
            icon={<AddIcon sx={{ fontSize: 16 }} />}
            sx={{ borderRadius: 2 }}
          />
        ))}
      </Box>
    </Box>
  );
}

export function QuickAddProductCards({ products, onAddToCart, small = true }) {
  if (!products?.length) return null;
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
        Add to cart
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 1.5,
          width: "100%",
        }}
      >
        {products.slice(0, small ? 4 : 4).map((p) => (
          <ProductCard
            key={p._id}
            product={p}
            onAddToCart={onAddToCart}
            showAddCart
            compact
            small={small}
          />
        ))}
      </Box>
    </Box>
  );
}
