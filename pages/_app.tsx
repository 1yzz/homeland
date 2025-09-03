import React, { useMemo } from 'react'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { useThemeStore } from '../stores/themeStore'
import { lightTheme, darkTheme } from '../theme/theme'
import '../styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  const { isDarkMode } = useThemeStore()
  
  // Memoize theme to prevent unnecessary re-renders
  const theme = useMemo(() => {
    return isDarkMode ? darkTheme : lightTheme
  }, [isDarkMode])

  return (
    <>
      <Head>
        <title>Homeland - Service Management</title>
        <meta name="description" content="Homeland service management dashboard with dark theme support" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content={isDarkMode ? '#0f172a' : '#1976d2'} />
        {/* Default to dark theme for better performance and user experience */}
        
        {/* Performance optimizations */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
      </Head>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Component {...pageProps} />
      </ThemeProvider>
    </>
  )
}
