import Head from "next/head";
import { useRouter } from "next/router";
import { useState, useEffect, useCallback } from "react";
import { useTheme } from "@mui/material/styles";
import { Box, Typography, TextField, InputAdornment, CircularProgress } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useAuth } from "@/context/AuthContext";
import { useSnackbar } from "@/context/SnackbarContext";
import { products as productsApi, cart as cartApi } from "@/lib/api";
import ProductCard from "@/components/ProductCard";

const CATEGORIES = [
  "All",
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

export default function Products() {
  const router = useRouter();
  const theme = useTheme();
  const { category: qCategory, search: qSearch } = router.query;
  const { isLoggedIn } = useAuth();
  const { showSnackbar } = useSnackbar();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(qSearch || "");
  const [category, setCategory] = useState(qCategory || "All");
  const [cartData, setCartData] = useState(null);

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
    if (!isLoggedIn) return;
    fetchCart();
  }, [isLoggedIn, fetchCart]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const params = { limit: 24 };
        if (category && category !== "All") params.category = category;
        if (qSearch) params.search = qSearch;
        const data = await productsApi.list(params);
        setProducts(data?.products || []);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [category, qSearch]);

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
        <title>Products · AI Shopping Assistant</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Box sx={{ px: 2, py: 2 }}>
        <Typography variant="h1" sx={{ fontSize: "1.5rem", mb: 2 }}>
          Products
        </Typography>
        <TextField
          fullWidth
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            sx: { borderRadius: 2, bgcolor: "grey.50" },
          }}
          sx={{ mb: 2 }}
        />
        <Box sx={{ display: "flex", gap: 1, overflowX: "auto", pb: 1, mb: 2, "&::-webkit-scrollbar": { display: "none" } }}>
          {CATEGORIES.map((cat) => (
            <Typography
              key={cat}
              component="button"
              variant="body2"
              onClick={() => setCategory(cat)}
              sx={{
                border: "none",
                bgcolor: category === cat ? "primary.main" : "grey.100",
                color: category === cat ? "white" : "text.primary",
                px: 1.5,
                py: 0.75,
                borderRadius: 2,
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
                fontWeight: category === cat ? 600 : 400,
              }}
            >
              {cat}
            </Typography>
          ))}
        </Box>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : products.length === 0 ? (
          <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
            No products found
          </Typography>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 2,
              [theme.breakpoints.up("sm")]: { gridTemplateColumns: "repeat(3, 1fr)" },
              [theme.breakpoints.up("md")]: { gridTemplateColumns: "repeat(4, 1fr)" },
            }}
          >
            {products.map((p) => (
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
