import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Box, Container } from '@mui/material'
import Header from './components/Header'
import ServiceManager from './components/ServiceManager'
import Dashboard from './components/Dashboard'

function App() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <Container component="main" sx={{ flexGrow: 1, py: 3 }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/services" element={<ServiceManager />} />
        </Routes>
      </Container>
    </Box>
  )
}

export default App
