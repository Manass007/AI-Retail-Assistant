import Head from "next/head";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  CircularProgress,
  Divider,
  TextField,
  InputAdornment,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import { useAuth } from "@/context/AuthContext";
import { useSnackbar } from "@/context/SnackbarContext";
import { cart as cartApi, recommendations, watchlist } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import WatchlistComboCard from "@/components/watchlist/WatchlistComboCard";
import Tooltip from "@mui/material/Tooltip";

export default function Cart() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { showSnackbar } = useSnackbar();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [recommended, setRecommended] = useState([]);
  const [comboSuggestions, setComboSuggestions] = useState([]);

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }
    fetchCart();
  }, [isLoggedIn, router]);

  useEffect(() => {
    (async () => {
      try {
        const [recRes, comboRes] = await Promise.all([
          recommendations.list(6).catch(() => ({ products: [] })),
          isLoggedIn ? watchlist.comboSuggestionsCart().catch(() => ({ suggestions: [] })) : Promise.resolve({ suggestions: [] }),
        ]);
        setRecommended(recRes?.products || []);
        setComboSuggestions(comboRes?.suggestions || []);
      } catch {
        setRecommended([]);
        setComboSuggestions([]);
      }
    })();
  }, [isLoggedIn, data]);

  const fetchCart = async () => {
    try {
      const res = await cartApi.get();
      setData(res);
    } catch (e) {
      if (e.message?.includes("401")) router.replace("/login");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQty = async (productId, quantity) => {
    if (quantity < 1) return;
    setUpdating(productId);
    try {
      await cartApi.update(productId, quantity);
      await fetchCart();
    } finally {
      setUpdating(null);
    }
  };

  const handleRemove = async (productId) => {
    setUpdating(productId);
    try {
      await cartApi.remove(productId);
      await fetchCart();
    } finally {
      setUpdating(null);
    }
  };

  if (!isLoggedIn) return null;
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError("");
    try {
      await cartApi.applyCoupon(couponCode.trim());
      await fetchCart();
    } catch (e) {
      setCouponError(e.message || "Invalid coupon");
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      await cartApi.removeCoupon();
      await fetchCart();
    } catch {}
  };

  const handleAddToCart = async (productId) => {
    try {
      await cartApi.add(productId, 1);
      await fetchCart();
    } catch (e) {
      if (e.message?.includes("401")) router.replace("/login");
    }
  };

  const handleMoveToWatchlist = async (productId) => {
    setUpdating(productId);
    try {
      await watchlist.moveFromCart(productId);
      showSnackbar("Moved to Watchlist - we'll notify you about price drops", "success");
      await fetchCart();
      // Refresh combo suggestions
      try {
        const comboRes = await watchlist.comboSuggestionsCart();
        setComboSuggestions(comboRes?.suggestions || []);
      } catch {}
    } catch (e) {
      showSnackbar(e.message || "Failed to move to watchlist", "error");
    } finally {
      setUpdating(null);
    }
  };

  const cart = data?.cart || [];
  const totalAmount = data?.total_amount ?? 0;
  const totalAfterDiscount = data?.total_after_discount ?? totalAmount;
  const discountAmount = data?.discount_amount ?? 0;
  const appliedCoupon = data?.applied_coupon;
  const totalItems = data?.total_items ?? 0;

  return (
    <>
      <Head>
        <title>Cart · AIVA</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/aiva_logo1.png" />
      </Head>
      <Box sx={{ px: 2, py: 2 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            mb: 2,
          }}
        >
          <Box
            onClick={() => router.push("/")}
            sx={{
              width: { xs: 56, sm: 64 },
              height: { xs: 56, sm: 64 },
              borderRadius: 3,
              bgcolor: "background.paper",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              flexShrink: 0,
              p: 1,
              cursor: "pointer",
              transition: "transform 0.2s, boxShadow 0.2s",
              "&:hover": {
                transform: "scale(1.05)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              },
            }}
          >
            <Box
              component="img"
              src="/aiva_logo1.png"
              alt="AIVA Logo"
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
            />
          </Box>
          <Typography variant="h1" sx={{ fontSize: "1.5rem" }}>
            Cart
          </Typography>
        </Box>
        <Typography variant="h1" sx={{ fontSize: "1.5rem", mb: 2 }}>
          Cart
        </Typography>
        {cart.length === 0 ? (
          <>
            <Typography color="text.secondary" sx={{ py: 2 }}>
              Your cart is empty
            </Typography>
            {recommended.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                  Recommended for you
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2 }}>
                  {recommended.slice(0, 4).map((p) => (
                    <ProductCard
                      key={p._id}
                      product={p}
                      onAddToCart={handleAddToCart}
                      onQuantityChange={async (id, qty) => { try { if (qty === 0) await cartApi.remove(id); else await cartApi.update(id, qty); fetchCart(); } catch {} }}
                      cartQuantity={(data?.cart || []).find((i) => i.product?._id === p._id)?.quantity || 0}
                      showAddCart
                      compact
                      small
                    />
                  ))}
                </Box>
                <Button fullWidth variant="outlined" sx={{ mt: 2, borderRadius: 2 }} onClick={() => router.push("/")}>
                  Browse all products
                </Button>
              </Box>
            )}
          </>
        ) : (
          <>
            {cart.map((item) => {
              const p = item.product || {};
              const busy = updating === p._id;
              return (
                <Box
                  key={p._id}
                  sx={{
                    display: "flex",
                    gap: 2,
                    py: 2,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Box
                    component="img"
                    src={p.image_url || "/placeholder.png"}
                    alt={p.name}
                    sx={{ width: 80, height: 80, borderRadius: 1, objectFit: "cover", flexShrink: 0 }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>
                      {p.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ${Number(p.price).toFixed(2)} × {item.quantity}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1 }}>
                      <IconButton
                        size="small"
                        disabled={busy || item.quantity <= 1}
                        onClick={() => handleUpdateQty(p._id, item.quantity - 1)}
                      >
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <Typography variant="body2">{item.quantity}</Typography>
                      <IconButton
                        size="small"
                        disabled={busy}
                        onClick={() => handleUpdateQty(p._id, item.quantity + 1)}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                      <Tooltip title="Move to Watchlist - we'll notify you about price drops">
                        <IconButton
                          size="small"
                          disabled={busy}
                          onClick={() => handleMoveToWatchlist(p._id)}
                          sx={{ ml: 1 }}
                        >
                          <BookmarkBorderIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <IconButton size="small" disabled={busy} onClick={() => handleRemove(p._id)} sx={{ ml: 0.5 }}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  <Typography variant="body2" fontWeight={600}>
                    ${(Number(p.price) * item.quantity).toFixed(2)}
                  </Typography>
                </Box>
              );
            })}
            {!appliedCoupon ? (
              <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start", my: 2 }}>
                <TextField
                  size="small"
                  placeholder="Discount code"
                  value={couponCode}
                  onChange={(e) => { setCouponCode(e.target.value); setCouponError(""); }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocalOfferIcon fontSize="small" />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: 2, bgcolor: "grey.50" },
                  }}
                  sx={{ flex: 1 }}
                  error={!!couponError}
                  helperText={couponError}
                />
                <Button variant="outlined" sx={{ borderRadius: 2 }} onClick={handleApplyCoupon}>
                  Apply
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", my: 2, py: 1, px: 1.5, bgcolor: "success.light", borderRadius: 2 }}>
                <Typography variant="body2">
                  {appliedCoupon.code} · {appliedCoupon.discount_percent}% off
                </Typography>
                <Button size="small" onClick={handleRemoveCoupon}>Remove</Button>
              </Box>
            )}
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
              <Typography variant="body1">Subtotal ({totalItems} items)</Typography>
              <Typography variant="body2">${Number(totalAmount).toFixed(2)}</Typography>
            </Box>
            {discountAmount > 0 && (
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                <Typography variant="body2" color="success.main">Discount</Typography>
                <Typography variant="body2" color="success.main">-${Number(discountAmount).toFixed(2)}</Typography>
              </Box>
            )}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="body1" fontWeight={600}>Total</Typography>
              <Typography variant="h2" sx={{ fontSize: "1.25rem" }}>
                ${Number(totalAfterDiscount).toFixed(2)}
              </Typography>
            </Box>
            <Button
              fullWidth
              variant="contained"
              size="large"
              sx={{ borderRadius: 2, py: 1.5 }}
              onClick={() => router.push("/checkout")}
            >
              Checkout
            </Button>
            {comboSuggestions.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
                  Complete your Watchlist combos and save more
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {comboSuggestions.slice(0, 3).map((suggestion, index) => (
                    <WatchlistComboCard
                      key={`${suggestion.watchlist_product?._id}-${index}`}
                      suggestion={suggestion}
                      onAddToCart={async () => {
                        await fetchCart();
                        try {
                          const comboRes = await watchlist.comboSuggestionsCart();
                          setComboSuggestions(comboRes?.suggestions || []);
                        } catch {}
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}
            {recommended.length > 0 && (
              <>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 3, mb: 1, display: "block" }}>
                  You might also like
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2 }}>
                  {recommended.slice(0, 4).map((p) => (
                    <ProductCard
                      key={p._id}
                      product={p}
                      onAddToCart={handleAddToCart}
                      onQuantityChange={async (id, qty) => { try { if (qty === 0) await cartApi.remove(id); else await cartApi.update(id, qty); fetchCart(); } catch {} }}
                      cartQuantity={(data?.cart || []).find((i) => i.product?._id === p._id)?.quantity || 0}
                      showAddCart
                      compact
                      small
                    />
                  ))}
                </Box>
              </>
            )}
          </>
        )}
      </Box>
    </>
  );
}
