import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  Container,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  PriorityHigh,
  School,
} from '@mui/icons-material';

interface LayoutProps {
  children: React.ReactNode;
}

/**
 * Main layout wrapper with a responsive navigation bar.
 * Provides navigation between All Notifications and Priority Inbox pages.
 */
const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const navItems = [
    { label: 'All Notifications', path: '/', icon: <NotificationsIcon /> },
    { label: 'Priority Inbox', path: '/priority', icon: <PriorityHigh /> },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #111827 0%, #1a1f36 100%)',
          borderBottom: '1px solid rgba(108, 99, 255, 0.2)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ gap: 1 }}>
            {/* Logo */}
            <IconButton
              onClick={() => navigate('/')}
              sx={{
                color: 'primary.main',
                mr: 1,
              }}
            >
              <School fontSize="large" />
            </IconButton>

            {!isMobile && (
              <Typography
                variant="h6"
                sx={{
                  background: 'linear-gradient(90deg, #6C63FF, #00D9A6)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 700,
                  mr: 3,
                }}
              >
                Campus Notify
              </Typography>
            )}

            {/* Navigation buttons */}
            <Box sx={{ display: 'flex', gap: 1, flex: 1 }}>
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  startIcon={!isMobile ? item.icon : undefined}
                  onClick={() => navigate(item.path)}
                  variant={location.pathname === item.path ? 'contained' : 'text'}
                  size={isMobile ? 'small' : 'medium'}
                  sx={{
                    color:
                      location.pathname === item.path
                        ? '#fff'
                        : 'text.secondary',
                    bgcolor:
                      location.pathname === item.path
                        ? 'primary.main'
                        : 'transparent',
                    fontSize: isMobile ? '0.7rem' : '0.85rem',
                    '&:hover': {
                      bgcolor:
                        location.pathname === item.path
                          ? 'primary.dark'
                          : 'rgba(108, 99, 255, 0.1)',
                    },
                  }}
                >
                  {isMobile ? item.label.split(' ')[0] : item.label}
                </Button>
              ))}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Page content */}
      <Container maxWidth="lg" sx={{ py: 3 }}>
        {children}
      </Container>
    </Box>
  );
};

export default Layout;
