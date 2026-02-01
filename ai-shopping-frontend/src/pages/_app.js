import "@/styles/globals.css";
import { useRouter } from "next/router";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "@/styles/theme";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { SnackbarProvider } from "@/context/SnackbarContext";
import Layout from "@/components/Layout";

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const noLayout = router.pathname === "/login";
  const hideBottomNav = ["/checkout", "/payment"].includes(router.pathname);
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <CartProvider>
        <SnackbarProvider>
          {noLayout ? (
            <Component {...pageProps} />
          ) : (
            <Layout showBottomNav={!hideBottomNav}>
              <Component {...pageProps} />
            </Layout>
          )}
        </SnackbarProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
