import Head from "next/head";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  CircularProgress,
  Alert,
  TextField,
} from "@mui/material";
import { useAuth } from "@/context/AuthContext";
import { cart as cartApi, orders as ordersApi, stores } from "@/lib/api";

export default function Checkout() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [cart, setCart] = useState(null);
  const [pickupStores, setPickupStores] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("pay_at_store");
  const [deliveryType, setDeliveryType] = useState("pickup"); // "pickup" | "delivery" (when pay online)
  const [storeId, setStoreId] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }
    (async () => {
      try {
        const [cartRes, storesRes] = await Promise.all([
          cartApi.get(),
          stores.pickup().catch(() => ({ stores: [] })),
        ]);
        setCart(cartRes);
        setPickupStores(storesRes?.stores || []);
        if (storesRes?.stores?.[0]?._id) setStoreId(storesRes.stores[0]._id);
      } catch (e) {
        if (e.message?.includes("401")) router.replace("/login");
      } finally {
        setLoading(false);
      }
    })();
  }, [isLoggedIn, router]);

  const handlePlaceOrder = async () => {
    if (!cart?.cart?.length) return;
    if (paymentMethod === "online" && deliveryType === "pickup" && !storeId) {
      setError("Please select a pickup store.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await ordersApi.create(
        paymentMethod,
        paymentMethod === "pay_at_store" || (paymentMethod === "online" && deliveryType === "pickup")
          ? storeId || undefined
          : undefined
      );
      if (paymentMethod === "online") {
        router.push(`/payment?order_id=${res.order_id}&total=${res.total}`);
      } else {
        router.push("/profile?order=success");
      }
    } catch (e) {
      setError(e.message || "Failed to place order");
    } finally {
      setSubmitting(false);
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
  if (!cart?.cart?.length) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>Cart is empty</Typography>
        <Button onClick={() => router.push("/")}>Continue shopping</Button>
      </Box>
    );
  }

  const total = cart?.total_after_discount ?? cart?.total_amount ?? 0;

  return (
    <>
      <Head>
        <title>Checkout · AI Shopping Assistant</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Box sx={{ px: 2, py: 2 }}>
        <Typography variant="h1" sx={{ fontSize: "1.5rem", mb: 2 }}>
          Checkout
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Total: ${Number(total).toFixed(2)}
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}
        <FormControl component="fieldset" sx={{ mb: 2, width: "100%" }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Payment
          </Typography>
          <RadioGroup
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <FormControlLabel
              value="pay_at_store"
              control={<Radio />}
              label="Pay at store (when you pick up)"
            />
            <FormControlLabel value="online" control={<Radio />} label="Pay online" />
          </RadioGroup>
        </FormControl>
        {paymentMethod === "pay_at_store" && pickupStores.length > 0 && (
          <FormControl component="fieldset" sx={{ mb: 2, width: "100%" }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Pickup store
            </Typography>
            <RadioGroup value={storeId} onChange={(e) => setStoreId(e.target.value)}>
              {pickupStores.map((s) => (
                <FormControlLabel
                  key={s._id}
                  value={s._id}
                  control={<Radio />}
                  label={`${s.name} · ${s.address}, ${s.city}`}
                />
              ))}
            </RadioGroup>
          </FormControl>
        )}
        {paymentMethod === "online" && (
          <>
            <FormControl component="fieldset" sx={{ mb: 2, width: "100%" }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Fulfillment
              </Typography>
              <RadioGroup
                value={deliveryType}
                onChange={(e) => setDeliveryType(e.target.value)}
              >
                <FormControlLabel
                  value="pickup"
                  control={<Radio />}
                  label="Pick up at store"
                />
                <FormControlLabel
                  value="delivery"
                  control={<Radio />}
                  label="Home delivery"
                />
              </RadioGroup>
            </FormControl>
            {deliveryType === "pickup" && pickupStores.length > 0 && (
              <FormControl component="fieldset" sx={{ mb: 2, width: "100%" }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Pickup store
                </Typography>
                <RadioGroup value={storeId} onChange={(e) => setStoreId(e.target.value)}>
                  {pickupStores.map((s) => (
                    <FormControlLabel
                      key={s._id}
                      value={s._id}
                      control={<Radio />}
                      label={`${s.name} · ${s.address}, ${s.city}`}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            )}
            {deliveryType === "delivery" && (
              <FormControl sx={{ mb: 2, width: "100%" }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Delivery address
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Street, city, pincode"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                />
              </FormControl>
            )}
          </>
        )}
        <Button
          fullWidth
          variant="contained"
          size="large"
          disabled={submitting}
          onClick={handlePlaceOrder}
          sx={{ borderRadius: 2, py: 1.5 }}
        >
          {submitting ? <CircularProgress size={24} /> : "Place order"}
        </Button>
      </Box>
    </>
  );
}
