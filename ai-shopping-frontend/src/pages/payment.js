import Head from "next/head";
import Script from "next/script";
import { useRouter } from "next/router";
import { useState, useEffect, useRef } from "react";
import { Box, Typography, Button, CircularProgress, Alert } from "@mui/material";
import { useAuth } from "@/context/AuthContext";
import { payments as paymentsApi } from "@/lib/api";

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
    const amount = Math.round(parseFloat(total) * 100); // paise
    const options = {
      key: keyId,
      amount,
      currency: "INR",
      name: "AI Shopping Assistant",
      description: "Order " + order_id,
      order_id: razorpayOrderId,
      handler: async (res) => {
        try {
          const data = await paymentsApi.verify(order_id, res.razorpay_payment_id, res.razorpay_order_id, res.razorpay_signature);
          if (data?.earned_coupon && typeof sessionStorage !== "undefined") {
            sessionStorage.setItem("earnedCoupon", JSON.stringify(data.earned_coupon));
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
      modal: { ondismiss: () => setPaying(false) },
    };
    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", () => {
      setError("Payment failed or was cancelled.");
      setPaying(false);
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
        <title>Payment · AI Shopping Assistant</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => {
          razorpayLoaded.current = true;
        }}
      />
      <Box sx={{ px: 2, py: 4 }}>
        <Typography variant="h1" sx={{ fontSize: "1.5rem", mb: 2 }}>
          Complete payment
        </Typography>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
            <Button variant="contained" onClick={() => router.push("/profile")} sx={{ borderRadius: 2 }}>
              Back to profile
            </Button>
          </>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Order total: ${Number(total).toFixed(2)}
            </Typography>
            <Button
              variant="contained"
              fullWidth
              size="large"
              disabled={paying}
              onClick={openRazorpayCheckout}
              sx={{ mt: 2, borderRadius: 2, py: 1.5 }}
            >
              {paying ? <CircularProgress size={24} color="inherit" /> : "Pay with Razorpay"}
            </Button>
            <Button variant="text" fullWidth sx={{ mt: 1 }} onClick={() => router.push("/profile")}>
              Back to profile
            </Button>
          </>
        )}
      </Box>
    </>
  );
}
