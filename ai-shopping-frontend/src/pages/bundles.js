import Head from "next/head";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { Box, Typography, Card, CardContent, CardMedia, Button, CircularProgress } from "@mui/material";
import { useAuth } from "@/context/AuthContext";
import { bundles as bundlesApi, cart as cartApi } from "@/lib/api";

export default function Bundles() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await bundlesApi.list();
        setList(data?.bundles || []);
      } catch {
        setList([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleAddBundle = async (bundle) => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    try {
      for (const p of bundle.products || []) {
        await cartApi.add(p._id, 1);
      }
      router.push("/cart");
    } catch (e) {
      if (e.message?.includes("401")) router.push("/login");
    }
  };

  return (
    <>
      <Head>
        <title>Bundle deals · AIVA</title>
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
            Bundle Deals
          </Typography>
        </Box>
        <Typography variant="h1" sx={{ fontSize: "1.5rem", mb: 2 }}>
          Bundle deals
        </Typography>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : list.length === 0 ? (
          <Typography color="text.secondary">No bundles right now.</Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {list.map((b) => (
              <Card key={b._id} elevation={0} sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {b.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {b.description}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {b.discount_percent}% off · ${b.total_original?.toFixed(2)} → $
                    {b.total_after_discount?.toFixed(2)}
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    sx={{ mt: 2, borderRadius: 2 }}
                    onClick={() => handleAddBundle(b)}
                  >
                    Add bundle to cart
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>
    </>
  );
}
