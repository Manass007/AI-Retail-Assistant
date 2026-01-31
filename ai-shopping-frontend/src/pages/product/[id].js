import Head from "next/head";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  CircularProgress,
  Chip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import { useAuth } from "@/context/AuthContext";
import { products as productsApi, cart as cartApi, bundles } from "@/lib/api";

export default function ProductDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { isLoggedIn } = useAuth();
  const [product, setProduct] = useState(null);
  const [bundleOffers, setBundleOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const [prodRes, bundleRes] = await Promise.all([
          productsApi.get(id),
          bundles.forProduct(id).catch(() => ({ bundles: [] })),
        ]);
        setProduct(prodRes?.product || null);
        setBundleOffers(bundleRes?.bundles || []);
      } catch {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleAddToCart = async () => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    if (!product?._id) return;
    setAdding(true);
    try {
      await cartApi.add(product._id, 1);
      router.push("/cart");
    } catch (e) {
      if (e.message?.includes("401")) router.push("/login");
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (!product) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>Product not found</Typography>
        <Button onClick={() => router.back()}>Back</Button>
      </Box>
    );
  }

  const { name, price, image_url, description, category, brand, tags } = product;

  return (
    <>
      <Head>
        <title>{name} · AI Shopping Assistant</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Box sx={{ pb: 3 }}>
        <Box sx={{ position: "relative", pt: "100%", bgcolor: "grey.100" }}>
          <Box
            component="img"
            src={image_url || "/placeholder.png"}
            alt={name}
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          <IconButton
            sx={{ position: "absolute", top: 8, left: 8, bgcolor: "rgba(255,255,255,0.9)" }}
            onClick={() => router.back()}
          >
            <ArrowBackIcon />
          </IconButton>
          <IconButton
            sx={{ position: "absolute", top: 8, right: 8, bgcolor: "rgba(255,255,255,0.9)" }}
          >
            <FavoriteBorderIcon />
          </IconButton>
        </Box>
        <Box sx={{ px: 2, pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            {brand || category}
          </Typography>
          <Typography variant="h1" sx={{ fontSize: "1.375rem", mt: 0.5 }}>
            {name}
          </Typography>
          <Typography variant="h2" sx={{ fontSize: "1.25rem", mt: 1 }}>
            ${Number(price).toFixed(2)}
          </Typography>
          {tags?.length > 0 && (
            <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 1 }}>
              {tags.map((t) => (
                <Chip key={t} label={t} size="small" sx={{ borderRadius: 1 }} />
              ))}
            </Box>
          )}
          {description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {description}
            </Typography>
          )}
          {bundleOffers.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Bundle deals
              </Typography>
              {bundleOffers.map((b) => (
                <Chip
                  key={b._id}
                  label={`${b.name} · ${b.discount_percent}% off → $${b.total_after_discount}`}
                  onClick={() => router.push("/bundles")}
                  sx={{ mr: 1, mb: 1, borderRadius: 2 }}
                />
              ))}
            </Box>
          )}
          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={adding ? <CircularProgress size={20} /> : <AddShoppingCartIcon />}
            onClick={handleAddToCart}
            disabled={adding}
            sx={{ mt: 3, borderRadius: 2, py: 1.5 }}
          >
            {adding ? "Adding…" : "Add to cart"}
          </Button>
        </Box>
      </Box>
    </>
  );
}
