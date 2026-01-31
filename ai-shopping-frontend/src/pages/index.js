import Head from "next/head";
import { useRouter } from "next/router";
import { Box, Typography, TextField, InputAdornment, Button, Card, CardContent } from "@mui/material";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import { useAuth } from "@/context/AuthContext";
import { useSnackbar } from "@/context/SnackbarContext";
import { useEffect, useState, useCallback } from "react";
import { products as productsApi, recommendations, offers, cart as cartApi, orders as ordersApi } from "@/lib/api";
import ProductCard from "@/components/ProductCard";

const CATEGORIES = [
  "Electronics",
  "Fashion",
  "Home",
  "Sports",
  "Office",
  "Dairy",
  "Groceries",
  "Staples",
  "Personal Care",
];

export default function Home() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { showSnackbar } = useSnackbar();
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [offersList, setOffersList] = useState([]);
  const [earnedCoupons, setEarnedCoupons] = useState([]);
  const [cartData, setCartData] = useState(null);
  const [lastOrdered, setLastOrdered] = useState([]);
  const [frequentlyOrdered, setFrequentlyOrdered] = useState([]);

  const fetchCart = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const res = await cartApi.get();
      setCartData(res);
    } catch {
      setCartData(null);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    (async () => {
      try {
        const data = await recommendations.list(8);
        setFeatured(data?.products || []);
      } catch {
        const data = await productsApi.list({ limit: 8 });
        setFeatured(data?.products || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    fetchCart();
  }, [isLoggedIn, fetchCart]);

  useEffect(() => {
    if (!isLoggedIn) return;
    (async () => {
      try {
        const data = await offers.list();
        setOffersList(data?.offers || []);
        setEarnedCoupons(data?.earned_coupons || []);
      } catch {
        setOffersList([]);
        setEarnedCoupons([]);
      }
    })();
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;
    (async () => {
      try {
        const data = await ordersApi.history();
        setLastOrdered(data?.last_ordered || []);
        setFrequentlyOrdered(data?.frequently_ordered || []);
      } catch {
        setLastOrdered([]);
        setFrequentlyOrdered([]);
      }
    })();
  }, [isLoggedIn]);

  const handleAddToCart = async (productId) => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    try {
      await cartApi.add(productId, 1);
      await fetchCart();
      showSnackbar("Added to cart");
    } catch (e) {
      if (e.message?.includes("401")) router.push("/login");
      else showSnackbar(e.message || "Could not add to cart", "error");
    }
  };

  const handleQuantityChange = async (productId, newQty) => {
    if (!isLoggedIn) return;
    try {
      if (newQty === 0) {
        await cartApi.remove(productId);
        showSnackbar("Removed from cart");
      } else {
        await cartApi.update(productId, newQty);
        showSnackbar("Cart updated");
      }
      await fetchCart();
    } catch (e) {
      showSnackbar(e.message || "Could not update cart", "error");
    }
  };

  const cartQtyMap = {};
  (cartData?.cart || []).forEach((item) => {
    const id = item.product?._id;
    if (id) cartQtyMap[id] = (cartQtyMap[id] || 0) + (item.quantity || 0);
  });

  const handleSearch = () => {
    if (search.trim()) router.push(`/products?search=${encodeURIComponent(search.trim())}`);
  };

  return (
    <>
      <Head>
        <title>AI Shopping Assistant</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Box sx={{ px: 2, pt: 2, pb: 2 }}>
        <Typography variant="h1" sx={{ fontSize: "1.5rem", mb: 0.5 }}>
          Ask for what you need
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Groceries, daily items, or products — we&apos;ve got you.
        </Typography>

        <TextField
          fullWidth
          placeholder="Chat with assistant"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <ChatBubbleOutlineIcon color="action" />
              </InputAdornment>
            ),
            sx: { borderRadius: 2, bgcolor: "grey.50" },
          }}
          sx={{ mb: 2 }}
          onClick={() => router.push("/chat")}
          readOnly
        />
        <Button
          fullWidth
          variant="contained"
          size="large"
          sx={{ borderRadius: 2, py: 1.5, mb: 1 }}
          onClick={() => router.push("/chat")}
        >
          Open Chat
        </Button>
        <Button fullWidth sx={{ mb: 2 }} onClick={() => router.push("/products")}>
          Browse all products
        </Button>

        {isLoggedIn && (offersList.length > 0 || earnedCoupons.length > 0) && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, display: "flex", alignItems: "center", gap: 0.5 }}>
              <LocalOfferIcon fontSize="small" /> Offers & discounts
            </Typography>
            <Box sx={{ display: "flex", gap: 1, overflowX: "auto", pb: 1, "&::-webkit-scrollbar": { display: "none" } }}>
              {[...offersList, ...earnedCoupons].slice(0, 8).map((o) => (
                <Card key={o.id || o.code} sx={{ minWidth: 180, borderRadius: 2 }} variant="outlined">
                  <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                    <Typography variant="subtitle2">{o.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{o.description}</Typography>
                    <Typography variant="body2" color="primary" fontWeight={600} sx={{ mt: 0.5 }}>
                      Use {o.code}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        )}

        {isLoggedIn && (lastOrdered.length > 0 || frequentlyOrdered.length > 0) && (
          <Box sx={{ mb: 2 }}>
            {lastOrdered.length > 0 && (
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                  Last order
                </Typography>
                <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                  {lastOrdered.slice(0, 4).map((item) => (
                    <Button
                      key={item.product_id}
                      size="small"
                      variant="outlined"
                      onClick={() => item.product_id && handleAddToCart(item.product_id)}
                      sx={{ borderRadius: 2, textTransform: "none", fontSize: "0.7rem" }}
                    >
                      {item.product?.name || item.product_id} · ${Number(item.product?.price || 0).toFixed(2)}
                    </Button>
                  ))}
                </Box>
              </Box>
            )}
            {frequentlyOrdered.length > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                  Frequently ordered
                </Typography>
                <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                  {frequentlyOrdered.slice(0, 4).map((item) => (
                    <Button
                      key={item.product_id}
                      size="small"
                      variant="outlined"
                      onClick={() => item.product_id && handleAddToCart(item.product_id)}
                      sx={{ borderRadius: 2, textTransform: "none", fontSize: "0.7rem" }}
                    >
                      {item.product?.name || item.product_id} · ${Number(item.product?.price || 0).toFixed(2)}
                    </Button>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        )}

        <Box sx={{ display: "flex", gap: 1, overflowX: "auto", pb: 1, mb: 2, "&::-webkit-scrollbar": { display: "none" } }}>
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant="outlined"
              size="small"
              sx={{ borderRadius: 2, whiteSpace: "nowrap", flexShrink: 0 }}
              onClick={() => router.push(`/products?category=${encodeURIComponent(cat)}`)}
            >
              {cat}
            </Button>
          ))}
        </Box>

        <Typography variant="h2" sx={{ fontSize: "1.125rem", mb: 1.5 }}>
          Featured
        </Typography>
        {loading ? (
          <Typography color="text.secondary">Loading...</Typography>
        ) : (
          <Box
            sx={(t) => ({
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gridAutoRows: "1fr",
              gap: 2,
              alignItems: "stretch",
              alignContent: "start",
              [t.breakpoints.up("sm")]: { gridTemplateColumns: "repeat(3, 1fr)" },
              [t.breakpoints.up("md")]: { gridTemplateColumns: "repeat(4, 1fr)" },
            })}
          >
            {featured.map((p) => (
              <ProductCard
                key={p._id}
                product={p}
                onAddToCart={handleAddToCart}
                onQuantityChange={handleQuantityChange}
                cartQuantity={cartQtyMap[p._id] || 0}
                showAddCart
              />
            ))}
          </Box>
        )}
      </Box>
    </>
  );
}
