import Head from "next/head";
import { useRouter } from "next/router";
import { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Paper,
  Button,
  Chip,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import { useAuth } from "@/context/AuthContext";
import { chat as chatApi, cart as cartApi, orders as ordersApi } from "@/lib/api";
import ChatMessage from "@/components/ChatMessage";
import { QuickAddChips, QuickAddProductCards } from "@/components/QuickAddChips";

const QUICK_PROMPTS = [
  "I need milk, wheat flour and muesli for pickup",
  "Show my last ordered items",
  "I want perfume but it's expensive",
  "What bundle deals do you have?",
];

export default function Chat() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [quickAddProducts, setQuickAddProducts] = useState([]);
  const [lastOrdered, setLastOrdered] = useState([]);
  const [frequentlyOrdered, setFrequentlyOrdered] = useState([]);
  const [pickupStores, setPickupStores] = useState([]);
  const [bundleOffers, setBundleOffers] = useState([]);
  const [lastAddedToCart, setLastAddedToCart] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }
  }, [isLoggedIn, router]);

  useEffect(() => {
    if (!isLoggedIn) return;
    (async () => {
      try {
        const data = await ordersApi.history();
        setLastOrdered(data?.last_ordered || []);
        setFrequentlyOrdered(data?.frequently_ordered || []);
      } catch {
        setLastOrdered([]);
        setFrequentlyOrdered([]);
      }
    })();
  }, [isLoggedIn]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text?.trim() || loading) return;
    const userMessage = text.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);
    setQuickAddProducts([]);
    setLastAddedToCart(false);
    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const data = await chatApi.send(userMessage, history);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply || "I'm here to help!" },
      ]);
      setQuickAddProducts(data.quick_add_products || []);
      setLastOrdered(data.last_ordered || []);
      setFrequentlyOrdered(data.frequently_ordered || []);
      setPickupStores(data.pickup_stores || []);
      setBundleOffers(data.bundle_offers || []);
      if (data.added_to_cart) setLastAddedToCart(true);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (productId) => {
    try {
      await cartApi.add(productId, 1);
      setQuickAddProducts((prev) => prev.filter((p) => p._id !== productId));
    } catch {}
  };

  if (!isLoggedIn) return null;

  return (
    <>
      <Head>
        <title>Chat · AIVA</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/aiva_logo1.png" />
      </Head>
      <Box sx={{ display: "flex", flexDirection: "column", height: "calc(100vh - 64px)", px: 2 }}>
        <Typography variant="h1" sx={{ fontSize: "1.25rem", py: 2 }}>
          Chat with assistant
        </Typography>

        <Box sx={{ flex: 1, overflowY: "auto", mb: 2 }}>
          {messages.length === 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Quick prompts
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
                {QUICK_PROMPTS.map((prompt) => (
                  <Chip
                    key={prompt}
                    label={prompt.length > 35 ? prompt.slice(0, 35) + "…" : prompt}
                    onClick={() => sendMessage(prompt)}
                    sx={{ borderRadius: 2 }}
                  />
                ))}
              </Box>
              {lastOrdered.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                    Last order
                  </Typography>
                  <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                    {lastOrdered.slice(0, 5).map((item) => (
                      <Chip
                        key={item.product_id}
                        size="small"
                        label={item.product?.name ? `${item.product.name} · $${Number(item.product.price || 0).toFixed(2)}` : item.product_id}
                        onClick={() => item.product_id && handleAddToCart(item.product_id)}
                        sx={{ borderRadius: 1.5, fontSize: "0.7rem" }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
              {frequentlyOrdered.length > 0 && (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                    Frequently ordered
                  </Typography>
                  <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                    {frequentlyOrdered.slice(0, 5).map((item) => (
                      <Chip
                        key={item.product_id}
                        size="small"
                        label={item.product?.name ? `${item.product.name} · $${Number(item.product.price || 0).toFixed(2)}` : item.product_id}
                        onClick={() => item.product_id && handleAddToCart(item.product_id)}
                        sx={{ borderRadius: 1.5, fontSize: "0.7rem" }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
          {messages.map((m, i) => (
            <ChatMessage key={i} message={m.content} isUser={m.role === "user"} />
          ))}
          {messages.length > 0 && lastAddedToCart && (
            <Button
              variant="contained"
              startIcon={<ShoppingCartIcon />}
              onClick={() => router.push("/cart")}
              sx={{ mt: 1, mb: 2, borderRadius: 2 }}
            >
              Go to Cart
            </Button>
          )}
          {messages.length > 0 && quickAddProducts.length > 0 && (
            <QuickAddProductCards products={quickAddProducts} onAddToCart={handleAddToCart} small />
          )}
          {loading && (
            <Typography variant="body2" color="text.secondary">
              …
            </Typography>
          )}
          <div ref={bottomRef} />
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: 1,
            pb: 2,
            borderTop: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Box sx={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
            <TextField
              fullWidth
              placeholder="Ask for ideas, groceries, or deals…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
              multiline
              maxRows={3}
              size="small"
              sx={{
                "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "grey.50" },
              }}
            />
            <IconButton
              color="primary"
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              sx={{ flexShrink: 0 }}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Paper>
      </Box>
    </>
  );
}
