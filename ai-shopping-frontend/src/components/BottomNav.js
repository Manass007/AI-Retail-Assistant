import { useRouter } from "next/router";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import HomeIcon from "@mui/icons-material/Home";
import ChatBubbleIcon from "@mui/icons-material/ChatBubble";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import PersonIcon from "@mui/icons-material/Person";

const routes = [
  { path: "/", label: "Home", Icon: HomeOutlinedIcon, IconActive: HomeIcon },
  { path: "/chat", label: "Chat", Icon: ChatBubbleOutlineIcon, IconActive: ChatBubbleIcon },
  { path: "/cart", label: "Cart", Icon: ShoppingCartOutlinedIcon, IconActive: ShoppingCartIcon },
  { path: "/profile", label: "Profile", Icon: PersonOutlineIcon, IconActive: PersonIcon },
];

export default function BottomNav() {
  const router = useRouter();
  const pathname = router.pathname;
  const value = routes.findIndex((r) => r.path === pathname);
  const current = value >= 0 ? value : 0;

  return (
    <BottomNavigation
      value={current}
      onChange={(_, v) => router.push(routes[v]?.path ?? "/")}
      showLabels
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        bgcolor: "background.paper",
        zIndex: 1100,
      }}
    >
      {routes.map((r) => {
        const active = pathname === r.path;
        const Icon = active ? r.IconActive : r.Icon;
        return (
          <BottomNavigationAction
            key={r.path}
            label={r.label}
            icon={<Icon />}
            sx={{
              color: active ? "primary.main" : "text.secondary",
              "& .MuiBottomNavigationAction-label": {
                fontSize: "0.7rem",
              },
            }}
          />
        );
      })}
    </BottomNavigation>
  );
}
