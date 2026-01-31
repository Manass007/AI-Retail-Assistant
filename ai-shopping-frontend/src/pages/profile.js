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
  InputLabel,
  Select,
  MenuItem,
  Popover,
  Checkbox,
  ListItemButton,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import HistoryIcon from "@mui/icons-material/History";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import CakeIcon from "@mui/icons-material/Cake";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import { useAuth } from "@/context/AuthContext";
import { orders as ordersApi, auth as authApi, cart as cartApi, offers as offersApi } from "@/lib/api";

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

  if (!isLoggedIn) return null;

  return (
    <>
      <Head>
        <title>Profile · AI Shopping Assistant</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Box sx={{ px: 2, py: 2 }}>
        <Typography variant="h1" sx={{ fontSize: "1.5rem", mb: 2 }}>
          Profile
        </Typography>
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
        <List sx={{ bgcolor: "background.paper", borderRadius: 2, overflow: "hidden", mb: 2 }}>
          <ListItem button onClick={() => router.push("/cart")}>
            <ShoppingBagIcon sx={{ mr: 2, color: "text.secondary" }} />
            <ListItemText primary="Cart" />
          </ListItem>
          <Divider />
          <ListItem button onClick={() => router.push("/checkout")}>
            <ListItemText primary="Checkout" />
          </ListItem>
          <Divider />
          <ListItem button onClick={() => setCouponsDialogOpen(true)}>
            <LocalOfferIcon sx={{ mr: 2, color: "text.secondary" }} />
            <ListItemText primary="My coupons" />
          </ListItem>
        </List>

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
      </Box>
    </>
  );
}
