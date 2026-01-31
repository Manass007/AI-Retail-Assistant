import Head from "next/head";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  CircularProgress,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Popover,
  Checkbox,
  ListItemButton,
  Tabs,
  Tab,
  Paper,
  IconButton,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import HistoryIcon from "@mui/icons-material/History";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import CakeIcon from "@mui/icons-material/Cake";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import HomeIcon from "@mui/icons-material/Home";
import WorkIcon from "@mui/icons-material/Work";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import StarsIcon from "@mui/icons-material/Stars";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { useAuth } from "@/context/AuthContext";
import { useSnackbar } from "@/context/SnackbarContext";
import { orders as ordersApi, auth as authApi, cart as cartApi, offers as offersApi, addresses as addressesApi, watchlist as watchlistApi, gamification as gamificationApi } from "@/lib/api";

const PREF_CATEGORIES = ["Electronics", "Fashion", "Home", "Sports", "Office", "Dairy", "Groceries", "Staples", "Personal Care"];
const BUDGET_OPTIONS = [{ value: "low", label: "Budget-friendly" }, { value: "mid", label: "Moderate" }, { value: "high", label: "Premium" }];

export default function Profile() {
  const router = useRouter();
  const { user, isLoggedIn, logout, refreshUser } = useAuth();
  const [orderList, setOrderList] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderHistoryOpen, setOrderHistoryOpen] = useState(true);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDob, setFormDob] = useState("");
  const [formCategories, setFormCategories] = useState([]);
  const [formBudget, setFormBudget] = useState("mid");
  const [categoriesAnchor, setCategoriesAnchor] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);
  const [orderDetailLoading, setOrderDetailLoading] = useState(false);
  const [showCongratsDialog, setShowCongratsDialog] = useState(false);
  const [earnedCoupon, setEarnedCoupon] = useState(null);
  const [couponsDialogOpen, setCouponsDialogOpen] = useState(false);
  const [earnedCouponsList, setEarnedCouponsList] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    type: "home",
    street: "",
    city: "",
    state: "",
    pincode: "",
    country: "USA",
    is_default: false,
  });
  const [cartWatchlistTab, setCartWatchlistTab] = useState(0);
  const [watchlistItems, setWatchlistItems] = useState([]);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [pointsInfo, setPointsInfo] = useState(null);
  const [pointsLoading, setPointsLoading] = useState(false);
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login");
  }, [isLoggedIn, router]);

  // After payment success (home delivery): show congratulations + earned coupon pop-up
  useEffect(() => {
    if (router.query.payment !== "success" || typeof window === "undefined") return;
    try {
      const stored = sessionStorage.getItem("earnedCoupon");
      if (stored) {
        const coupon = JSON.parse(stored);
        setEarnedCoupon(coupon);
        setShowCongratsDialog(true);
        sessionStorage.removeItem("earnedCoupon");
      }
    } catch (_) {}
  }, [router.query.payment]);

  useEffect(() => {
    if (user) {
      setFormName(user.name || "");
      const dob = user.dob;
      if (dob) setFormDob(typeof dob === "string" ? dob.slice(0, 10) : (dob.toISOString?.()?.slice(0, 10) || ""));
      setFormCategories(user.preferences?.categories || []);
      setFormBudget(user.preferences?.budget || "mid");
    }
  }, [user]);

  // Only open onboarding when profile not completed and not coming from order/payment redirect
  useEffect(() => {
    if (user && user.onboarded === false && !router.query.payment && !router.query.order) {
      setOnboardingOpen(true);
    }
  }, [user?.onboarded, router.query.payment, router.query.order]);

  useEffect(() => {
    if (!isLoggedIn) return;
    (async () => {
      setOrdersLoading(true);
      try {
        const res = await ordersApi.list(20);
        setOrderList(res?.orders || []);
      } catch {
        setOrderList([]);
      } finally {
        setOrdersLoading(false);
      }
    })();
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;
    (async () => {
      setWatchlistLoading(true);
      try {
        const res = await watchlistApi.get();
        setWatchlistItems(res?.watchlist || []);
      } catch {
        setWatchlistItems([]);
      } finally {
        setWatchlistLoading(false);
      }
    })();
  }, [isLoggedIn, cartWatchlistTab]);

  useEffect(() => {
    if (!isLoggedIn || !couponsDialogOpen) return;
    (async () => {
      try {
        const data = await offersApi.list();
        setEarnedCouponsList(data?.earned_coupons || []);
      } catch {
        setEarnedCouponsList([]);
      }
    })();
  }, [isLoggedIn, couponsDialogOpen]);

  useEffect(() => {
    if (!isLoggedIn) return;
    (async () => {
      setAddressesLoading(true);
      try {
        const data = await addressesApi.list();
        setAddresses(data?.addresses || []);
      } catch {
        setAddresses([]);
      } finally {
        setAddressesLoading(false);
      }
    })();
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;
    (async () => {
      setPointsLoading(true);
      try {
        const data = await gamificationApi.getPointsInfo();
        setPointsInfo(data);
      } catch {
        setPointsInfo(null);
      } finally {
        setPointsLoading(false);
      }
    })();
  }, [isLoggedIn]);

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const formatDate = (d) => {
    if (!d) return "—";
    const date = typeof d === "string" ? new Date(d) : d;
    return date.toLocaleDateString("en-IN", { dateStyle: "medium" });
  };

  const formatDob = (dob) => {
    if (!dob) return "Not set";
    const d = typeof dob === "string" ? new Date(dob) : dob;
    return d.toLocaleDateString("en-IN", { dateStyle: "medium" });
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await authApi.updateProfile({
        name: formName || undefined,
        dob: formDob ? new Date(formDob).toISOString().slice(0, 10) : undefined,
        preferences: { categories: formCategories, budget: formBudget },
      });
      await refreshUser();
      setEditOpen(false);
      setOnboardingOpen(false);
      setCategoriesAnchor(null);
    } finally {
      setSaving(false);
    }
  };

  const handleCategoryToggle = (cat) => {
    setFormCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleCategoriesConfirm = () => {
    setCategoriesAnchor(null);
  };

  const handleOrderClick = async (orderId) => {
    setOrderDetailLoading(true);
    setOrderDetail(null);
    try {
      const res = await ordersApi.get(orderId);
      setOrderDetail(res?.order || null);
    } catch {
      setOrderDetail(null);
    } finally {
      setOrderDetailLoading(false);
    }
  };

  const handleOpenAddressDialog = (address = null) => {
    if (address) {
      setEditingAddress(address);
      setAddressForm({
        type: address.type || "home",
        street: address.street || "",
        city: address.city || "",
        state: address.state || "",
        pincode: address.pincode || "",
        country: address.country || "USA",
        is_default: address.is_default || false,
      });
    } else {
      setEditingAddress(null);
      setAddressForm({
        type: "home",
        street: "",
        city: "",
        state: "",
        pincode: "",
        country: "USA",
        is_default: addresses.length === 0,
      });
    }
    setAddressDialogOpen(true);
  };

  const handleCloseAddressDialog = () => {
    setAddressDialogOpen(false);
    setEditingAddress(null);
    setAddressForm({
      type: "home",
      street: "",
      city: "",
      state: "",
      pincode: "",
      country: "USA",
      is_default: false,
    });
  };

  const handleSaveAddress = async () => {
    if (!addressForm.street || !addressForm.city || !addressForm.state || !addressForm.pincode) {
      return;
    }
    setSaving(true);
    try {
      if (editingAddress) {
        await addressesApi.update(editingAddress._id, addressForm);
      } else {
        await addressesApi.add(addressForm);
      }
      const data = await addressesApi.list();
      setAddresses(data?.addresses || []);
      handleCloseAddressDialog();
    } catch (e) {
      console.error("Failed to save address:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    try {
      await addressesApi.delete(addressId);
      const data = await addressesApi.list();
      setAddresses(data?.addresses || []);
    } catch (e) {
      console.error("Failed to delete address:", e);
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    try {
      const address = addresses.find((a) => a._id === addressId);
      if (address) {
        await addressesApi.update(addressId, { ...address, is_default: true });
        const data = await addressesApi.list();
        setAddresses(data?.addresses || []);
      }
    } catch (e) {
      console.error("Failed to set default address:", e);
    }
  };

  if (!isLoggedIn) return null;

  return (
    <>
      <Head>
        <title>Profile · AIVA</title>
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
            Profile
          </Typography>
        </Box>
        {user && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1" fontWeight={600}>
              {user.name || "User"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user.email}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1 }}>
              <CakeIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                DOB: {formatDob(user.dob)} — Get birthday discounts in your birth month
              </Typography>
            </Box>
            <Button size="small" sx={{ mt: 1 }} onClick={() => setEditOpen(true)}>
              Edit profile & preferences
            </Button>
          </Box>
        )}
        <Typography variant="subtitle2" sx={{ mb: 1, display: "block" }}>
          Cart & Watchlist
        </Typography>
        <Paper sx={{ mb: 2, borderRadius: 2, overflow: "hidden" }}>
          <Tabs value={cartWatchlistTab} onChange={(e, newValue) => setCartWatchlistTab(newValue)}>
            <Tab icon={<ShoppingBagIcon />} iconPosition="start" label="Cart" />
            <Tab icon={<BookmarkIcon />} iconPosition="start" label="Watchlist" />
          </Tabs>
          <Box sx={{ p: 2 }}>
            {cartWatchlistTab === 0 ? (
              <Box>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<ShoppingBagIcon />}
                  onClick={() => router.push("/cart")}
                  sx={{ borderRadius: 2, mb: 1 }}
                >
                  View Cart
                </Button>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "center" }}>
                  Manage your cart items
                </Typography>
              </Box>
            ) : (
              <Box>
                {watchlistLoading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : watchlistItems.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 3 }}>
                    <BookmarkIcon sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Your watchlist is empty
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Items moved from cart will appear here
                    </Typography>
                  </Box>
                ) : (
                  <List disablePadding>
                    {watchlistItems.map((item, idx) => {
                      const product = item.product || {};
                      return (
                        <ListItem
                          key={product._id || idx}
                          divider={idx < watchlistItems.length - 1}
                          sx={{ flexDirection: "column", alignItems: "flex-start", py: 2, px: 0 }}
                        >
                          <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
                            <Box
                              component="img"
                              src={product.image_url || "/placeholder.png"}
                              alt={product.name}
                              sx={{ width: 60, height: 60, borderRadius: 1, objectFit: "cover", flexShrink: 0 }}
                            />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="body2" fontWeight={600} noWrap>
                                {product.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                ${Number(product.price || 0).toFixed(2)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {item.manual_move ? "Manually added" : "Moved from cart"}
                              </Typography>
                            </Box>
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<AddShoppingCartIcon />}
                              onClick={async () => {
                                try {
                                  await cartApi.add(product._id, 1);
                                  showSnackbar("Added to cart", "success");
                                  router.push("/cart");
                                } catch (e) {
                                  showSnackbar(e.message || "Failed to add to cart", "error");
                                }
                              }}
                              sx={{ borderRadius: 2 }}
                            >
                              Add to cart
                            </Button>
                          </Box>
                        </ListItem>
                      );
                    })}
                  </List>
                )}
              </Box>
            )}
          </Box>
        </Paper>

        <Typography variant="subtitle2" sx={{ mb: 1, display: "block" }}>
          Points & Rewards
        </Typography>
        <Paper sx={{ mb: 2, borderRadius: 2, overflow: "hidden" }}>
          {pointsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : pointsInfo ? (
            <Box sx={{ p: 2 }}>
              {/* Total Points */}
              <Box sx={{ mb: 3, textAlign: "center", bgcolor: "primary.light", borderRadius: 2, p: 2 }}>
                <Typography variant="h4" fontWeight={700} color="primary.contrastText">
                  {pointsInfo.total_points} Points
                </Typography>
                <Typography variant="body2" color="primary.contrastText" sx={{ opacity: 0.9 }}>
                  Worth ${pointsInfo.points_value_usd.toFixed(2)} (20 points = $0.90)
                </Typography>
              </Box>

              {/* Daily Progress */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, display: "flex", alignItems: "center", gap: 0.5 }}>
                  <TrendingUpIcon fontSize="small" />
                  Daily Progress
                </Typography>
                <Box sx={{ bgcolor: "grey.100", borderRadius: 1, p: 1.5 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="body2">Prompts: {pointsInfo.daily_prompts_completed}/4</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {pointsInfo.daily_prompts_remaining} remaining
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2">Points: {pointsInfo.daily_points_earned}/12</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {pointsInfo.daily_points_remaining} remaining
                    </Typography>
                  </Box>
                  <Box sx={{ mt: 1, width: "100%", height: 8, bgcolor: "grey.300", borderRadius: 1, overflow: "hidden" }}>
                    <Box
                      sx={{
                        width: `${(pointsInfo.daily_points_earned / 12) * 100}%`,
                        height: "100%",
                        bgcolor: "primary.main",
                        transition: "width 0.3s",
                      }}
                    />
                  </Box>
                </Box>
              </Box>

              {/* Streak Information */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, display: "flex", alignItems: "center", gap: 0.5 }}>
                  <EmojiEventsIcon fontSize="small" />
                  Streak & Tier
                </Typography>
                <Box sx={{ bgcolor: "grey.100", borderRadius: 1, p: 1.5 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography variant="body2">
                      Current Tier: <strong style={{ textTransform: "capitalize" }}>{pointsInfo.streak_tier || "None"}</strong>
                    </Typography>
                    {pointsInfo.streak_tier !== "none" && (
                      <StarsIcon
                        sx={{
                          color: pointsInfo.streak_tier === "gold" ? "gold" : pointsInfo.streak_tier === "silver" ? "grey.600" : "#cd7f32",
                          fontSize: 20,
                        }}
                      />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Streak: {pointsInfo.streak_days} days
                  </Typography>
                  {pointsInfo.next_tier && (
                    <Typography variant="caption" color="text.secondary">
                      {pointsInfo.days_to_next_tier} days until {pointsInfo.next_tier} tier
                    </Typography>
                  )}
                  {pointsInfo.streak_reset_date && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                      Resets: {new Date(pointsInfo.streak_reset_date).toLocaleDateString()}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Info Box */}
              <Box sx={{ mt: 2, p: 1.5, bgcolor: "info.light", borderRadius: 1 }}>
                <Typography variant="caption" color="info.contrastText">
                  <strong>How to earn points:</strong>
                  <br />• 3 points per chat prompt (max 12 points/day)
                  <br />• 12 bonus points when you buy suggested products
                  <br />• Complete 30-day streak to unlock tiers (Bronze → Silver → Gold)
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                Unable to load points information
              </Typography>
            </Box>
          )}
        </Paper>

        <List sx={{ bgcolor: "background.paper", borderRadius: 2, overflow: "hidden", mb: 2 }}>
          <ListItem button onClick={() => setCouponsDialogOpen(true)}>
            <LocalOfferIcon sx={{ mr: 2, color: "text.secondary" }} />
            <ListItemText primary="My coupons" />
          </ListItem>
        </List>

        <Typography variant="subtitle2" sx={{ mb: 1, display: "block" }}>
          Delivery Addresses
        </Typography>
        <Box sx={{ bgcolor: "background.paper", borderRadius: 2, overflow: "hidden", mb: 2 }}>
          {addressesLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : addresses.length === 0 ? (
            <Box sx={{ px: 2, py: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                No saved addresses. Add one to use during checkout.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => handleOpenAddressDialog()}
                sx={{ borderRadius: 2 }}
              >
                Add Address
              </Button>
            </Box>
          ) : (
            <>
              <List disablePadding>
                {addresses.map((addr, idx) => (
                  <ListItem
                    key={addr._id}
                    divider={idx < addresses.length - 1}
                    sx={{ flexDirection: "column", alignItems: "flex-start", py: 2 }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", width: "100%", mb: 1 }}>
                      {addr.type === "home" ? (
                        <HomeIcon sx={{ mr: 1, color: "text.secondary", fontSize: 20 }} />
                      ) : (
                        <WorkIcon sx={{ mr: 1, color: "text.secondary", fontSize: 20 }} />
                      )}
                      <Typography variant="subtitle2" sx={{ textTransform: "capitalize", mr: 1 }}>
                        {addr.type}
                      </Typography>
                      {addr.is_default && (
                        <Typography
                          variant="caption"
                          sx={{
                            bgcolor: "primary.main",
                            color: "primary.contrastText",
                            px: 1,
                            py: 0.25,
                            borderRadius: 1,
                            mr: 1,
                          }}
                        >
                          Default
                        </Typography>
                      )}
                      <Box sx={{ flexGrow: 1 }} />
                      {!addr.is_default && (
                        <Button
                          size="small"
                          onClick={() => handleSetDefaultAddress(addr._id)}
                          sx={{ mr: 1, minWidth: "auto" }}
                        >
                          Set Default
                        </Button>
                      )}
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenAddressDialog(addr)}
                        sx={{ mr: 1, minWidth: "auto" }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDeleteAddress(addr._id)}
                        color="error"
                        sx={{ minWidth: "auto" }}
                      >
                        Delete
                      </Button>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "flex-start", width: "100%", pl: 4 }}>
                      <LocationOnIcon sx={{ mr: 1, color: "text.secondary", fontSize: 16, mt: 0.5 }} />
                      <Box>
                        <Typography variant="body2">{addr.street}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {addr.city}, {addr.state} {addr.pincode}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {addr.country}
                        </Typography>
                      </Box>
                    </Box>
                  </ListItem>
                ))}
              </List>
              <Box sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenAddressDialog()}
                  sx={{ borderRadius: 2 }}
                >
                  Add New Address
                </Button>
              </Box>
            </>
          )}
        </Box>

        <Typography variant="subtitle2" sx={{ mb: 1, display: "block" }}>
          Order history
        </Typography>
        <Box sx={{ bgcolor: "background.paper", borderRadius: 2, overflow: "hidden", mb: 2 }}>
          <ListItem button onClick={() => setOrderHistoryOpen((o) => !o)}>
            <HistoryIcon sx={{ mr: 2, color: "text.secondary" }} />
            <ListItemText primary={orderList.length ? `${orderList.length} orders` : "No orders yet"} />
            {orderHistoryOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </ListItem>
          <Collapse in={orderHistoryOpen}>
            {ordersLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : orderList.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ px: 2, pb: 2 }}>
                Your orders will appear here after checkout.
              </Typography>
            ) : (
              <List disablePadding>
                {orderList.map((o) => (
                  <ListItem
                    key={o.order_id}
                    divider
                    button
                    onClick={() => handleOrderClick(o.order_id)}
                    sx={{ cursor: "pointer" }}
                  >
                    <ListItemText
                      primary={`Order · ${formatDate(o.created_at)}`}
                      secondary={
                        o.payment_method === "pay_at_store"
                          ? `${o.item_count} items · ${o.pickup_status === "ready_for_pickup" ? "Packed & ready for pickup" : o.pickup_status === "packed" ? "Packed" : "Preparing"}`
                          : `${o.item_count} items · ${o.payment_status === "paid" ? "Paid" : o.payment_status}`
                      }
                    />
                    <ListItemSecondaryAction>
                      <Typography variant="body2" fontWeight={600}>
                        ${Number(o.total).toFixed(2)}
                      </Typography>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Collapse>
        </Box>

        <Button
          fullWidth
          variant="outlined"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{ mt: 3, borderRadius: 2 }}
        >
          Log out
        </Button>

        <Dialog open={Boolean(orderDetail)} onClose={() => setOrderDetail(null)} maxWidth="sm" fullWidth>
          <DialogTitle>Order details</DialogTitle>
          <DialogContent>
            {orderDetailLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                <CircularProgress />
              </Box>
            ) : orderDetail ? (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {formatDate(orderDetail.created_at)} · {orderDetail.payment_method === "pay_at_store" ? (orderDetail.pickup_status === "ready_for_pickup" ? "Packed & ready for pickup" : orderDetail.pickup_status === "packed" ? "Packed" : "Preparing") : orderDetail.payment_status} · ${Number(orderDetail.total).toFixed(2)}
                </Typography>
                <List dense>
                  {(orderDetail.items || []).map((item, idx) => (
                    <ListItem key={idx} divider sx={{ py: 1 }}>
                      <ListItemText
                        primary={item.product?.name || item.product_id}
                        secondary={`$${Number(item.price || 0).toFixed(2)} × ${item.quantity || 1}`}
                      />
                      <ListItemSecondaryAction>
                        <Button
                          size="small"
                          startIcon={<AddShoppingCartIcon />}
                          onClick={async () => {
                            try {
                              await cartApi.add(item.product_id, item.quantity || 1);
                            } catch {}
                            setOrderDetail(null);
                          }}
                        >
                          Add to cart
                        </Button>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<AddShoppingCartIcon />}
                  sx={{ mt: 2, borderRadius: 2 }}
                  onClick={async () => {
                    try {
                      for (const item of orderDetail.items || []) {
                        await cartApi.add(item.product_id, item.quantity || 1);
                      }
                    } catch {}
                    setOrderDetail(null);
                    router.push("/cart");
                  }}
                >
                  Reorder all
                </Button>
              </Box>
            ) : null}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOrderDetail(null)}>Close</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={showCongratsDialog && !!earnedCoupon} onClose={() => { setShowCongratsDialog(false); setEarnedCoupon(null); }} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ textAlign: "center", pt: 3 }}>
            Congratulations
          </DialogTitle>
          <DialogContent sx={{ textAlign: "center", pb: 1 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Thanks for ordering with home delivery. You&apos;ve earned a coupon!
            </Typography>
            <Box sx={{ bgcolor: "success.light", color: "success.contrastText", py: 2, px: 2, borderRadius: 2, mb: 2 }}>
              <Typography variant="h6" fontWeight={700}>
                {earnedCoupon?.label}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                Code: <strong>{earnedCoupon?.code}</strong>
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 1, opacity: 0.95 }}>
                Valid for {earnedCoupon?.valid_days_display || "1 month"}. Use at checkout.
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ justifyContent: "center", pb: 3, px: 3 }}>
            <Button variant="outlined" onClick={() => { setShowCongratsDialog(false); setEarnedCoupon(null); }} sx={{ borderRadius: 2 }}>
              Got it
            </Button>
            <Button variant="contained" onClick={() => { setShowCongratsDialog(false); setEarnedCoupon(null); router.push("/cart"); }} sx={{ borderRadius: 2 }}>
              Use in cart
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={couponsDialogOpen} onClose={() => setCouponsDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>My coupons</DialogTitle>
          <DialogContent>
            {earnedCouponsList.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                No active coupons. Complete a home delivery order to earn coupons!
              </Typography>
            ) : (
              <List dense>
                {earnedCouponsList.map((c) => (
                  <ListItem
                    key={c.code}
                    sx={{
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 2,
                      mb: 1,
                      bgcolor: "grey.50",
                    }}
                  >
                    <ListItemText
                      primary={c.name}
                      secondary={`Code: ${c.code} · Valid for ${c.valid_days_display || "1 month"}. Use at checkout.`}
                    />
                    <ListItemSecondaryAction>
                      <Button size="small" variant="outlined" onClick={() => { setCouponsDialogOpen(false); router.push("/cart"); }} sx={{ borderRadius: 2 }}>
                        Use in cart
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setCouponsDialogOpen(false)} sx={{ borderRadius: 2 }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={onboardingOpen || editOpen} onClose={() => { if (editOpen) setEditOpen(false); else if (user?.onboarded) setOnboardingOpen(false); }} maxWidth="sm" fullWidth>
          <DialogTitle>{onboardingOpen ? "Complete your profile" : "Edit profile"}</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Add your date of birth for birthday month discounts and preferences for better recommendations.
            </Typography>
            <TextField
              fullWidth
              label="Name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Date of birth"
              type="date"
              value={formDob}
              onChange={(e) => setFormDob(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
              helperText="We offer special discounts in your birthday month"
            />
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Preferred categories
              </Typography>
              <Button
                fullWidth
                variant="outlined"
                onClick={(e) => setCategoriesAnchor(e.currentTarget)}
                sx={{ justifyContent: "flex-start", textAlign: "left", borderRadius: 2 }}
              >
                {formCategories.length ? formCategories.join(", ") : "Select categories"}
              </Button>
              <Popover
                open={Boolean(categoriesAnchor)}
                anchorEl={categoriesAnchor}
                onClose={() => setCategoriesAnchor(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                transformOrigin={{ vertical: "top", horizontal: "left" }}
                PaperProps={{ sx: { maxHeight: 320, width: 280 } }}
              >
                <Box sx={{ p: 1 }}>
                  {PREF_CATEGORIES.map((c) => (
                    <ListItemButton
                      key={c}
                      onClick={() => handleCategoryToggle(c)}
                      dense
                      sx={{
                        borderRadius: 1,
                        fontWeight: formCategories.includes(c) ? 700 : 400,
                        color: formCategories.includes(c) ? "primary.main" : "text.primary",
                        bgcolor: formCategories.includes(c) ? "action.selected" : "transparent",
                      }}
                    >
                      <Checkbox
                        size="small"
                        checked={formCategories.includes(c)}
                        sx={{ mr: 1, p: 0.5 }}
                        readOnly
                      />
                      <ListItemText primary={c} />
                    </ListItemButton>
                  ))}
                  <Button fullWidth variant="contained" onClick={handleCategoriesConfirm} sx={{ mt: 2, borderRadius: 2 }}>
                    Confirm
                  </Button>
                </Box>
              </Popover>
            </Box>
            <FormControl fullWidth>
              <InputLabel>Budget</InputLabel>
              <Select value={formBudget} onChange={(e) => setFormBudget(e.target.value)} label="Budget">
                {BUDGET_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setEditOpen(false); if (user?.onboarded) setOnboardingOpen(false); }}>Cancel</Button>
            <Button variant="contained" onClick={handleSaveProfile} disabled={saving}>
              {saving ? <CircularProgress size={24} /> : "Save"}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={addressDialogOpen} onClose={handleCloseAddressDialog} maxWidth="sm" fullWidth>
          <DialogTitle>{editingAddress ? "Edit Address" : "Add New Address"}</DialogTitle>
          <DialogContent>
            <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
              <InputLabel>Address Type</InputLabel>
              <Select
                value={addressForm.type}
                onChange={(e) => setAddressForm({ ...addressForm, type: e.target.value })}
                label="Address Type"
              >
                <MenuItem value="home">Home</MenuItem>
                <MenuItem value="work">Work</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Street Address"
              value={addressForm.street}
              onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
              sx={{ mb: 2 }}
              required
            />
            <TextField
              fullWidth
              label="City"
              value={addressForm.city}
              onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
              sx={{ mb: 2 }}
              required
            />
            <TextField
              fullWidth
              label="State"
              value={addressForm.state}
              onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
              sx={{ mb: 2 }}
              required
            />
            <TextField
              fullWidth
              label="Pincode"
              value={addressForm.pincode}
              onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
              sx={{ mb: 2 }}
              required
            />
            <TextField
              fullWidth
              label="Country"
              value={addressForm.country}
              onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
              sx={{ mb: 2 }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={addressForm.is_default}
                  onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                />
              }
              label="Set as default address"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAddressDialog}>Cancel</Button>
            <Button variant="contained" onClick={handleSaveAddress} disabled={saving}>
              {saving ? <CircularProgress size={24} /> : "Save"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  );
}
