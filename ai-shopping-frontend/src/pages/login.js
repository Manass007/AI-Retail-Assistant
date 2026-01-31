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
} from "@mui/material";
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
        <title>Login · AI Shopping Assistant</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
          p: 2,
        }}
      >
        <Container maxWidth="sm">
          <Typography variant="h1" align="center" sx={{ mb: 2 }}>
            AI Shopping Assistant
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Sign in with OTP
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          {step === "email" && (
            <Box component="form" onSubmit={handleSendOtp}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                sx={{ mb: 2 }}
              />
              <Button fullWidth type="submit" variant="contained" size="large" disabled={loading}>
                {loading ? <CircularProgress size={24} /> : "Send OTP"}
              </Button>
            </Box>
          )}

          {step === "otp" && (
            <Box component="form" onSubmit={handleVerifyOtp}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                OTP sent to {email}
              </Typography>
              <TextField
                fullWidth
                label="OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputProps={{ maxLength: 6 }}
                required
                sx={{ mb: 2 }}
              />
              <Button fullWidth type="submit" variant="contained" size="large" disabled={loading}>
                {loading ? <CircularProgress size={24} /> : "Verify"}
              </Button>
              <Button fullWidth sx={{ mt: 1 }} onClick={() => setStep("email")}>
                Change email
              </Button>
            </Box>
          )}

          {step === "register" && needsRegister && (
            <Box component="form" onSubmit={handleRegister}>
              <TextField
                fullWidth
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                sx={{ mb: 2 }}
              />
              <Button fullWidth type="submit" variant="contained" size="large" disabled={loading}>
                {loading ? <CircularProgress size={24} /> : "Complete sign up"}
              </Button>
            </Box>
          )}
        </Container>
      </Box>
    </>
  );
}
