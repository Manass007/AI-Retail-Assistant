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
} from "@mui/material";
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
          sx={{ borderRadius: 2, py: 1.5 }}
        >
          {submitting ? <CircularProgress size={24} /> : "Place order"}
        </Button>

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
