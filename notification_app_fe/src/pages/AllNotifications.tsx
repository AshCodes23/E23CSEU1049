import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Button,
  Fade,
} from '@mui/material';
import { fetchNotifications } from '../services/api';
import type { NotificationItem } from '../types/notification';
import NotificationCard from '../components/NotificationCard';
import { useViewedNotifications } from '../hooks/useViewedNotifications';

const TABS = ['All', 'Placement', 'Result', 'Event'] as const;

export default function AllNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  const { isViewed, markMultipleAsViewed } = useViewedNotifications();

  // Fetch data
  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const typeFilter = activeTab === 0 ? undefined : TABS[activeTab];
        const data = await fetchNotifications({
          limit: 50,
          notification_type: typeFilter !== 'All' ? typeFilter : undefined,
        });
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
  }, [activeTab]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleMarkAllRead = () => {
    markMultipleAsViewed(notifications.map(n => n.ID));
  };

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !isViewed(n.ID)).length;
  }, [notifications, isViewed]);

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      {/* Header & Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Notifications
          {unreadCount > 0 && (
            <Typography component="span" variant="subtitle1" sx={{ ml: 1, color: 'primary.main', fontWeight: 600 }}>
              ({unreadCount} new)
            </Typography>
          )}
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0 || loading}
          sx={{ borderRadius: 4 }}
        >
          Mark all as read
        </Button>
      </Box>

      {/* Type Filters */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}
        >
          {TABS.map((label) => (
            <Tab key={label} label={label} />
          ))}
        </Tabs>
      </Box>

      {/* Content */}
      <Box sx={{ minHeight: 400 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        ) : notifications.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
            <Typography variant="h6">No notifications found.</Typography>
            <Typography variant="body2">Check back later for updates.</Typography>
          </Box>
        ) : (
          <Box>
            {notifications.map((notif, index) => (
              <Fade in key={notif.ID} style={{ transitionDelay: `${index * 50}ms` }}>
                <Box>
                  <NotificationCard
                    notification={notif}
                    isNew={!isViewed(notif.ID)}
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
