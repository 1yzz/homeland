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
} from '@mui/material'
import { Monitor, Dashboard } from '@mui/icons-material'

const Header: React.FC = () => {
  const router = useRouter()

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
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            {navItems.map((item) => (
              <Link key={item.path} href={item.path} passHref legacyBehavior>
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
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  )
}

export default Header
