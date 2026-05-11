import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Fade,
  Paper,
  Slider,
} from '@mui/material';
import { Star } from '@mui/icons-material';
import { fetchNotifications } from '../services/api';
import { computePriorityScore } from '../types/notification';
import type { NotificationItem } from '../types/notification';
import NotificationCard from '../components/NotificationCard';
import { useViewedNotifications } from '../hooks/useViewedNotifications';

export default function PriorityInbox() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // User configurable 'N' for top N notifications
  const [topN, setTopN] = useState<number>(10);

  const { isViewed } = useViewedNotifications();

  // Fetch data
  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await fetchNotifications({ limit: 100 });
        if (mounted) {
          setNotifications(data.notifications || []);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load notifications');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  // Compute Priority (Stage 6 logic)
  const priorityNotifications = React.useMemo(() => {
    // Only consider unread notifications for priority inbox as per requirements
    const unread = notifications.filter((n) => !isViewed(n.ID));
    
    // Score and sort
    const scored = unread.map((notif) => ({
      notification: notif,
      score: computePriorityScore(notif),
    }));

    scored.sort((a, b) => b.score - a.score);

    // Return top N
    return scored.slice(0, topN);
  }, [notifications, topN, isViewed]);

  const handleSliderChange = (_event: Event, newValue: number | number[]) => {
    setTopN(newValue as number);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1.5 }}>
        <Box
          sx={{
            background: 'linear-gradient(135deg, #FFB347 0%, #FF8A00 100%)',
            borderRadius: '50%',
            p: 1,
            display: 'flex',
          }}
        >
          <Star sx={{ color: '#fff' }} />
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Priority Inbox
        </Typography>
      </Box>

      {/* Configuration Panel */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          background: 'rgba(255, 179, 71, 0.05)',
          border: '1px solid rgba(255, 179, 71, 0.2)',
          borderRadius: 3,
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          Display Top {topN} Notifications
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
          Showing the most important unread notifications based on weight (Placement &gt; Result &gt; Event) and recency.
        </Typography>
        
        <Box sx={{ px: 2 }}>
          <Slider
            value={topN}
            min={3}
            max={20}
            step={1}
            marks={[
              { value: 5, label: '5' },
              { value: 10, label: '10' },
              { value: 15, label: '15' },
              { value: 20, label: '20' },
            ]}
            onChange={handleSliderChange}
            valueLabelDisplay="auto"
            sx={{
              color: '#FFB347',
              '& .MuiSlider-markLabel': { color: 'text.secondary' }
            }}
          />
        </Box>
      </Paper>

      {/* Content */}
      <Box sx={{ minHeight: 400 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        ) : priorityNotifications.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
            <Typography variant="h6">No priority notifications.</Typography>
            <Typography variant="body2">You're all caught up on important updates!</Typography>
          </Box>
        ) : (
          <Box>
            {priorityNotifications.map(({ notification, score }, index) => (
              <Fade in key={notification.ID} style={{ transitionDelay: `${index * 50}ms` }}>
                <Box>
                  <NotificationCard
                    notification={notification}
                    isNew={true} // Priority inbox only shows unread anyway
                    priorityScore={score}
                    rank={index + 1}
                  />
                </Box>
              </Fade>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
