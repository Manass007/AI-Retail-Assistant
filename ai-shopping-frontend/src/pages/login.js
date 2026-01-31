import Head from "next/head";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Container,
  Alert,
  CircularProgress,
  IconButton,
} from "@mui/material";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import LocalGroceryStoreIcon from "@mui/icons-material/LocalGroceryStore";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import StoreIcon from "@mui/icons-material/Store";
import CategoryIcon from "@mui/icons-material/Category";
import InventoryIcon from "@mui/icons-material/Inventory";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useAuth } from "@/context/AuthContext";
import { auth as authApi } from "@/lib/api";

export default function Login() {
  const router = useRouter();
  const { login, register, isLoggedIn } = useAuth();
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsRegister, setNeedsRegister] = useState(false);

  useEffect(() => {
    if (isLoggedIn) router.replace("/");
  }, [isLoggedIn, router]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.sendOtp(email);
      setStep("otp");
    } catch (e) {
      setError(e.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login(email, otp);
      if (result.needsRegister) {
        setNeedsRegister(true);
        setStep("register");
      } else {
        router.replace("/");
      }
    } catch (e) {
      setError(e.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register({ email, name, phone: "", preferences: { categories: [], budget: "mid" } });
      router.replace("/");
    } catch (e) {
      setError(e.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login · AIVA</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/aiva_logo1.png" />
      </Head>
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
        {/* Floating Product Icons */}
        <ShoppingBagIcon
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
        <LocalGroceryStoreIcon
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
        <ShoppingCartIcon
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
        <StoreIcon
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
        <CategoryIcon
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
        <InventoryIcon
          sx={{
            position: "absolute",
            top: { xs: "55%", md: "50%" },
            right: { xs: "3%", md: "5%" },
            fontSize: { xs: 30, md: 50 },
            opacity: 0.15,
            color: "text.secondary",
            zIndex: 0,
            display: { xs: "none", lg: "block" },
            animation: "float 11s ease-in-out infinite",
            "@keyframes float": {
              "0%, 100%": { transform: "translateY(0px)" },
              "50%": { transform: "translateY(-14px)" },
            },
          }}
        />

        {/* Back Button - Only visible on email step */}
        {step === "email" && (
          <IconButton
            onClick={() => {
              if (window.history.length > 1) {
                router.back();
              } else {
                router.push("/");
              }
            }}
            sx={{
              position: "absolute",
              top: { xs: 8, sm: 16 },
              left: { xs: 8, sm: 16 },
              bgcolor: "rgba(255,255,255,0.9)",
              zIndex: 2,
              width: { xs: 40, sm: 48 },
              height: { xs: 40, sm: 48 },
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              "&:hover": {
                bgcolor: "rgba(255,255,255,1)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              },
            }}
            aria-label="Go back"
          >
            <ArrowBackIcon />
          </IconButton>
        )}

        <Container maxWidth="sm" sx={{ position: "relative", zIndex: 1 }}>
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Box
              onClick={() => router.push("/")}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: { xs: 100, sm: 120, md: 140 },
                height: { xs: 100, sm: 120, md: 140 },
                borderRadius: "50%",
                bgcolor: "background.paper",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                mb: 2,
                cursor: "pointer",
                transition: "transform 0.2s, boxShadow 0.2s",
                p: 2,
                "&:hover": {
                  transform: "scale(1.05)",
                  boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
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
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: "2.5rem", sm: "3.5rem", md: "4rem" },
                fontWeight: 700,
                mb: 1,
                color: "text.primary",
              }}
            >
              Hey 👋 I'm AIVA!
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{
                fontSize: { xs: "1rem", sm: "1.25rem" },
                fontWeight: 400,
                letterSpacing: "0.5px",
              }}
            >
              Your Personal AI Shopping Assistant
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          {step === "email" && (
            <Box component="form" onSubmit={handleSendOtp} sx={{ maxWidth: 400, mx: "auto" }}>
              <Typography
                variant="body1"
                sx={{
                  mb: 1,
                  fontWeight: 500,
                  color: "text.primary",
                  textAlign: "center",
                }}
              >
                Enter your email to get started
              </Typography>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                sx={{
                  mb: 3,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    bgcolor: "background.paper",
                  },
                }}
              />
              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: "none",
                  fontSize: "1rem",
                  fontWeight: 600,
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : "Continue with Email"}
              </Button>
            </Box>
          )}

          {step === "otp" && (
            <Box component="form" onSubmit={handleVerifyOtp} sx={{ maxWidth: 400, mx: "auto" }}>
              <Typography
                variant="body1"
                sx={{
                  mb: 1,
                  fontWeight: 500,
                  color: "text.primary",
                  textAlign: "center",
                }}
              >
                Check your email
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 3, textAlign: "center", lineHeight: 1.6 }}
              >
                We've sent a 6-digit code to <strong>{email}</strong>. Please enter it below to continue.
              </Typography>
              <TextField
                fullWidth
                label="Enter verification code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputProps={{ maxLength: 6, inputMode: "numeric" }}
                required
                placeholder="000000"
                sx={{
                  mb: 3,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    bgcolor: "background.paper",
                  },
                }}
              />
              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: "none",
                  fontSize: "1rem",
                  fontWeight: 600,
                  mb: 1.5,
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : "Verify Code"}
              </Button>
              <Button
                fullWidth
                variant="text"
                onClick={() => setStep("email")}
                sx={{
                  textTransform: "none",
                  color: "text.secondary",
                }}
              >
                Change email address
              </Button>
            </Box>
          )}

          {step === "register" && needsRegister && (
            <Box component="form" onSubmit={handleRegister} sx={{ maxWidth: 400, mx: "auto" }}>
              <Typography
                variant="body1"
                sx={{
                  mb: 1,
                  fontWeight: 500,
                  color: "text.primary",
                  textAlign: "center",
                }}
              >
                Complete your profile
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 3, textAlign: "center", lineHeight: 1.6 }}
              >
                We just need your name to personalize your AIVA experience.
              </Typography>
              <TextField
                fullWidth
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="John Doe"
                sx={{
                  mb: 3,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    bgcolor: "background.paper",
                  },
                }}
              />
              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: "none",
                  fontSize: "1rem",
                  fontWeight: 600,
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : "Get Started with AIVA"}
              </Button>
            </Box>
          )}
        </Container>
      </Box>
    </>
  );
}
