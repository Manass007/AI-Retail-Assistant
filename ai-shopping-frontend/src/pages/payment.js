import Head from "next/head";
import Script from "next/script";
import { useRouter } from "next/router";
import { useState, useEffect, useRef } from "react";
import { Box, Typography, Button, CircularProgress, Alert, Paper, Container } from "@mui/material";
import PaymentIcon from "@mui/icons-material/Payment";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import { useAuth } from "@/context/AuthContext";
import { payments as paymentsApi, cart as cartApi } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function Payment() {
  const router = useRouter();
  const { order_id, total } = router.query;
  const { isLoggedIn } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [razorpayOrderId, setRazorpayOrderId] = useState("");
  const [keyId, setKeyId] = useState("");
  const [paying, setPaying] = useState(false);
  const razorpayLoaded = useRef(false);

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login");
    if (!order_id || !total) return;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await paymentsApi.createOrder(order_id, parseFloat(total));
        setRazorpayOrderId(data.razorpay_order_id || "");
        setKeyId(data.key_id || "");
      } catch (e) {
        const msg = e.message || "";
        if (msg === "Failed to fetch" || msg.includes("fetch")) {
          setError(
            "Network error. Is the backend running? Set NEXT_PUBLIC_API_URL in .env.local (e.g. " +
              API_URL +
              ") and ensure the backend is started."
          );
        } else {
          setError(msg || "Could not create payment. Check Razorpay credentials in backend .env");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [isLoggedIn, order_id, total]);

  const openRazorpayCheckout = () => {
    if (!window.Razorpay || !keyId || !razorpayOrderId || !order_id) return;
    setPaying(true);
    const amount = Math.round(parseFloat(total) * 100); // cents for USD
    const options = {
      key: keyId,
      amount,
      currency: "USD",
      name: "AI Shopping Assistant",
      description: "Order " + order_id,
      order_id: razorpayOrderId,
      // Enable easy payment methods (UPI, wallets, netbanking, cards)
      method: {
        upi: true,
        card: true,
        netbanking: true,
        wallet: true,
        emi: false,
      },
      handler: async (res) => {
        try {
          const data = await paymentsApi.verify(order_id, res.razorpay_payment_id, res.razorpay_order_id, res.razorpay_signature);
          if (data?.earned_coupon && typeof sessionStorage !== "undefined") {
            sessionStorage.setItem("earnedCoupon", JSON.stringify(data.earned_coupon));
          }
          // Clear cart on successful payment
          try {
            await cartApi.clear();
          } catch (cartError) {
            console.error("Failed to clear cart:", cartError);
          }
          router.push("/profile?payment=success");
        } catch (e) {
          setError(e.message || "Payment verification failed.");
        } finally {
          setPaying(false);
        }
      },
      prefill: { email: "" },
      theme: { color: "#1976d2" },
      modal: { 
        ondismiss: () => setPaying(false),
        // Use old UI
        animation: false,
      },
      // Retry option for better UX
      retry: {
        enabled: true,
        max_count: 3,
      },
    };
    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", async () => {
      setError("Payment failed or was cancelled.");
      setPaying(false);
      // Clear cart on payment failure (order was created but payment failed)
      try {
        await cartApi.clear();
      } catch (cartError) {
        console.error("Failed to clear cart:", cartError);
      }
    });
    rzp.open();
  };

  useEffect(() => {
    if (loading || error || !razorpayOrderId || !keyId || paying) return;
    if (typeof window !== "undefined" && window.Razorpay) {
      razorpayLoaded.current = true;
    }
  }, [loading, error, razorpayOrderId, keyId, paying]);

  if (!isLoggedIn) return null;

  return (
    <>
      <Head>
        <title>Payment · AIVA</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/aiva_logo1.png" />
      </Head>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => {
          razorpayLoaded.current = true;
        }}
      />
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
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
        <PaymentIcon
          sx={{
            position: "absolute",
            top: { xs: "10%", md: "15%" },
            left: { xs: "5%", md: "10%" },
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
        <CreditCardIcon
          sx={{
            position: "absolute",
            top: { xs: "8%", md: "12%" },
            right: { xs: "5%", md: "12%" },
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
        <AccountBalanceWalletIcon
          sx={{
            position: "absolute",
            bottom: { xs: "15%", md: "20%" },
            left: { xs: "8%", md: "15%" },
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
        <ShoppingCartIcon
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

        <Container maxWidth="sm" sx={{ position: "relative", zIndex: 1 }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 4 },
              borderRadius: 3,
              bgcolor: "background.paper",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
            }}
          >
            <Box sx={{ textAlign: "center", mb: 4 }}>
              <Box
                component="img"
                src="/aiva_logo1.png"
                alt="AIVA Logo"
                sx={{
                  width: { xs: 80, sm: 100, md: 120 },
                  height: "auto",
                  mb: 2,
                  borderRadius: 2,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              />
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: "2rem", sm: "2.5rem" },
                  fontWeight: 700,
                  mb: 1,
                  color: "text.primary",
                }}
              >
                Complete Payment
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Secure payment powered by Razorpay
              </Typography>
            </Box>

            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <>
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => router.push("/")}
                  sx={{ borderRadius: 2, py: 1.5, textTransform: "none", fontSize: "1rem", fontWeight: 600 }}
                >
                  Go to Home
                </Button>
              </>
            ) : (
              <>
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
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={paying}
                  onClick={openRazorpayCheckout}
                  sx={{
                    borderRadius: 2,
                    py: 1.5,
                    textTransform: "none",
                    fontSize: "1rem",
                    fontWeight: 600,
                    mb: 1.5,
                  }}
                >
                  {paying ? <CircularProgress size={24} color="inherit" /> : "Pay with Razorpay"}
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => router.push("/")}
                  sx={{
                    borderRadius: 2,
                    py: 1.5,
                    textTransform: "none",
                    fontSize: "1rem",
                    fontWeight: 600,
                    mb: 1.5,
                  }}
                >
                  Cancel Payment
                </Button>
                <Button
                  variant="text"
                  fullWidth
                  onClick={() => router.push("/profile")}
                  sx={{
                    textTransform: "none",
                    color: "text.secondary",
                  }}
                >
                  Back to Profile
                </Button>
              </>
            )}
          </Paper>
        </Container>
      </Box>
    </>
  );
}
