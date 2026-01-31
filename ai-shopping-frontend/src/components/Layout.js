import { Box } from "@mui/material";
import BottomNav from "./BottomNav";

export default function Layout({ children, showBottomNav = true }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        pb: showBottomNav ? 8 : 0,
        bgcolor: "background.default",
      }}
    >
      {children}
      {showBottomNav && <BottomNav />}
    </Box>
  );
}
