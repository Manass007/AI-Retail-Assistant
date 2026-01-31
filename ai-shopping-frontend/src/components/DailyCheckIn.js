import { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Chip,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import { gamification } from "@/lib/api";
import { useSnackbar } from "@/context/SnackbarContext";

const MILESTONES = [
  { day: 1, reward: "2% off", icon: LocalOfferIcon },
  { day: 3, reward: "Free delivery", icon: LocalOfferIcon },
  { day: 7, reward: "5% off", icon: LocalOfferIcon },
  { day: 30, reward: "Free gift", icon: CardGiftcardIcon },
];

export default function DailyCheckIn() {
  const { showSnackbar } = useSnackbar();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const data = await gamification.dailyCheckin.status();
      setStatus(data);
    } catch (error) {
      console.error("Failed to fetch check-in status:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleClaim = async () => {
    try {
      setClaiming(true);
      const data = await gamification.dailyCheckin.claim();
      showSnackbar(data.message || "Reward claimed successfully!", "success");
      await fetchStatus();
    } catch (error) {
      showSnackbar(error.message || "Failed to claim reward", "error");
    } finally {
      setClaiming(false);
    }
  };

  if (loading || !status) {
    return (
      <Card sx={{ mb: 2, borderRadius: 2 }}>
        <CardContent>
          <Typography>Loading...</Typography>
        </CardContent>
      </Card>
    );
  }

  const { streak, can_claim, next_reward_day, next_reward_description, monthly_gift_eligible, monthly_gift_used } = status;

  // Calculate progress to next milestone
  let progress = 0;
  if (streak >= 30) {
    progress = 100;
  } else if (streak >= 7) {
    progress = 70 + ((streak - 7) / 23) * 30; // 70% to 100% for days 7-30
  } else if (streak >= 3) {
    progress = 30 + ((streak - 3) / 4) * 40; // 30% to 70% for days 3-7
  } else if (streak >= 1) {
    progress = 10 + ((streak - 1) / 2) * 20; // 10% to 30% for days 1-3
  } else {
    progress = (streak / 1) * 10; // 0% to 10% for day 0-1
  }

  return (
    <Card sx={{ mb: 2, borderRadius: 2, bgcolor: "background.paper" }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h6" sx={{ fontSize: "1.125rem", fontWeight: 600 }}>
            Daily Check-In
          </Typography>
          <Chip
            label={`${streak} day${streak !== 1 ? "s" : ""}`}
            color="primary"
            size="small"
            sx={{ fontWeight: 600 }}
          />
        </Box>

        {monthly_gift_eligible && !monthly_gift_used && (
          <Box
            sx={{
              bgcolor: "success.light",
              color: "success.contrastText",
              p: 1.5,
              borderRadius: 2,
              mb: 2,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <CardGiftcardIcon />
            <Typography variant="body2" fontWeight={600}>
              Free keychain available with your next purchase!
            </Typography>
          </Box>
        )}

        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            {MILESTONES.map((milestone, idx) => {
              const Icon = milestone.icon;
              const isReached = streak >= milestone.day;
              const isNext = next_reward_day === milestone.day;
              
              return (
                <Box
                  key={milestone.day}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    flex: 1,
                    position: "relative",
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: isReached ? "primary.main" : isNext ? "action.selected" : "action.disabledBackground",
                      color: isReached ? "primary.contrastText" : "text.secondary",
                      mb: 0.5,
                      border: isNext ? "2px solid" : "none",
                      borderColor: isNext ? "primary.main" : "transparent",
                    }}
                  >
                    {isReached ? (
                      <CheckCircleIcon fontSize="small" />
                    ) : (
                      <Icon fontSize="small" />
                    )}
                  </Box>
                  <Typography variant="caption" sx={{ textAlign: "center", fontSize: "0.65rem" }}>
                    Day {milestone.day}
                  </Typography>
                  <Typography variant="caption" sx={{ textAlign: "center", fontSize: "0.6rem", color: "text.secondary" }}>
                    {milestone.reward}
                  </Typography>
                </Box>
              );
            })}
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(progress, 100)}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>

        {next_reward_day && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: "center" }}>
            Next reward: {next_reward_description} at Day {next_reward_day}
          </Typography>
        )}

        <Button
          fullWidth
          variant="contained"
          onClick={handleClaim}
          disabled={!can_claim || claiming}
          sx={{ borderRadius: 2, py: 1.5 }}
        >
          {claiming ? "Claiming..." : can_claim ? "Claim Today's Reward" : "Already Claimed Today"}
        </Button>

        {!can_claim && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "center", mt: 1 }}>
            Come back tomorrow to continue your streak!
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
