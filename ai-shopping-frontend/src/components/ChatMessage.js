import { Box, Typography, Paper } from "@mui/material";

export default function ChatMessage({ message, isUser }) {
  return (
    <Box sx={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", mb: 1.5 }}>
      <Paper
        elevation={0}
        sx={{
          maxWidth: "85%",
          px: 2,
          py: 1.5,
          borderRadius: 2,
          bgcolor: isUser ? "primary.main" : "grey.100",
          color: isUser ? "white" : "text.primary",
        }}
      >
        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
          {message}
        </Typography>
      </Paper>
    </Box>
  );
}
