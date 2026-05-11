import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  Badge,
} from '@mui/material';
import {
  WorkOutlined,
  EmojiEvents,
  Assessment,
  FiberNew,
} from '@mui/icons-material';
import type { NotificationItem, NotificationType } from '../types/notification';

/**
 * Color and icon mapping for each notification type.
 */
const TYPE_CONFIG: Record<
  NotificationType,
  { color: string; bgColor: string; icon: React.ReactElement; label: string }
> = {
  Placement: {
    color: '#00D9A6',
    bgColor: 'rgba(0, 217, 166, 0.12)',
    icon: <WorkOutlined />,
    label: 'Placement',
  },
  Result: {
    color: '#6C63FF',
    bgColor: 'rgba(108, 99, 255, 0.12)',
    icon: <Assessment />,
    label: 'Result',
  },
  Event: {
    color: '#FFB347',
    bgColor: 'rgba(255, 179, 71, 0.12)',
    icon: <EmojiEvents />,
    label: 'Event',
  },
};

interface NotificationCardProps {
  notification: NotificationItem;
  isNew: boolean;
  priorityScore?: number;
  rank?: number;
}

/**
 * A single notification card component.
 * Displays type badge, message, timestamp, and a "NEW" indicator
 * for notifications that haven't been viewed yet.
 */
const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  isNew,
  priorityScore,
  rank,
}) => {
  const config = TYPE_CONFIG[notification.Type] || TYPE_CONFIG.Event;

  const formattedDate = new Date(notification.Timestamp).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <Card
      id={`notification-${notification.ID}`}
      sx={{
        mb: 1.5,
        position: 'relative',
        transition: 'all 0.3s ease',
        background: isNew
          ? 'linear-gradient(135deg, rgba(108, 99, 255, 0.08) 0%, rgba(0, 217, 166, 0.05) 100%)'
          : 'rgba(17, 24, 39, 0.6)',
        borderLeft: `4px solid ${config.color}`,
        '&:hover': {
          transform: 'translateX(4px)',
          boxShadow: `0 4px 20px ${config.bgColor}`,
          borderColor: config.color,
        },
      }}
    >
      <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 1,
          }}
        >
          {/* Left section: icon + content */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, flex: 1 }}>
            {/* Rank badge (for priority page) */}
            {rank !== undefined && (
              <Box
                sx={{
                  minWidth: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${config.color}, ${config.color}88)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mt: 0.3,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 700, color: '#fff', fontSize: '0.7rem' }}
                >
                  #{rank}
                </Typography>
              </Box>
            )}

            {/* Type icon */}
            <Box
              sx={{
                color: config.color,
                mt: 0.3,
                display: { xs: 'none', sm: 'block' },
              }}
            >
              {config.icon}
            </Box>

            {/* Content */}
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                <Chip
                  label={config.label}
                  size="small"
                  sx={{
                    backgroundColor: config.bgColor,
                    color: config.color,
                    height: 22,
                    fontSize: '0.7rem',
                  }}
                />
                {isNew && (
                  <Badge
                    sx={{
                      '& .MuiBadge-badge': {
                        position: 'relative',
                        transform: 'none',
                      },
                    }}
                  >
                    <Chip
                      icon={<FiberNew sx={{ fontSize: 14 }} />}
                      label="NEW"
                      size="small"
                      color="error"
                      sx={{
                        height: 22,
                        fontSize: '0.65rem',
                        animation: 'pulse 2s infinite',
                        '@keyframes pulse': {
                          '0%, 100%': { opacity: 1 },
                          '50%': { opacity: 0.7 },
                        },
                      }}
                    />
                  </Badge>
                )}
                {priorityScore !== undefined && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      fontSize: '0.65rem',
                      ml: 'auto',
                    }}
                  >
                    Score: {priorityScore.toFixed(0)}
                  </Typography>
                )}
              </Box>

              <Typography
                variant="body2"
                sx={{
                  color: 'text.primary',
                  fontWeight: isNew ? 600 : 400,
                  lineHeight: 1.4,
                }}
              >
                {notification.Message}
              </Typography>

              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}
              >
                {formattedDate}
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default NotificationCard;
