import { Card, CardContent, CardMedia, Typography, IconButton, Box } from "@mui/material";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { useRouter } from "next/router";

export default function ProductCard({
  product,
  onAddToCart,
  onQuantityChange,
  onWishlist,
  showAddCart = true,
  compact = false,
  small = false,
  cartQuantity = 0,
}) {
  const router = useRouter();
  const { _id, name, price, image_url, category, brand } = product || {};
  const inCart = cartQuantity > 0;
  const isSmall = small || compact;
  const placeholderSvg =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='240' viewBox='0 0 400 240'%3E%3Crect fill='%23f0f0f0' width='400' height='240'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14'%3ENo image%3C/text%3E%3C/svg%3E";

  const handleClick = () => router.push(`/product/${_id}`);

  const handleAdd = (e) => {
    e.stopPropagation();
    if (inCart && onQuantityChange) onQuantityChange(_id, cartQuantity + 1);
    else if (onAddToCart) onAddToCart(_id);
  };

  const handleMinus = (e) => {
    e.stopPropagation();
    if (inCart && onQuantityChange && cartQuantity > 1) onQuantityChange(_id, cartQuantity - 1);
    else if (inCart && onQuantityChange) onQuantityChange(_id, 0);
  };

  return (
    <Card
      elevation={0}
      sx={{
        cursor: "pointer",
        "&:hover": { boxShadow: 1 },
        height: compact ? "auto" : "100%",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        minHeight: compact ? undefined : 220,
      }}
      onClick={handleClick}
    >
      {/* Fixed aspect image area so broken images don't collapse the card */}
      <Box
        sx={{
          position: "relative",
          pt: isSmall ? "52%" : "56%",
          minHeight: isSmall ? 100 : 140,
          flexShrink: 0,
          overflow: "hidden",
          bgcolor: "grey.100",
        }}
      >
        <CardMedia
          component="img"
          image={image_url || placeholderSvg}
          alt={name}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = placeholderSvg;
          }}
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        {onWishlist && (
          <IconButton
            size="small"
            sx={{ position: "absolute", top: 8, right: 8, bgcolor: "rgba(255,255,255,0.9)" }}
            onClick={(e) => {
              e.stopPropagation();
              onWishlist(product);
            }}
          >
            <FavoriteBorderIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
      <CardContent sx={{ flexGrow: 1, py: isSmall ? 0.75 : 1.5, "&:last-child": { pb: isSmall ? 0.75 : 1.5 } }}>
        <Typography variant={isSmall ? "caption" : "body2"} color="text.secondary" noWrap>
          {brand || category}
        </Typography>
        <Typography variant={isSmall ? "body2" : "body1"} fontWeight={600} noWrap sx={{ fontSize: isSmall ? "0.75rem" : undefined }}>
          {name}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 0.5 }}>
          <Typography variant={isSmall ? "body2" : "body1"} fontWeight={700} sx={{ fontSize: isSmall ? "0.75rem" : undefined }}>
            ${Number(price).toFixed(2)}
          </Typography>
          {showAddCart && (onAddToCart || onQuantityChange) && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0 }} onClick={(e) => e.stopPropagation()}>
              {inCart ? (
                <Box sx={{ display: "flex", alignItems: "center", border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                  <IconButton size="small" onClick={handleMinus} sx={{ p: 0.5 }}>
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                  <Typography variant="body2" sx={{ minWidth: 24, textAlign: "center" }}>{cartQuantity}</Typography>
                  <IconButton size="small" onClick={handleAdd} sx={{ p: 0.5 }}>
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Box>
              ) : (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToCart(_id);
                  }}
                >
                  <AddShoppingCartIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
