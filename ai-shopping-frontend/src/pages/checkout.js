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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  IconButton,
  Paper,
  Container,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import LocalGroceryStoreIcon from "@mui/icons-material/LocalGroceryStore";
import StoreIcon from "@mui/icons-material/Store";
import PaymentIcon from "@mui/icons-material/Payment";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import { useAuth } from "@/context/AuthContext";
import { cart as cartApi, orders as ordersApi, stores, addresses as addressesApi } from "@/lib/api";

export default function Checkout() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [cart, setCart] = useState(null);
  const [pickupStores, setPickupStores] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("pay_at_store");
  const [deliveryType, setDeliveryType] = useState("pickup"); // "pickup" | "delivery" (when pay online)
  const [storeId, setStoreId] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [newAddressForm, setNewAddressForm] = useState({
    type: "home",
    street: "",
    city: "",
    state: "",
    pincode: "",
    country: "USA",
    is_default: false,
  });
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
        const [cartRes, storesRes, addressesRes] = await Promise.all([
          cartApi.get(),
          stores.pickup().catch(() => ({ stores: [] })),
          addressesApi.list().catch(() => ({ addresses: [] })),
        ]);
        setCart(cartRes);
        setPickupStores(storesRes?.stores || []);
        setSavedAddresses(addressesRes?.addresses || []);
        if (storesRes?.stores?.[0]?._id) setStoreId(storesRes.stores[0]._id);
        // Set default address if available
        const defaultAddr = addressesRes?.addresses?.find((a) => a.is_default);
        if (defaultAddr) setSelectedAddressId(defaultAddr._id);
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
    if (paymentMethod === "online" && deliveryType === "delivery" && !selectedAddressId && !deliveryAddress) {
      setError("Please select or enter a delivery address.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const addressIdForOrder =
        paymentMethod === "online" && deliveryType === "delivery" ? selectedAddressId || undefined : undefined;
      const storeIdForOrder =
        paymentMethod === "pay_at_store" || (paymentMethod === "online" && deliveryType === "pickup")
          ? storeId || undefined
          : undefined;
      const res = await ordersApi.create(paymentMethod, storeIdForOrder, addressIdForOrder);
      // Only clear cart for "pay_at_store" orders (payment is complete)
      // For "online" orders, cart will be cleared after payment succeeds/fails
      if (paymentMethod === "pay_at_store") {
        await cartApi.clear();
      }
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

  const handleSaveNewAddress = async () => {
    if (!newAddressForm.street || !newAddressForm.city || !newAddressForm.state || !newAddressForm.pincode) {
      return;
    }
    try {
      await addressesApi.add(newAddressForm);
      const data = await addressesApi.list();
      setSavedAddresses(data?.addresses || []);
      const newAddr = data?.addresses?.find((a) => a.street === newAddressForm.street && a.city === newAddressForm.city);
      if (newAddr) setSelectedAddressId(newAddr._id);
      setAddressDialogOpen(false);
      setNewAddressForm({
        type: "home",
        street: "",
        city: "",
        state: "",
        pincode: "",
        country: "USA",
        is_default: false,
      });
    } catch (e) {
      console.error("Failed to save address:", e);
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
        <title>Checkout · AIVA</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/aiva_logo1.png" />
      </Head>
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "#F5F5F5",
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: "30px 30px",
          position: "relative",
          overflow: "hidden",
          p: 2,
        }}
      >
        {/* Floating Icons */}
        <ShoppingCartIcon
          sx={{
            position: "absolute",
            top: { xs: "8%", md: "10%" },
            left: { xs: "5%", md: "8%" },
            fontSize: { xs: 40, md: 60 },
            opacity: 0.2,
            color: "text.secondary",
            zIndex: 0,
            display: { xs: "none", sm: "block" },
            animation: "float 6s ease-in-out infinite",
            "@keyframes float": {
              "0%, 100%": { transform: "translateY(0px)" },
              "50%": { transform: "translateY(-10px)" },
            },
          }}
        />
        <LocalGroceryStoreIcon
          sx={{
            position: "absolute",
            top: { xs: "6%", md: "8%" },
            right: { xs: "5%", md: "10%" },
            fontSize: { xs: 35, md: 55 },
            opacity: 0.25,
            color: "text.secondary",
            zIndex: 0,
            display: { xs: "none", sm: "block" },
            animation: "float 8s ease-in-out infinite",
            "@keyframes float": {
              "0%, 100%": { transform: "translateY(0px)" },
              "50%": { transform: "translateY(-15px)" },
            },
          }}
        />
        <PaymentIcon
          sx={{
            position: "absolute",
            bottom: { xs: "15%", md: "20%" },
            left: { xs: "8%", md: "12%" },
            fontSize: { xs: 30, md: 50 },
            opacity: 0.2,
            color: "text.secondary",
            zIndex: 0,
            display: { xs: "none", md: "block" },
            animation: "float 7s ease-in-out infinite",
            "@keyframes float": {
              "0%, 100%": { transform: "translateY(0px)" },
              "50%": { transform: "translateY(-12px)" },
            },
          }}
        />
        <CreditCardIcon
          sx={{
            position: "absolute",
            bottom: { xs: "12%", md: "18%" },
            right: { xs: "8%", md: "10%" },
            fontSize: { xs: 40, md: 60 },
            opacity: 0.2,
            color: "text.secondary",
            zIndex: 0,
            display: { xs: "none", sm: "block" },
            animation: "float 9s ease-in-out infinite",
            "@keyframes float": {
              "0%, 100%": { transform: "translateY(0px)" },
              "50%": { transform: "translateY(-8px)" },
            },
          }}
        />
        <StoreIcon
          sx={{
            position: "absolute",
            top: { xs: "50%", md: "45%" },
            left: { xs: "3%", md: "5%" },
            fontSize: { xs: 25, md: 45 },
            opacity: 0.15,
            color: "text.secondary",
            zIndex: 0,
            display: { xs: "none", lg: "block" },
            animation: "float 10s ease-in-out infinite",
            "@keyframes float": {
              "0%, 100%": { transform: "translateY(0px)" },
              "50%": { transform: "translateY(-10px)" },
            },
          }}
        />

        <Container maxWidth="md" sx={{ position: "relative", zIndex: 1 }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 4 },
              borderRadius: 3,
              bgcolor: "background.paper",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
              mb: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
              <IconButton
                onClick={() => router.push("/cart")}
                sx={{
                  color: "text.primary",
                  bgcolor: "rgba(0,0,0,0.04)",
                  "&:hover": { bgcolor: "rgba(0,0,0,0.08)" },
                }}
                aria-label="Back to cart"
              >
                <ArrowBackIcon />
              </IconButton>
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
              <Typography variant="h1" sx={{ fontSize: { xs: "1.75rem", sm: "2rem" }, fontWeight: 700 }}>
                Checkout
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                p: 2,
                bgcolor: "primary.main",
                color: "primary.contrastText",
                borderRadius: 2,
                mb: 3,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Order Total
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                ${Number(total).toFixed(2)}
              </Typography>
            </Box>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
                {error}
              </Alert>
            )}
            <FormControl component="fieldset" sx={{ mb: 3, width: "100%" }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Payment Method
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
              <FormControl component="fieldset" sx={{ mb: 3, width: "100%" }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Pickup Store
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
                <FormControl component="fieldset" sx={{ mb: 3, width: "100%" }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Fulfillment Option
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
                  <FormControl component="fieldset" sx={{ mb: 3, width: "100%" }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      Pickup Store
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
                  <FormControl sx={{ mb: 3, width: "100%" }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      Delivery Address
                    </Typography>
                {savedAddresses.length > 0 ? (
                  <>
                    <RadioGroup
                      value={selectedAddressId}
                      onChange={(e) => {
                        setSelectedAddressId(e.target.value);
                        setDeliveryAddress("");
                      }}
                    >
                      {savedAddresses.map((addr) => (
                        <FormControlLabel
                          key={addr._id}
                          value={addr._id}
                          control={<Radio />}
                          label={
                            <Box>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                <Typography variant="body2" sx={{ textTransform: "capitalize", fontWeight: 600 }}>
                                  {addr.type}
                                </Typography>
                                {addr.is_default && (
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      bgcolor: "primary.main",
                                      color: "primary.contrastText",
                                      px: 0.5,
                                      py: 0.25,
                                      borderRadius: 0.5,
                                    }}
                                  >
                                    Default
                                  </Typography>
                                )}
                              </Box>
                              <Typography variant="body2" color="text.secondary">
                                {addr.street}, {addr.city}, {addr.state} {addr.pincode}
                              </Typography>
                            </Box>
                          }
                          sx={{ mb: 1, alignItems: "flex-start" }}
                        />
                      ))}
                    </RadioGroup>
                    {selectedAddressId === "" && (
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Street, city, pincode"
                        value={deliveryAddress}
                        onChange={(e) => {
                          setDeliveryAddress(e.target.value);
                          setSelectedAddressId("");
                        }}
                        sx={{ mt: 1, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                      />
                    )}
                    <Button
                      size="small"
                      onClick={() => setAddressDialogOpen(true)}
                      sx={{ mt: 1, textTransform: "none" }}
                    >
                      + Add new address
                    </Button>
                  </>
                ) : (
                  <>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Street, city, pincode"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 }, mb: 1 }}
                    />
                    <Button
                      size="small"
                      onClick={() => setAddressDialogOpen(true)}
                      sx={{ textTransform: "none" }}
                    >
                      + Save this address for future use
                    </Button>
                  </>
                )}
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
              sx={{
                borderRadius: 2,
                py: 1.5,
                textTransform: "none",
                fontSize: "1rem",
                fontWeight: 600,
                mt: 2,
              }}
            >
              {submitting ? <CircularProgress size={24} color="inherit" /> : "Place Order"}
            </Button>
          </Paper>
        </Container>

        <Dialog open={addressDialogOpen} onClose={() => setAddressDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add New Address</DialogTitle>
          <DialogContent>
            <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
              <InputLabel>Address Type</InputLabel>
              <Select
                value={newAddressForm.type}
                onChange={(e) => setNewAddressForm({ ...newAddressForm, type: e.target.value })}
                label="Address Type"
              >
                <MenuItem value="home">Home</MenuItem>
                <MenuItem value="work">Work</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Street Address"
              value={newAddressForm.street}
              onChange={(e) => setNewAddressForm({ ...newAddressForm, street: e.target.value })}
              sx={{ mb: 2 }}
              required
            />
            <TextField
              fullWidth
              label="City"
              value={newAddressForm.city}
              onChange={(e) => setNewAddressForm({ ...newAddressForm, city: e.target.value })}
              sx={{ mb: 2 }}
              required
            />
            <TextField
              fullWidth
              label="State"
              value={newAddressForm.state}
              onChange={(e) => setNewAddressForm({ ...newAddressForm, state: e.target.value })}
              sx={{ mb: 2 }}
              required
            />
            <TextField
              fullWidth
              label="Pincode"
              value={newAddressForm.pincode}
              onChange={(e) => setNewAddressForm({ ...newAddressForm, pincode: e.target.value })}
              sx={{ mb: 2 }}
              required
            />
            <TextField
              fullWidth
              label="Country"
              value={newAddressForm.country}
              onChange={(e) => setNewAddressForm({ ...newAddressForm, country: e.target.value })}
              sx={{ mb: 2 }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={newAddressForm.is_default}
                  onChange={(e) => setNewAddressForm({ ...newAddressForm, is_default: e.target.checked })}
                />
              }
              label="Set as default address"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddressDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSaveNewAddress}>
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  );
}
