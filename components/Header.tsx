import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  IconButton,
  Tooltip,
} from '@mui/material'
import { Monitor, Dashboard, Brightness4, Brightness7 } from '@mui/icons-material'
import { useThemeStore } from '../stores/themeStore'

const Header: React.FC = () => {
  const router = useRouter()
  const { isDarkMode, toggleTheme } = useThemeStore()

  const navItems = [
    { path: '/', label: 'Dashboard', icon: <Dashboard /> },
    { path: '/services', label: 'Services', icon: <Monitor /> },
  ]

  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}
          >
            <Monitor sx={{ mr: 1 }} />
            Homeland
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {navItems.map((item) => (
              <Link key={item.path} href={item.path} style={{ textDecoration: 'none' }}>
                <Button
                  startIcon={item.icon}
                  sx={{
                    color: 'white',
                    backgroundColor: router.pathname === item.path ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    },
                  }}
                >
                  {item.label}
                </Button>
              </Link>
            ))}
            
            {/* Theme Toggle Button */}
            <Tooltip title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              <IconButton
                onClick={toggleTheme}
                sx={{
                  color: 'white',
                  ml: 1,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                {isDarkMode ? <Brightness7 /> : <Brightness4 />}
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  )
}

export default Header
